import type { Metadata } from "next";
import { cookies } from "next/headers";
import LoginForm from "@/components/admin/LoginForm";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import "./admin.css";

/**
 * Every admin route is a request-time render, and none of them is cached or
 * indexed. This is the outer gate: without a valid session the whole subtree is
 * replaced by the sign-in form.
 *
 * It is a convenience layer, not the security boundary. The publish and upload
 * handlers verify the session themselves, immediately before writing to GitHub,
 * because that check has to be next to the data — a cookie that is valid now can
 * be revoked before a request built from an open tab is sent.
 *
 * Note that this layout nests under the site's root layout, so the admin already
 * inherits `webflow.css`, the four self-hosted font families and the smooth
 * scroll provider. That is what makes the editing preview look like the site
 * without importing the stylesheet twice.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editor · Relab",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const authenticated = Boolean(secret && (await verifySessionToken(secret, token)));

  if (!authenticated) {
    return (
      <main className="adm-gate">
        <LoginForm />
      </main>
    );
  }

  return <>{children}</>;
}