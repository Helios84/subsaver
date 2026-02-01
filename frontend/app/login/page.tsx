"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "../lib/api";
import { Layers, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

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
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo/Brand */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 group z-10">
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg p-1.5 shadow-lg group-hover:scale-110 transition-transform">
          <Image src="/logo.png" alt="SubSaver Logo" width={24} height={24} className="w-6 h-6 rounded" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Sub<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Saver</span>
        </span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-2xl p-8 lg:p-10 border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-400">
              Log in to access your savings dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10 pointer-events-none" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  style={{ paddingLeft: '3rem' }}
                  className="w-full pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/10 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none transition text-sm"
                  placeholder="you@edu.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10 pointer-events-none" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  style={{ paddingLeft: '3rem' }}
                  className="w-full pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/10 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none transition text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-3.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 mt-6"
            >
              Log in
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {msg && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {msg}
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              Don&apos;t have an account?{" "}
              <Link className="text-violet-400 font-semibold hover:text-violet-300 transition-colors" href="/register">
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
