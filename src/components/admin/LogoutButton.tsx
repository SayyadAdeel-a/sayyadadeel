"use client";

import { useRouter } from "next/navigation";

/** Ends the session. The cookie is HttpOnly, so this has to go through the API. */
export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="adm-btn adm-btn-ghost"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        // `refresh()` because the cookie is HttpOnly: the cached payload was
        // rendered with it, and only a server round trip will show the gate.
        router.replace("/admin");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}