"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Invalid password");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f2]">
      <div className="w-full max-w-sm px-6">
        <div className="relative mb-8 inline-flex items-center gap-2 border border-dashed border-black/10 px-4 py-3">
          <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
          <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
          <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
          <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
          <span className="text-lg">&#x2726;</span>
          <span className="font-lato text-[14px] font-bold tracking-[-0.42px] text-[#121212]">
            CMS Login
          </span>
        </div>

        <h1 className="mb-2 text-center font-instrument-serif text-[32px] tracking-[-0.96px] text-[#121212]">
          Dashboard Access
        </h1>
        <p className="mb-8 text-center text-[15px] text-black/50">
          Enter your password to manage content.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="h-[48px] rounded-[12px] border border-black/10 bg-white px-4 font-tight text-[15px] text-[#121212] outline-none transition-colors focus:border-black/30 placeholder:text-black/30"
          />
          {error && (
            <p className="text-[13px] text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-[48px] rounded-[12px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
