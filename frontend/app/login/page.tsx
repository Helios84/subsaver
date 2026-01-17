"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.detail ?? "Login failed");
        return;
      }

      localStorage.setItem("subsaver_token", data.token);
      router.push("/dashboard");
    } catch {
      setMsg("Network error");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold mb-1">Log in</h1>
        <p className="text-sm text-white/60 mb-6">
          Access your SubSaver dashboard.
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
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white text-black font-medium py-2"
          >
            Log in
          </button>
        </form>

        {msg && <p className="text-sm text-white/70 mt-4">{msg}</p>}

        <p className="text-sm text-white/60 mt-4">
          Don&apos;t have an account?{" "}
          <Link className="underline" href="/register">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
