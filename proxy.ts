import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";

/**
 * Keeps unauthenticated requests out of the editor before anything renders.
 *
 * ## Why this exists rather than relying on `app/admin/layout.tsx`
 *
 * The layout gate was not enough, and the failure was silent. In the App Router a
 * layout receives its `children` *already rendered*: the page component runs
 * first and its output is serialised into the flight payload, and only then does
 * the layout decide what to show. Returning the sign-in form therefore stopped the
 * user seeing the page, but the entire page was still rendered and still shipped
 * in the HTML — verifiable by grepping an unauthenticated response for the page's
 * own copy. Proxy runs before rendering, so the page module never executes.
 *
 * ## What this is and is not
 *
 * This is a fast rejection, not the security boundary. It reads the signed cookie
 * and nothing else, and it can be bypassed by anything that talks to the publish
 * route directly — so `publish` and `upload` each verify the session again,
 * immediately before writing. The docs are explicit that most security checks
 * belong next to the data source; this one exists to avoid doing pointless work
 * and to avoid emitting content to callers who cannot use it.
 *
 * `/admin` itself is outside the matcher, so the sign-in form stays reachable.
 * `/api/admin/*` is deliberately not matched: those handlers do their own checks
 * and must keep doing so.
 */
export async function proxy(request: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (secret && (await verifySessionToken(secret, token))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}

export const config = {
  matcher: "/admin/:path+",
};