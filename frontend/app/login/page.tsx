"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "../lib/api";
import { Mail, Lock, ArrowRight, Sparkles, Shield, Zap, Star, Eye, EyeOff, CheckCircle, Hash } from "lucide-react";

/* ── Styled input wrapper ─────────────────────────────────────────────────── */
function Field({
  label, rightLabel, icon: Icon, children,
}: {
  label: string;
  rightLabel?: React.ReactNode;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </label>
        {rightLabel}
      </div>
      <div style={{ position: "relative" }}>
        <Icon style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "17px", height: "17px", color: "rgba(255,255,255,0.28)", pointerEvents: "none", zIndex: 1 }} />
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  paddingLeft: "2.75rem",
  paddingRight: "1rem",
  paddingTop: "0.875rem",
  paddingBottom: "0.875rem",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
};

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement> & { extraStyle?: React.CSSProperties }) {
  const { extraStyle, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      style={{
        ...inputStyle,
        ...extraStyle,
        border: focused ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.09)",
        background: focused ? "rgba(124,58,237,0.07)" : "rgba(255,255,255,0.04)",
        boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.04)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function LoginPageInner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  type ForgotStage = "login" | "email" | "code" | "password" | "success";
  const [forgotStage, setForgotStage] = useState<ForgotStage>("login");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg(""); setLoading(true);
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("subsaver_token", data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? "Network error";
      if (message === "email_not_confirmed") {
        setMsg(`__unconfirmed__${email}`);
      } else {
        setMsg(message);
      }
    }
    finally { setLoading(false); }
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) { setMsg("Please enter your email first"); return; }
    setMsg(""); setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setForgotStage("code"); setMsg("✅ If the email exists, a reset code was sent.");
    } catch (err: any) { setMsg(err?.message ?? "Failed to send reset code"); }
    finally { setLoading(false); }
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (resetCode.length !== 6) { setMsg("Please enter the 6-digit code"); return; }
    setMsg(""); setLoading(true);
    try {
      await apiFetch("/auth/verify-reset-code", { method: "POST", body: JSON.stringify({ email, code: resetCode }) });
      setMsg(""); setForgotStage("password");
    } catch (err: any) { setMsg(err?.message ?? "Invalid reset code"); }
    finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setMsg("Passwords do not match"); return; }
    setMsg(""); setLoading(true);
    try {
      await apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code: resetCode, new_password: newPassword }) });
      setForgotStage("success"); setMsg(""); setPassword("");
    } catch (err: any) { setMsg(err?.message ?? "Failed to reset password"); }
    finally { setLoading(false); }
  }

  const formHandler =
    forgotStage === "email" ? handleForgotPassword :
    forgotStage === "code" ? handleVerifyCode :
    forgotStage === "password" ? handleResetPassword : onSubmit;

  return (
    <main style={{ height: "100vh", maxHeight: "100vh", overflow: "hidden", display: "flex", background: "#080B14", color: "white" }}>

      {/* ── LEFT: Art panel ── */}
      <div className="hidden lg:flex" style={{ flex: 1, position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #0D0A1E 0%, #120D2B 55%, #0a0d1a 100%)" }}>
        {/* Aurora blobs */}
        <div style={{ position: "absolute", inset: 0 }}>
          <div className="aurora-blob animate-aurora-1 animate-aurora-pulse" style={{ width: 520, height: 520, background: "radial-gradient(circle, rgba(124,58,237,0.42) 0%, rgba(124,58,237,0.04) 65%)", top: "8%", left: "3%" }} />
          <div className="aurora-blob animate-aurora-2" style={{ width: 440, height: 440, background: "radial-gradient(circle, rgba(217,70,239,0.32) 0%, rgba(217,70,239,0.04) 65%)", bottom: "4%", right: "4%" }} />
          <div className="aurora-blob animate-aurora-3" style={{ width: 280, height: 280, background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 65%)", top: "48%", left: "42%" }} />
          {/* Grid */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div style={{ position: "relative", zIndex: 10, padding: "4rem", maxWidth: "420px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "3.5rem", textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", borderRadius: "12px", padding: "6px" }}>
              <Image src="/logo.png" alt="SubSaver" width={24} height={24} style={{ width: 24, height: 24, borderRadius: 8 }} />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "white", fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub<span style={{ background: "linear-gradient(135deg,#A78BFA,#E879F9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saver</span>
            </span>
          </Link>

          <h2 style={{ fontSize: "clamp(28px,3.5vw,38px)", fontWeight: 900, color: "white", marginBottom: "1rem", lineHeight: 1.15, fontFamily: "var(--font-syne, sans-serif)" }}>
            Welcome back to your savings hub
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "2.5rem", lineHeight: 1.7, fontSize: "15px" }}>
            Pick up where you left off. Your subscriptions and savings are waiting.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {[
              { icon: Shield, text: "Bank-grade encrypted data", color: "#10B981" },
              { icon: Zap, text: "Real-time discount finder", color: "#F59E0B" },
              { icon: Star, text: "Average $847 saved per year", color: "#A78BFA" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 16px" }}>
                <div style={{ width: 34, height: 34, borderRadius: "10px", background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div style={{ flex: 1, maxWidth: "520px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 2rem", position: "relative", overflowY: "auto" }}>
        {/* Soft glow behind form */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div className="aurora-blob" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ marginBottom: "2rem", alignSelf: "flex-start" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", borderRadius: "10px", padding: "5px" }}>
              <Image src="/logo.png" alt="SubSaver" width={22} height={22} style={{ borderRadius: 6 }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "white", fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub<span style={{ background: "linear-gradient(135deg,#A78BFA,#E879F9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saver</span>
            </span>
          </Link>
        </div>

        <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 10 }}>
          {/* Back link */}
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.35)", textDecoration: "none", marginBottom: "1.75rem", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
            <ArrowRight style={{ width: 14, height: 14, transform: "rotate(180deg)" }} />
            Back to Home
          </Link>

          {/* Title block */}
          <div style={{ marginBottom: "2.25rem" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "white", marginBottom: "0.4rem", fontFamily: "var(--font-syne, sans-serif)", lineHeight: 1.2 }}>
              {forgotStage === "login" && "Log in"}
              {forgotStage === "email" && "Reset Password"}
              {forgotStage === "code" && "Verify Code"}
              {forgotStage === "password" && "Set New Password"}
              {forgotStage === "success" && "Password Updated ✓"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "14px" }}>
              {forgotStage === "login" && "Access your savings dashboard"}
              {forgotStage === "email" && "We'll send a recovery code to your email"}
              {forgotStage === "code" && "Enter the 6-digit code sent to your email"}
              {forgotStage === "password" && "Create a new strong password"}
              {forgotStage === "success" && "Your password has been reset successfully."}
            </p>
          </div>

          {/* Email confirmed banner */}
          {confirmed === "1" && forgotStage === "login" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "1rem" }}>
              <CheckCircle style={{ width: 16, height: 16, color: "#34D399", flexShrink: 0 }} />
              <p style={{ fontSize: "13px", color: "#34D399", fontWeight: 600 }}>Email confirmed! You can now log in.</p>
            </div>
          )}

          {forgotStage === "success" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ width: 64, height: 64, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle style={{ width: 32, height: 32, color: "#34D399" }} />
              </div>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: 1.7 }}>
                You can now log in with your new password. We've also sent you a confirmation email.
              </p>
              <button onClick={() => { setForgotStage("login"); setMsg(""); setResetCode(""); setNewPassword(""); setConfirmPassword(""); }}
                style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "linear-gradient(135deg,#7C3AED,#DB2777)", border: "none", color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
                Return to Log In <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ) : (
            <form onSubmit={formHandler} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Email */}
              {(forgotStage === "login" || forgotStage === "email") && (
                <Field label="Email" icon={Mail}>
                  <StyledInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@edu.com" required />
                </Field>
              )}

              {/* Password */}
              {forgotStage === "login" && (
                <Field label="Password" icon={Lock}
                  rightLabel={
                    <button type="button" onClick={() => { setForgotStage("email"); setMsg(""); }}
                      style={{ fontSize: "12px", fontWeight: 600, color: "#A78BFA", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Forgot password?
                    </button>
                  }>
                  <StyledInput
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    type={showPw ? "text" : "password"} placeholder="••••••••" required
                    extraStyle={{ paddingRight: "2.75rem" }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", zIndex: 1, transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                    {showPw ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                  </button>
                </Field>
              )}

              {forgotStage === "code" && (
                <Field label="6-Digit Code" icon={Hash}>
                  <StyledInput value={resetCode} onChange={(e) => setResetCode(e.target.value)} type="text" maxLength={6} placeholder="123456" required extraStyle={{ letterSpacing: "4px", fontWeight: 700 }} />
                </Field>
              )}

              {/* New password */}
              {forgotStage === "password" && (
                <>
                  <Field label="New Password" icon={Lock}>
                    <StyledInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type={showPw ? "text" : "password"} placeholder="Min. 8 characters" required minLength={8} extraStyle={{ paddingRight: "2.75rem" }} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? "Hide new password" : "Show new password"}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", zIndex: 1, transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                      {showPw ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                    </button>
                  </Field>
                  <Field label="Confirm Password" icon={Lock}>
                    <StyledInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showPw2 ? "text" : "password"} placeholder="Verify password" required minLength={8} extraStyle={{ paddingRight: "2.75rem" }} />
                    <button type="button" onClick={() => setShowPw2(!showPw2)}
                      aria-label={showPw2 ? "Hide confirm password" : "Show confirm password"}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", zIndex: 1, transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                      {showPw2 ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                    </button>
                  </Field>
                </>
              )}

              {/* Messages */}
              {msg && !msg.startsWith("__unconfirmed__") && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: msg.startsWith("✅") ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: msg.startsWith("✅") ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)" }}>
                  <Sparkles style={{ width: 15, height: 15, color: msg.startsWith("✅") ? "#34D399" : "#F87171", flexShrink: 0 }} />
                  <p style={{ fontSize: "13px", color: msg.startsWith("✅") ? "#34D399" : "#F87171", fontWeight: 500 }}>{msg}</p>
                </div>
              )}
              {/* Email not confirmed banner */}
              {msg.startsWith("__unconfirmed__") && (
                <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <p style={{ fontSize: "13px", color: "#FCD34D", fontWeight: 600, marginBottom: 8 }}>Email not confirmed</p>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: 10, lineHeight: 1.6 }}>
                    Check your inbox for the confirmation code we sent when you registered.
                  </p>
                  <a
                    href={`/verify-email?email=${encodeURIComponent(msg.replace("__unconfirmed__", ""))}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#FCD34D", textDecoration: "none", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", padding: "7px 14px", borderRadius: 8 }}
                  >
                    Confirm Email →
                  </a>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit" disabled={loading}
                className="hero-btn-primary"
                style={{
                  width: "100%", padding: "14px", marginTop: "0.25rem",
                  fontSize: "15px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  opacity: loading ? 0.65 : 1,
                  background: loading ? "rgba(124,58,237,0.4)" : undefined,
                  boxShadow: loading ? "none" : undefined,
                }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <>
                    {forgotStage === "login" && "Log in"}
                    {forgotStage === "email" && "Send Recovery Code"}
                    {forgotStage === "code" && "Verify Code"}
                    {forgotStage === "password" && "Save Password"}
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>

              {forgotStage !== "login" && (
                <button type="button" onClick={() => { setForgotStage("login"); setMsg(""); setResetCode(""); }}
                  style={{ width: "100%", textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                  ← Cancel and return to log in
                </button>
              )}
            </form>
          )}

          {/* Footer */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.32)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{ color: "#A78BFA", fontWeight: 600, textDecoration: "none" }}>
                Create one free
              </Link>
            </p>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.18)", marginTop: "1rem" }}>
            By logging in, you agree to our{" "}
            <Link href="/terms" style={{ color: "#A78BFA" }}>Terms of Service</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080B14" }} />}>
      <LoginPageInner />
    </Suspense>
  );
}
