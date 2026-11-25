"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Mail, Lock, ArrowRight, CheckCircle2,
  GraduationCap, Shield, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { apiFetch } from "../lib/api";

/* ── Shared input styles ──────────────────────────────────────────────────── */
const inputBase: React.CSSProperties = {
  width: "100%",
  paddingLeft: "2.75rem",
  paddingRight: "1rem",
  paddingTop: "0.875rem",
  paddingBottom: "0.875rem",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

function StyledInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { extraStyle?: React.CSSProperties }
) {
  const { extraStyle, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      style={{
        ...inputBase,
        ...extraStyle,
        border: focused
          ? "1px solid rgba(124,58,237,0.6)"
          : "1px solid rgba(255,255,255,0.09)",
        background: focused
          ? "rgba(124,58,237,0.07)"
          : "rgba(255,255,255,0.04)",
        boxShadow: focused
          ? "0 0 0 3px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Field({
  label, icon: Icon, hint, children,
}: {
  label: string;
  icon: React.ElementType;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Icon
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "17px",
            height: "17px",
            color: "rgba(255,255,255,0.28)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        {children}
      </div>
      {hint && <div style={{ marginTop: "2px" }}>{hint}</div>}
    </div>
  );
}

/* ── Submit button with full hover via inline + CSS class ─────────────────── */
function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="hero-btn-primary"
      style={{
        width: "100%",
        padding: "14px",
        marginTop: "0.25rem",
        fontSize: "15px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        opacity: loading ? 0.65 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        background: loading
          ? "rgba(124,58,237,0.4)"
          : undefined,
        boxShadow: loading ? "none" : undefined,
        transition: "all 0.22s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s",
      }}
    >
      {loading ? (
        <div
          style={{
            width: 20,
            height: 20,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTop: "2px solid white",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      ) : (
        children
      )}
    </button>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);

    } catch (err: unknown) {
      setMsg((err as Error)?.message ?? "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const perks = [
    "Look up student prices for popular services",
    "Track all subscriptions in one place",
    "Get renewal reminders before billing",
    "Split costs with roommates easily",
  ];

  return (
    /* No-scroll full-height layout: overflow-hidden on main */
    <main
      style={{
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        background: "#080B14",
        color: "white",
      }}
    >
      {/* ── LEFT: Art panel ── */}
      <div
        className="hidden lg:flex"
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0D0A1E 0%, #120D2B 55%, #0a0d1a 100%)",
        }}
      >
        {/* Aurora blobs */}
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            className="aurora-blob animate-aurora-2 animate-aurora-pulse"
            style={{
              width: 540, height: 540,
              background: "radial-gradient(circle, rgba(217,70,239,0.38) 0%, rgba(217,70,239,0.04) 65%)",
              top: "4%", right: "-6%",
            }}
          />
          <div
            className="aurora-blob animate-aurora-1"
            style={{
              width: 480, height: 480,
              background: "radial-gradient(circle, rgba(124,58,237,0.38) 0%, rgba(124,58,237,0.04) 65%)",
              bottom: "8%", left: "-6%",
            }}
          />
          <div
            className="aurora-blob animate-aurora-3"
            style={{
              width: 280, height: 280,
              background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 65%)",
              top: "46%", left: "44%",
            }}
          />
          <div
            style={{
              position: "absolute", inset: 0, opacity: 0.025,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 10, padding: "4rem", maxWidth: "420px" }}>
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "2.5rem",
              textDecoration: "none",
            }}
          >
            <div style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", borderRadius: "12px", padding: "6px" }}>
              <Image src="/logo.svg" alt="SubSaver" width={24} height={24} style={{ width: 24, height: 24, borderRadius: 8 }} />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "white", fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub
              <span style={{ background: "linear-gradient(135deg,#A78BFA,#E879F9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Saver
              </span>
            </span>
          </Link>

          {/* Badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "5px 12px", borderRadius: "999px",
              background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
              marginBottom: "1.25rem",
            }}
          >
            <GraduationCap style={{ width: 13, height: 13, color: "#A78BFA" }} />
            <span style={{ fontSize: "11px", color: "#A78BFA", fontWeight: 700 }}>Free student account</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(26px,3.2vw,36px)",
              fontWeight: 900,
              color: "white",
              marginBottom: "0.875rem",
              lineHeight: 1.15,
              fontFamily: "var(--font-syne, sans-serif)",
            }}
          >
            Create your account
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "2rem", lineHeight: 1.7, fontSize: "15px" }}>
            Free to use. No credit card needed.
          </p>

          {/* Perk list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            {perks.map((perk) => (
              <div key={perk} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <CheckCircle2 style={{ width: 13, height: 13, color: "#34D399" }} />
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                  {perk}
                </span>
              </div>
            ))}
          </div>

          {/* Verify hint card */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div
                style={{
                  width: 38, height: 38, borderRadius: "10px",
                  background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(217,70,239,0.2))",
                  border: "1px solid rgba(124,58,237,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <GraduationCap style={{ width: 18, height: 18, color: "#C084FC" }} />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "white", marginBottom: "4px" }}>
                  Student verification
                </p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Verify your{" "}
                  <span style={{ color: "#A78BFA" }}>.edu email</span>{" "}
                  after sign-up to mark your account as a student account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel — scrollable only if content overflows ── */}
      <div
        style={{
          flex: 1,
          maxWidth: "520px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 2rem",
          position: "relative",
          overflowY: "auto",
        }}
      >
        {/* Soft glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div
            className="aurora-blob"
            style={{
              width: 400, height: 400,
              background: "radial-gradient(circle, rgba(217,70,239,0.06) 0%, transparent 70%)",
              top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ marginBottom: "1.75rem", alignSelf: "flex-start" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", borderRadius: "10px", padding: "5px" }}>
              <Image src="/logo.svg" alt="SubSaver" width={22} height={22} style={{ borderRadius: 6 }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "white", fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub
              <span style={{ background: "linear-gradient(135deg,#A78BFA,#E879F9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Saver
              </span>
            </span>
          </Link>
        </div>

        <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 10 }}>
          {/* Back link */}
          <Link
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "13px", color: "rgba(255,255,255,0.35)",
              textDecoration: "none", marginBottom: "1.75rem",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <ArrowRight style={{ width: 14, height: 14, transform: "rotate(180deg)" }} />
            Back to Home
          </Link>

          {/* Title */}
          <div style={{ marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "28px", fontWeight: 900, color: "white",
                marginBottom: "0.4rem",
                fontFamily: "var(--font-syne, sans-serif)",
                lineHeight: 1.2,
              }}
            >
              Create account
            </h1>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "14px" }}>
              Start saving money — verify student status later in dashboard
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            {/* Email */}
            <Field label="Email" icon={Mail}>
              <StyledInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </Field>

            {/* Password */}
            <Field
              label="Password"
              icon={Lock}
              hint={
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield style={{ width: 13, height: 13, color: "rgba(16,185,129,0.5)" }} />
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
                    At least 8 characters
                  </span>
                </div>
              }
            >
              <StyledInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={8}
                extraStyle={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: "14px", top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.35)",
                  background: "none", border: "none",
                  cursor: "pointer", zIndex: 1,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {showPw ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
              </button>
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" icon={Lock}>
              <StyledInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showPw2 ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={8}
                extraStyle={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw2(!showPw2)}
                style={{
                  position: "absolute", right: "14px", top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.35)",
                  background: "none", border: "none",
                  cursor: "pointer", zIndex: 1,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {showPw2 ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
              </button>
            </Field>

            {/* Error */}
            {msg && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 14px", borderRadius: "12px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <AlertCircle style={{ width: 15, height: 15, color: "#F87171", flexShrink: 0 }} />
                <p style={{ fontSize: "13px", color: "#F87171", fontWeight: 500 }}>{msg}</p>
              </div>
            )}

            {/* Student notice */}
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                padding: "12px 14px", borderRadius: "12px",
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.15)",
              }}
            >
              <GraduationCap
                style={{ width: 15, height: 15, color: "rgba(167,139,250,0.7)", flexShrink: 0, marginTop: "1px" }}
              />
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                After signing up you'll verify your{" "}
                <span style={{ color: "#A78BFA", fontWeight: 600 }}>.edu email</span>{" "}
                in the dashboard to unlock student discounts.
              </p>
            </div>

            {/* Submit */}
            <SubmitButton loading={loading}>
              Create free account <ArrowRight style={{ width: 16, height: 16 }} />
            </SubmitButton>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.32)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#A78BFA", fontWeight: 600, textDecoration: "none" }}>
                Log in
              </Link>
            </p>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.18)", marginTop: "0.75rem" }}>
            By creating an account, you agree to our{" "}
            <Link href="/terms" style={{ color: "#A78BFA" }}>Terms of Service</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
