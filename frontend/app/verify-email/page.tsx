"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";

/* ── Digit input styles ──────────────────────────────────────────────────── */
const digitStyle = (focused: boolean): React.CSSProperties => ({
  width: 52,
  height: 64,
  background: focused ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.04)",
  border: `1.5px solid ${focused ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 14,
  color: "white",
  fontSize: 26,
  fontWeight: 800,
  textAlign: "center",
  outline: "none",
  transition: "all 0.2s",
  caretColor: "#A855F7",
  boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
  fontFamily: "monospace",
});

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["",'',"","","",""]);
  const [focused, setFocused] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null); // shown when SMTP is off
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    inputRefs.current[0]?.focus();
    // Read dev_code from sessionStorage if register page saved it
    const saved = sessionStorage.getItem("register_dev_code");
    if (saved) {
      setDevCode(saved);
      sessionStorage.removeItem("register_dev_code");
    }
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join("");

  function handleDigit(index: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    setError("");
    if (v && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every(d => d) && v) submitCode(next.join(""));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split("");
      setDigits(arr);
      inputRefs.current[5]?.focus();
      submitCode(pasted);
    }
    e.preventDefault();
  }

  async function submitCode(codeValue: string) {
    if (codeValue.length !== 6 || loading) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch("/auth/confirm-email", {
        method: "POST",
        body: JSON.stringify({ email, code: codeValue }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/login?confirmed=1"), 1800);
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Invalid code";
      setError(msg);
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendMsg("");
    setError("");
    setDevCode(null);
    try {
      const res = await apiFetch("/auth/resend-confirmation", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.dev_code) {
        setDevCode(res.dev_code);
        setResendMsg("Dev mode: SMTP offline, use the code shown above.");
      } else {
        setResendMsg("New code sent! Check your inbox.");
      }
      setCooldown(60);
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080B14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: 24,
        color: "white",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      {/* Aurora blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div className="aurora-blob animate-aurora-1" style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)", top: "-12%", right: "-8%" }} />
        <div className="aurora-blob animate-aurora-2" style={{ width: 450, height: 450, background: "radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 70%)", bottom: "-8%", left: "-5%" }} />
      </div>

      {/* Grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 440,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.55s ease",
        }}
      >
        {/* Back */}
        <Link
          href="/register"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginBottom: 32, transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          <ArrowLeft size={13} /> Back to register
        </Link>

        {success ? (
          /* Success state */
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle2 size={36} color="#34D399" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10, fontFamily: "var(--font-syne, sans-serif)" }}>Email confirmed!</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>Redirecting you to login…</p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
              <Mail size={28} color="#A78BFA" />
            </div>

            <h1 style={{ fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 900, marginBottom: 10, lineHeight: 1.2, fontFamily: "var(--font-syne, sans-serif)" }}>
              Confirm your email
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 8, lineHeight: 1.65 }}>
              We sent a 6-digit code to
            </p>
            <p style={{ color: "#A78BFA", fontSize: 15, fontWeight: 600, marginBottom: 36, wordBreak: "break-all" }}>
              {email || "your email address"}
            </p>

            {/* Dev code banner — shown when SMTP is not configured */}
            {devCode && (
              <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 14, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(234,179,8,0.8)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>🛠 Dev mode — SMTP not configured</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: "#FBBF24", letterSpacing: "0.4em", fontFamily: "monospace", margin: "0 0 6px" }}>{devCode}</p>
                <p style={{ fontSize: 11, color: "rgba(234,179,8,0.5)", margin: 0 }}>Use this code to confirm your email</p>
              </div>
            )}

            {/* Digit inputs */}
            <div
              style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={() => setFocused(i)}
                  onBlur={() => setFocused(null)}
                  style={digitStyle(focused === i)}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 20 }}>
                <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#F87171", fontWeight: 500, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => submitCode(code)}
              disabled={code.length < 6 || loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: code.length === 6 && !loading
                  ? "linear-gradient(135deg, #7C3AED, #D946EF)"
                  : "rgba(255,255,255,0.06)",
                color: code.length === 6 ? "white" : "rgba(255,255,255,0.25)",
                fontSize: 15, fontWeight: 700, cursor: code.length === 6 && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: code.length === 6 && !loading ? "0 4px 20px rgba(124,58,237,0.35)" : "none",
                transition: "all 0.2s",
                marginBottom: 24,
              }}
            >
              {loading
                ? <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                : "Confirm Email"}
            </button>

            {/* Resend */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={resendCode}
                disabled={resending || cooldown > 0}
                style={{ background: "none", border: "none", cursor: cooldown > 0 ? "not-allowed" : "pointer", color: cooldown > 0 ? "rgba(255,255,255,0.2)" : "rgba(167,139,250,0.8)", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, transition: "color 0.2s" }}
              >
                <RefreshCw size={13} style={{ animation: resending ? "spin 1s linear infinite" : "none" }} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              {resendMsg && (
                <p style={{ fontSize: 12, color: "rgba(52,211,153,0.8)", marginTop: 8 }}>{resendMsg}</p>
              )}
            </div>

            {/* Help */}
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4 }}>
                <Mail size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                Can&apos;t find the email? Check your spam folder.
              </span>
              <br />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Code expires in 15 minutes.</span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
