/**
 * Admin authentication: password check and stateless session cookies.
 *
 * Design constraints, all deliberate:
 *
 *  * **No database.** The store is GitHub — edits become a commit. So there is
 *    nowhere to keep server-side sessions, and the session has to be
 *    self-contained: an HMAC-signed cookie whose payload is just an expiry.
 *  * **Credentials never leave the server.** The password is read from
 *    `ADMIN_PASSWORD` and compared with a constant-time comparison. The GitHub
 *    token is read from `GITHUB_TOKEN` inside the publish route only, so the
 *    browser never holds a credential that can write to the repository.
 *  * **The cookie is not readable by JavaScript.** `HttpOnly` keeps it away from
 *    XSS; `SameSite=Lax` blocks cross-site POSTs; `Secure` in production.
 *
 * Signing uses Web Crypto (available in the Vercel/Edge runtimes) rather than
 * Node's `crypto`, so the same code works on either runtime.
 */

const encoder = new TextEncoder();

/** Session lifetime. Short by design: re-login is cheap, a stolen cookie is not. */
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export const SESSION_COOKIE = "relab_admin_session";

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  // An ArrayBuffer rather than a Uint8Array: it is accepted directly as Web
  // Crypto's `BufferSource` on every TypeScript release, where the generic
  // `Uint8Array<ArrayBufferLike>` is not.
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Constant-time string comparison.
 *
 * `===` on strings short-circuits at the first differing byte, which leaks the
 * length of the matching prefix through timing. The password is compared byte by
 * byte with no early exit, and the lengths are folded in first.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Sign a session token: `<expiry>.<hmac>`. */
export async function createSessionToken(secret: string): Promise<string> {
  const expiry = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = String(expiry);
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(payload)
  );
  return `${payload}.${base64url(new Uint8Array(signature))}`;
}

/** Verify a session token, returning true only if it is signed and unexpired. */
export async function verifySessionToken(
  secret: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64url(signature),
      encoder.encode(payload)
    );
  } catch {
    return false;
  }
  if (!valid) return false;
  const expiry = Number(payload);
  return Number.isFinite(expiry) && Date.now() < expiry;
}

/**
 * Check a submitted password against `ADMIN_PASSWORD`.
 *
 * Returns false rather than throwing when the env var is missing: a deployment
 * that forgot to set it must fail closed, never open.
 */
export function checkPassword(submitted: string | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !submitted) return false;
  return timingSafeEqual(submitted, expected);
}

/** Cookie attributes shared by every admin response. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}