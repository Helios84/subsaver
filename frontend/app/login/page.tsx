"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "../lib/api";
import { Mail, Lock, ArrowRight, Sparkles, Shield, Zap, Star, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  type ForgotStage = "login" | "email" | "code" | "password" | "success";
  const [forgotStage, setForgotStage] = useState<ForgotStage>("login");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("subsaver_token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setMsg(err?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) {
      setMsg("Please enter your email first");
      return;
    }
    setMsg("");
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setForgotStage("code");
      setMsg("✅ If the email exists, a reset code was sent.");
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (resetCode.length !== 6) {
      setMsg("Please enter the 6-digit code");
      return;
    }
    setMsg("");
    setLoading(true);
    try {
      await apiFetch("/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ email, code: resetCode }),
      });
      setMsg("");
      setForgotStage("password");
    } catch (err: any) {
      setMsg(err?.message ?? "Invalid reset code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }
    setMsg("");
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code: resetCode, new_password: newPassword }),
      });
      setForgotStage("success");
      setMsg("");
      setPassword("");
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex text-white" style={{ background: "#080B14" }}>

      {/* ── Left: Aurora Art Panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0D0A1E 0%, #120D2B 50%, #0D1117 100%)" }}>

        {/* Aurora blobs */}
        <div className="absolute inset-0">
          <div className="aurora-blob animate-aurora-1 animate-aurora-pulse" style={{
            width: "500px", height: "500px",
            background: "radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0.05) 65%)",
            top: "10%", left: "5%",
          }} />
          <div className="aurora-blob animate-aurora-2" style={{
            width: "450px", height: "450px",
            background: "radial-gradient(circle, rgba(217,70,239,0.35) 0%, rgba(217,70,239,0.04) 65%)",
            bottom: "5%", right: "5%",
          }} />
          <div className="aurora-blob animate-aurora-3" style={{
            width: "300px", height: "300px",
            background: "radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 65%)",
            top: "50%", left: "40%",
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 p-16 max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5">
              <Image src="/logo.png" alt="SubSaver" width={24} height={24} className="w-6 h-6 rounded" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub<span className="gradient-text">Saver</span>
            </span>
          </Link>

          <h2 className="text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
            Welcome back to your savings hub
          </h2>
          <p className="text-white/40 mb-12 leading-relaxed">
            Pick up where you left off. Your subscriptions and savings are waiting.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: Shield, text: "Bank-grade encrypted data" },
              { icon: Zap, text: "Real-time discount finder" },
              { icon: Star, text: "Average $847 saved per year" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 liquid-card rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm text-white/65 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
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

        {/* Subtle background for form side */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="aurora-blob animate-aurora-3" style={{
            width: "400px", height: "400px",
            background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
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
              {forgotStage === "login" && "Log in"}
              {forgotStage === "email" && "Reset Password"}
              {forgotStage === "code" && "Verify Code"}
              {forgotStage === "password" && "Set New Password"}
              {forgotStage === "success" && "Password Updated"}
            </h1>
            <p className="text-white/40">
              {forgotStage === "login" && "Access your savings dashboard"}
              {forgotStage === "email" && "We'll send a recovery code to your email"}
              {forgotStage === "code" && "Enter the 6-digit code sent to your email"}
              {forgotStage === "password" && "Create a new strong password"}
              {forgotStage === "success" && "Your password has been successfully reset."}
            </p>
          </div>

          {forgotStage === "success" ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-center text-white/60 mb-8">
                You can now log in to your account with your new password. We've also sent you an email confirming this change.
              </p>
              <button
                onClick={() => {
                  setForgotStage("login");
                  setMsg("");
                  setResetCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="liquid-btn w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
              >
                Return to Log In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={
                forgotStage === "email" ? handleForgotPassword :
                  forgotStage === "code" ? handleVerifyCode :
                    forgotStage === "password" ? handleResetPassword :
                      onSubmit
              }
              className="space-y-4"
            >
              {/* Email (Always needed for login and forgot, but read-only in code/password phase) */}
              {(forgotStage === "login" || forgotStage === "email") && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30 pointer-events-none z-10" style={{ width: "18px", height: "18px" }} />
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
              )}

              {/* Password (Only if Logging In) */}
              {forgotStage === "login" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStage("email");
                        setMsg("");
                      }}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                </div>
              )}

              {/* Stage 2: Reset Code */}
              {forgotStage === "code" && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    6-Digit Code
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none z-10" style={{ width: "18px", height: "18px" }} />
                    <input
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      type="text"
                      maxLength={6}
                      className="liquid-input w-full rounded-xl text-sm py-3.5"
                      style={{ paddingLeft: "2.75rem", paddingRight: "1rem", letterSpacing: "2px" }}
                      placeholder="123456"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Stage 3: New Password */}
              {forgotStage === "password" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" style={{ width: "18px", height: "18px" }} />
                      <input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type={showPassword1 ? "text" : "password"}
                        className="liquid-input w-full rounded-xl text-sm py-3.5"
                        style={{ paddingLeft: "2.75rem", paddingRight: "2.5rem" }}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPassword1(!showPassword1)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors z-10">
                        {showPassword1 ? <EyeOff style={{ width: "18px", height: "18px" }} /> : <Eye style={{ width: "18px", height: "18px" }} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" style={{ width: "18px", height: "18px" }} />
                      <input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type={showPassword2 ? "text" : "password"}
                        className="liquid-input w-full rounded-xl text-sm py-3.5"
                        style={{ paddingLeft: "2.75rem", paddingRight: "2.5rem" }}
                        placeholder="Verify password"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors z-10">
                        {showPassword2 ? <EyeOff style={{ width: "18px", height: "18px" }} /> : <Eye style={{ width: "18px", height: "18px" }} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error / Msg */}
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
                  <>
                    {forgotStage === "login" && "Log in"}
                    {forgotStage === "email" && "Send Recovery Code"}
                    {forgotStage === "code" && "Verify Code"}
                    {forgotStage === "password" && "Save Password"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {forgotStage !== "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotStage("login");
                    setMsg("");
                    setResetCode("");
                  }}
                  className="w-full text-center text-sm text-white/40 hover:text-white transition-colors mt-4 block"
                >
                  Cancel and return to log in
                </button>
              )}
            </form>
          )}

          <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-white/35 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
                Create one free
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-white/20 mt-6">
            By logging in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </main>
  );
}
