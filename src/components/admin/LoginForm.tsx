"use client";

/**
 * Password-only sign-in.
 *
 * There is no username field by design: the request was for a single secret, and
 * one field is one fewer thing to phish. The password never leaves this form
 * except to `POST /api/admin/login`, which compares it server-side against
 * `ADMIN_PASSWORD` and returns a signed cookie.
 *
 * Failure messages are deliberately identical whether the password was wrong or
 * the origin is rate-limited, so this form cannot be used to probe for a valid
 * password. The lockout case does reveal that it is a lockout, because that is
 * actionable information for whoever is trying to sign in, not a secret.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !body.ok) {
        setError(body.error ?? "Could not sign in.");
        return;
      }

      // The session cookie is HttpOnly and was just set by the API call, so the
      // router has to go back to the server for a payload rendered with it —
      // `refresh()` discards the signed-out response it may have cached.
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adm-login" onSubmit={submit}>
      <h1>Relab editor</h1>
      <p className="adm-login-sub">Enter the site password to edit pages.</p>

      <label className="adm-login-field">
        <span className="adm-visually-hidden">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>

      {error && (
        <p className="adm-login-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="adm-btn adm-btn-go" disabled={busy}>
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}