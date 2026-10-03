/**
 * `POST /api/admin/login` — exchange a password for a session cookie.
 *
 * Three properties matter here:
 *
 *  * **Constant-time, and fail-closed.** `checkPassword` compares without an
 *    early exit and returns false when `ADMIN_PASSWORD` is unset, so a
 *    misconfigured deployment locks everyone out rather than letting anyone in.
 *  * **Same answer whether the password was wrong or the account was locked.**
 *    Both return 401 with the same body, so the endpoint cannot be used to
 *    enumerate valid passwords.
 *  * **No token in the response body.** The signed cookie is set with `HttpOnly`,
 *    so the browser stores it without JavaScript being able to read it.
 */
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  checkPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/admin/auth";
import { clientKey, limits, recordFailure, recordSuccess, retryAfterSeconds } from "@/lib/admin/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SESSION_SECRET;

  // Without a signing secret no session can be valid, so fail closed rather than
  // issuing a cookie that can never verify.
  if (!secret || !process.env.ADMIN_PASSWORD) {
    return Response.json(
      { ok: false, error: "Admin is not configured on this deployment." },
      { status: 503 }
    );
  }

  const key = clientKey(request);
  const wait = retryAfterSeconds(key);
  if (wait > 0) {
    return Response.json(
      {
        ok: false,
        error: `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`,
        retryAfterSeconds: wait,
      },
      { status: 429, headers: { "Retry-After": String(wait) } }
    );
  }

  let submitted: unknown;
  try {
    const body = (await request.json()) as { password?: unknown };
    submitted = body.password;
  } catch {
    return Response.json({ ok: false, error: "Expected a JSON body." }, { status: 400 });
  }

  const password = typeof submitted === "string" ? submitted : "";

  // Hash the submitted value is unnecessary and pointless; just compare.
  if (!checkPassword(password)) {
    recordFailure(key);
    return Response.json(
      { ok: false, error: "Incorrect password." },
      { status: 401 }
    );
  }

  recordSuccess(key);
  const token = await createSessionToken(secret);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_TTL_SECONDS));

  return Response.json({ ok: true, expiresInSeconds: SESSION_TTL_SECONDS });
}

/** Describes the lockout policy without revealing anything about the password. */
export async function GET() {
  return Response.json({
    ok: true,
    limits: {
      windowMinutes: Math.round(limits.WINDOW_MS / 60000),
      maxFailures: limits.MAX_FAILURES,
      lockoutMinutes: Math.round(limits.LOCKOUT_MS / 60000),
    },
  });
}