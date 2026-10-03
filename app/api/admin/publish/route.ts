/**
 * `POST /api/admin/publish` — turn the editor's pending changes into a commit.
 *
 * ## Flow
 *
 *   1. Authenticate. No valid session, no write.
 *   2. Read each target file's **current** content from GitHub, not from this
 *      server's bundled snapshot. The deployed function is a build artifact that
 *      goes stale the moment anything is committed; editing against it would
 *      silently resurrect old content and clobber newer edits.
 *   3. Apply every change to that fresh content with the codemod.
 *   4. Commit all files in one atomic commit.
 *
 * Vercel is connected to the repository, so step 4 is what triggers the deploy.
 * There is no separate publish API to call.
 *
 * ## Failure behaviour
 *
 * All-or-nothing, deliberately. If any element cannot be resolved uniquely the
 * request fails and **nothing** is written, and the offending element is named
 * back to the browser. A CMS that half-applies a save and reports success is
 * worse than one that refuses: the operator believes the site says something it
 * does not.
 */
import { cookies } from "next/headers";
import {
  PatchError,
  applyChanges,
  isSafeRepoPath,
  type EditChange,
  type EditKind,
} from "@/lib/admin/codemod";
import {
  GitHubError,
  commitFiles,
  decodeContent,
  getFile,
  repoConfig,
  type CommitFile,
} from "@/lib/admin/github";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
/** GitHub round-trips dominate; the default 10s function budget is too tight. */
export const maxDuration = 60;

const KINDS: EditKind[] = ["text", "src", "href", "alt"];

/** Cap a single save so a runaway client cannot try to rewrite the whole site. */
const MAX_CHANGES = 500;
const MAX_VALUE_LENGTH = 20_000;

interface IncomingChange {
  file?: unknown;
  node?: unknown;
  kind?: unknown;
  value?: unknown;
}

function validate(raw: unknown): EditChange[] {
  if (!Array.isArray(raw)) {
    throw new HttpError(400, "Expected an array of changes.");
  }
  if (raw.length === 0) {
    throw new HttpError(400, "There are no changes to publish.");
  }
  if (raw.length > MAX_CHANGES) {
    throw new HttpError(
      400,
      `Too many changes in one save (${raw.length}). Publish in smaller batches.`
    );
  }

  return raw.map((entry: IncomingChange, index) => {
    const at = `Change ${index + 1}`;
    const file = typeof entry?.file === "string" ? entry.file : "";
    const node = typeof entry?.node === "string" ? entry.node : "";
    const kind = entry?.kind as EditKind;
    const value = typeof entry?.value === "string" ? entry.value : null;

    if (!isSafeRepoPath(file)) {
      throw new HttpError(400, `${at}: "${file}" is not a file that can be edited.`);
    }
    if (!node || node.length > 400) {
      throw new HttpError(400, `${at}: missing or malformed element address.`);
    }
    if (!KINDS.includes(kind)) {
      throw new HttpError(400, `${at}: "${String(kind)}" is not an editable property.`);
    }
    if (value === null) {
      throw new HttpError(400, `${at}: missing value.`);
    }
    if (value.length > MAX_VALUE_LENGTH) {
      throw new HttpError(
        400,
        `${at}: ${value.length} characters is over the ${MAX_VALUE_LENGTH} limit.`
      );
    }
    return { file, node, kind, value };
  });
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret || !(await verifySessionToken(secret, token))) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const config = repoConfig();
  const githubToken = process.env.GITHUB_TOKEN;

  let changes: EditChange[];
  let message: string;
  try {
    const body = (await request.json()) as { changes?: unknown; message?: unknown };
    // Validate the request before anything else. It is the only step that cannot
    // be helped by configuration, and a malformed path should be rejected as a bad
    // request whether or not publishing happens to be set up.
    changes = validate(body.changes);
    message =
      typeof body.message === "string" && body.message.trim()
        ? body.message.trim().slice(0, 120)
        : "Update content via the admin editor";
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json({ ok: false, error: error.message }, { status: error.status });
    }
    return Response.json(
      { ok: false, error: "Could not read the request body." },
      { status: 400 }
    );
  }

  if (!config || !githubToken) {
    return Response.json(
      {
        ok: false,
        error:
          "Publishing is not configured. Set GITHUB_TOKEN, GITHUB_REPO_OWNER and GITHUB_REPO_NAME on the deployment.",
      },
      { status: 503 }
    );
  }

  try {
    // Group by file so each is fetched and patched once.
    const byFile = new Map<string, EditChange[]>();
    for (const change of changes) {
      const list = byFile.get(change.file);
      if (list) list.push(change);
      else byFile.set(change.file, [change]);
    }

    const results: CommitFile[] = [];
    const touched: { file: string; changes: number }[] = [];

    for (const [file, fileChanges] of byFile) {
      const existing = await getFile(config, githubToken, file);
      if (!existing) {
        throw new HttpError(
          404,
          `${file} was not found in ${config.owner}/${config.repo}. Reload the editor.`
        );
      }

      const current = decodeContent(existing);
      const patched = applyChanges(current, fileChanges);

      // Nothing to do for this file — another concurrent save already landed it.
      if (patched.changed === 0) {
        continue;
      }

      results.push({ path: file, content: patched.content });
      touched.push({ file, changes: patched.changed });
    }

    if (results.length === 0) {
      return Response.json({
        ok: true,
        unchanged: true,
        error: "Nothing to commit — those edits were already published.",
      });
    }

    const summary =
      message +
      "\n\nEdited with the admin editor:\n" +
      touched.map((line) => `- ${line.file} (${line.changes} change${line.changes === 1 ? "" : "s"})`).join("\n");

    const outcome = await commitFiles(config, githubToken, results, summary);

    return Response.json({
      ok: true,
      commitSha: outcome.commitSha,
      commitUrl: outcome.commitUrl,
      filesChanged: results.length,
      changes: touched.reduce((total, line) => total + line.changes, 0),
      // Vercel builds from the commit; there is no separate publish step.
      deployTriggered: true,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof PatchError) {
      return Response.json(
        {
          ok: false,
          error: error.message,
          file: error.file,
          node: error.node,
          // Nothing was written, so the operator can safely reload and retry.
          recoverable: true,
        },
        { status: 409 }
      );
    }
    if (error instanceof GitHubError) {
      const conflict = error.status === 409 || error.status === 422;
      return Response.json(
        {
          ok: false,
          error: conflict
            ? "Someone else saved changes to the same file a moment ago. Reload the page to pick up the current version, then reapply your edit."
            : error.message,
          recoverable: conflict,
        },
        { status: conflict ? 409 : 502 }
      );
    }

    // Never leak a stack trace or a token-bearing message to the browser.
    return Response.json(
      {
        ok: false,
        error:
          "Publishing failed unexpectedly. Nothing was changed — check the repository's Actions log for details.",
      },
      { status: 500 }
    );
  }
}