/**
 * `POST /api/admin/logout` — drop the session cookie.
 *
 * Expiry is set explicitly rather than relying on the browser: a cookie whose
 * value is empty and whose `maxAge` is 0 is removed by every mainstream browser,
 * whereas omitting attributes can leave a scoped copy behind.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  (await cookies()).set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return Response.json({ ok: true });
}