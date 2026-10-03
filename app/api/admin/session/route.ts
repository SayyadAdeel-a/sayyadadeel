/**
 * `GET /api/admin/session` — is the caller signed in?
 *
 * Used by the admin shell to decide between the login screen and the editor, and
 * by the publish route as its guard. It reports *whether publishing is possible*
 * as well, because a valid session with no GitHub token can still do nothing —
 * better to say so on the status panel than to fail at save time.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import { isConfigured, repoConfig } from "@/lib/admin/github";

export const dynamic = "force-dynamic";

export async function GET() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const authenticated = Boolean(
    secret && (await verifySessionToken(secret, token))
  );

  if (!authenticated) {
    return Response.json({ authenticated: false });
  }

  const repo = repoConfig();

  return Response.json({
    authenticated: true,
    publishReady: isConfigured(),
    // The repository is public information already visible in the Git remote;
    // naming it here makes the status panel honest about where Save will go.
    target: repo ? repo.owner + "/" + repo.repo + "@" + repo.branch : null,
  });
}