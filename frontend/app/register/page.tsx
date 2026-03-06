"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, Sparkles, CheckCircle2, GraduationCap, Zap, Star } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  const perks = [
    "Find student discounts automatically",
    "Track all subscriptions in one place",
    "Get renewal reminders before billing",
    "Split costs with roommates easily",
  ];

  return (
    <main className="min-h-screen flex text-white" style={{ background: "#080B14" }}>

      {/* ── Left: Aurora Art Panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0D0A1E 0%, #120D2B 50%, #0D1117 100%)" }}>

        <div className="absolute inset-0">
          <div className="aurora-blob animate-aurora-2 animate-aurora-pulse" style={{
            width: "550px", height: "550px",
            background: "radial-gradient(circle, rgba(217,70,239,0.4) 0%, rgba(217,70,239,0.04) 65%)",
            top: "5%", right: "-5%",
          }} />
          <div className="aurora-blob animate-aurora-1" style={{
            width: "480px", height: "480px",
            background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(124,58,237,0.04) 65%)",
            bottom: "10%", left: "-5%",
          }} />
          <div className="aurora-blob animate-aurora-3" style={{
            width: "300px", height: "300px",
            background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 65%)",
            top: "45%", left: "45%",
          }} />
        </div>

        <div className="relative z-10 p-16 max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5">
              <Image src="/logo.png" alt="SubSaver" width={24} height={24} className="w-6 h-6 rounded" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub<span className="gradient-text">Saver</span>
            </span>
          </Link>

          <div className="liquid-badge mb-6 inline-flex">
            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
            <span>Join 10,000+ Students</span>
          </div>

          <h2 className="text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
            Start saving in under 2 minutes
          </h2>
          <p className="text-white/40 mb-10 leading-relaxed">
            Free forever for students. No credit card needed.
          </p>

          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-sm text-white/60">{perk}</span>
              </div>
            ))}
          </div>

          {/* Stat block */}
          <div className="mt-10 liquid-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-violet-300" />
              </div>
              <div>
                <p className="text-2xl font-black gradient-text" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>$847</p>
                <p className="text-xs text-white/40">average saved per student per year</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Register Form ── */}
      <div className="flex-1 lg:max-w-[520px] flex flex-col items-center justify-center px-8 py-12 relative">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5">
              <Image src="/logo.png" alt="SubSaver" width={24} height={24} className="w-6 h-6 rounded" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub<span className="gradient-text">Saver</span>
            </span>
          </Link>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="aurora-blob animate-aurora-3" style={{
            width: "400px", height: "400px",
            background: "radial-gradient(circle, rgba(217,70,239,0.07) 0%, transparent 70%)",
            top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6 group">
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Create account
            </h1>
            <p className="text-white/40">Start saving money in under 2 minutes</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Student Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" style={{ width: "18px", height: "18px" }} />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="liquid-input w-full rounded-xl text-sm py-3.5"
                  style={{ paddingLeft: "2.75rem", paddingRight: "1rem" }}
                  placeholder="you@edu.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" style={{ width: "18px", height: "18px" }} />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="liquid-input w-full rounded-xl text-sm py-3.5"
                  style={{ paddingLeft: "2.75rem", paddingRight: "1rem" }}
                  placeholder="••••••••"
                  required
                />
              </div>
              <p className="text-xs text-white/25 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50" />
                At least 6 characters
              </p>
            </div>

            {/* Error */}
            {msg && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl"
                style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400 font-medium">{msg}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="liquid-btn w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create free account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-white/35 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
                Log in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-white/20 mt-6">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </main>
  );
}
