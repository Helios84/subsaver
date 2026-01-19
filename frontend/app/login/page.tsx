"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../lib/api";
import { TrendingUp, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("subsaver_token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setMsg(err?.message ?? "Network error");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      {/* Logo/Brand */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 group">
        <div className="bg-red-600 rounded-lg p-1.5 shadow-md group-hover:scale-110 transition-transform">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">
          Sub<span className="text-red-600">Saver</span>
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 lg:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">
              Log in to access your subscription dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  style={{ paddingLeft: '3rem' }}
                  className="w-full pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  style={{ paddingLeft: '3rem' }}
                  className="w-full pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 mt-6"
            >
              Log in
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {msg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{msg}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Don&apos;t have an account?{" "}
              <Link className="text-red-600 font-semibold hover:text-red-700 transition-colors" href="/register">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By logging in, you agree to our Terms of Service
        </p>
      </div>
    </main>
  );
}
