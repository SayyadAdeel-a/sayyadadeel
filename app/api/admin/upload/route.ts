/**
 * `POST /api/admin/upload` — add an image to the site.
 *
 * There is no object store and no database, so an uploaded image is committed to
 * the repository, which is already the thing Vercel deploys from. The returned
 * path is a normal site-root path (`public/...`), so it drops straight into the
 * editor as a `src` value with no special-casing anywhere else.
 *
 * Images are committed on their own rather than being bundled into the next Save.
 * That keeps each image cheap to retry, and means a failed text publish does not
 * also roll back the picture — although it does mean an abandoned upload leaves
 * an orphan asset in the repo, which is harmless and easy to delete.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import { commitBinary, getFile, repoConfig } from "@/lib/admin/github";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel's request body limit is 4.5 MB; stay under it with room for base64. */
const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const FOLDER = "public/uploads";

/** A filesystem-safe, collision-resistant name that keeps the original stem. */
function fileName(original: string, extension: string): string {
  const stem = (original.replace(/\.[^.]+$/, "") || "image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return stem + "-" + unique + "." + extension;
}

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret || !(await verifySessionToken(secret, token))) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const config = repoConfig();
  const githubToken = process.env.GITHUB_TOKEN;
  if (!config || !githubToken) {
    return Response.json(
      { ok: false, error: "Uploads are not configured on this deployment." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "Expected a multipart form." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "No file was provided." }, { status: 400 });
  }

  const extension = ALLOWED[file.type];
  if (!extension) {
    return Response.json(
      {
        ok: false,
        error:
          "That file type is not supported. Use PNG, JPEG, WebP, AVIF, GIF or SVG.",
      },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      {
        ok: false,
        error: `Images must be under ${Math.round(MAX_BYTES / 1024 / 1024)} MB — that one is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      },
      { status: 413 }
    );
  }

  const path = FOLDER + "/" + fileName(file.name, extension);
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    // If a name collided, add a counter rather than overwriting an existing
    // image that other pages may already reference.
    let target = path;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!(await getFile(config, githubToken, target))) break;
      const dot = target.lastIndexOf(".");
      target = target.slice(0, dot) + "-" + attempt + target.slice(dot);
    }

    const outcome = await commitBinary(
      config,
      githubToken,
      target,
      bytes,
      "Add uploaded image " + (file.name || target)
    );

    return Response.json({
      ok: true,
      /** Site-root path, ready to be used as an image `src`. */
      path: "/" + target,
      commitUrl: outcome.commitUrl,
      bytes: file.size,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "The upload could not be saved.";
    return Response.json(
      {
        ok: false,
        error: message + " Nothing was added — you can try again.",
      },
      { status: 502 }
    );
  }
}