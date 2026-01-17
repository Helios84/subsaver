"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.detail ?? "Register failed");
        return;
      }

      router.push("/login");
    } catch {
      setMsg("Network error");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-sm text-white/60 mb-6">
          Start tracking subscriptions in minutes.
        </p>

        {/* IMPORTANT: only ONE form */}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 outline-none"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white text-black font-medium py-2"
          >
            Create account
          </button>
        </form>

        {msg && <p className="text-sm text-white/70 mt-4">{msg}</p>}

        <p className="text-sm text-white/60 mt-4">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
