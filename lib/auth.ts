import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PASSWORD = process.env.CMS_PASSWORD || "adeel2026";
const SESSION_COOKIE = "cms_session";
const SESSION_SECRET = process.env.CMS_SESSION_SECRET || "xK9m2pL8vN3qR7wB";

export async function createSession(): Promise<string> {
  const payload = JSON.stringify({ auth: true, ts: Date.now() });
  const encoded = Buffer.from(payload).toString("base64");
  const signature = Buffer.from(`${encoded}:${SESSION_SECRET}`).toString("base64");
  return `${encoded}.${signature}`;
}

export async function validateSession(token: string): Promise<boolean> {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return false;
    const expectedSig = Buffer.from(`${encoded}:${SESSION_SECRET}`).toString("base64");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(encoded, "base64").toString());
    return payload.auth === true;
  } catch {
    return false;
  }
}

export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return false;
  return validateSession(session.value);
}

export async function requireAuth(): Promise<void> {
  const isAuth = await checkAuth();
  if (!isAuth) {
    redirect("/dashboard/login");
  }
}

export function verifyPassword(password: string): boolean {
  return password === PASSWORD;
}
