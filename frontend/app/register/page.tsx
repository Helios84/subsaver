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
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-600">
            Start tracking subscriptions in minutes
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition shadow-sm"
          >
            Create account
          </button>
        </form>

        {msg && (
          <p className="text-sm text-red-600 mt-4 bg-red-50 p-3 rounded-lg">
            {msg}
          </p>
        )}

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already have an account?{" "}
          <Link className="text-red-600 font-medium hover:text-red-700 underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
