"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { displayName } from "../lib/money";
import {
  ArrowLeft, User, Shield, GraduationCap, Bell, AlertTriangle,
  Mail, Calendar, Lock, Eye, EyeOff, CheckCircle2, XCircle,
  Save, Loader2, Trash2, RefreshCw, Send, KeyRound,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "profile" | "security" | "student" | "notifications" | "danger";

interface UserProfile {
  id: number;
  email: string;
  is_verified: boolean;
  edu_email: string | null;
  created_at: string;
  is_demo?: boolean;
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "profile",       label: "Profile",       icon: <User size={15} />,          color: "#A78BFA" },
  { id: "security",      label: "Security",      icon: <Shield size={15} />,        color: "#60A5FA" },
  { id: "student",       label: "Student",       icon: <GraduationCap size={15} />, color: "#34D399" },
  { id: "notifications", label: "Notifications", icon: <Bell size={15} />,          color: "#FBBF24" },
  { id: "danger",        label: "Danger Zone",   icon: <AlertTriangle size={15} />, color: "#F87171" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: "24px",
    ...extra,
  };
}

function inputStyle(focused?: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    border: `1px solid ${focused ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"}`,
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  };
}

function SectionIcon({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: bg, border: `1px solid ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color }}>{children}</span>
    </div>
  );
}

// ─── Inner page (needs useSearchParams → must be inside Suspense) ─────────────
function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser]     = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Read ?tab= from URL on mount
  useEffect(() => {
    const urlTab = searchParams.get("tab") as Tab | null;
    if (urlTab && TABS.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) { router.push("/login"); return; }
    fetchUser();
  }, [router]);

  async function fetchUser() {
    try {
      const data = await apiFetch("/users/me");
      setUser(data);
    } catch {
      toast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }

  // Demo accounts are temporary: password, student verification, email
  // reminders and account deletion are not available, so only Profile is shown.
  const isDemo = !!user?.is_demo;
  const tabs = isDemo ? TABS.filter((t) => t.id === "profile") : TABS;
  const shownTab: Tab = isDemo ? "profile" : activeTab;

  return (
    <main className="min-h-screen text-white pb-24 relative overflow-hidden" style={{ background: "#080B14" }}>

      {/* Aurora */}
      <div className="aurora-container">
        <div className="aurora-blob animate-aurora-1" style={{ width: "600px", height: "600px", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", top: "-5%", right: "-5%" }} />
        <div className="aurora-blob animate-aurora-2" style={{ width: "500px", height: "500px", background: "radial-gradient(circle, rgba(217,70,239,0.1) 0%, transparent 70%)", bottom: "-5%", left: "-5%" }} />
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="liquid-btn-ghost p-2 rounded-xl">
              <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors hidden sm:block">
              Back to Dashboard
            </span>
          </Link>

          <Link href="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg p-1">
              <Image src="/logo.svg" alt="SubSaver" width={20} height={20} className="w-5 h-5 rounded" />
            </div>
            <span className="text-base font-bold hidden sm:block" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub<span className="gradient-text">Saver</span>
            </span>
          </Link>

          <div className="w-24" />
        </div>
      </header>

      {/* Page */}
      <div className="relative z-10 w-full flex flex-col items-center px-5 py-12">
        <div className="w-full max-w-2xl">

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Account Settings
            </h1>
            <p className="text-white/40 text-sm">
              {user ? user.email : "Loading…"}
            </p>
          </div>

          {isDemo && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.25)", color: "#A5F3FC", fontSize: 13, lineHeight: 1.6 }}>
              You&apos;re using a temporary demo account. Password, student verification, email reminders and account deletion are not available here.
            </div>
          )}

          {/* Tab Bar */}
          <div style={{
            display: "flex", gap: 4, padding: "5px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, marginBottom: 24,
            overflowX: "auto",
          }}>
            {tabs.map((tab) => {
              const isActive = shownTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 7, padding: "9px 12px", borderRadius: 12,
                    border: isActive ? `1px solid ${tab.color}30` : "1px solid transparent",
                    background: isActive ? `${tab.color}15` : "transparent",
                    color: isActive ? tab.color : "rgba(255,255,255,0.4)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s", whiteSpace: "nowrap",
                  }}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : (
            <>
              {shownTab === "profile"       && <ProfileTab user={user} onRefresh={fetchUser} toast={toast} />}
              {shownTab === "security"      && <SecurityTab user={user} toast={toast} />}
              {shownTab === "student"       && <StudentTab user={user} onRefresh={fetchUser} toast={toast} />}
              {shownTab === "notifications" && <NotificationsTab toast={toast} />}
              {shownTab === "danger"        && <DangerTab router={router} toast={toast} />}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Page export (wrapped in Suspense for useSearchParams) ────────────────────
export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080B14" }} />}>
      <SettingsPageInner />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileTab({ user, onRefresh, toast }: { user: UserProfile | null; onRefresh: () => void; toast: Function }) {
  if (!user) return null;

  const initials = displayName(user).slice(0, 1).toUpperCase();
  const joined = new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Avatar + basic info */}
      <div style={cardStyle()}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #7C3AED, #D946EF)",
            boxShadow: "0 0 30px rgba(124,58,237,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900, color: "white",
            fontFamily: "var(--font-syne, sans-serif)",
          }}>
            {initials}
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              {displayName(user)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontFamily: "monospace" }}>
              {user.email}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              {user.is_verified ? (
                <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  <CheckCircle2 size={11} /> Student Verified
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(245,158,11,0.1)", color: "#FBBF24", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  <AlertTriangle size={11} /> Not Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={cardStyle()}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SectionIcon color="#60A5FA" bg="rgba(59,130,246,0.12)"><Mail size={16} /></SectionIcon>
            <div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Email Address</div>
              <div style={{ color: "white", fontSize: 14, fontFamily: "monospace" }}>{user.email}</div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SectionIcon color="#A78BFA" bg="rgba(124,58,237,0.12)"><Calendar size={16} /></SectionIcon>
            <div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Member Since</div>
              <div style={{ color: "white", fontSize: 14 }}>{joined}</div>
            </div>
          </div>

          {user.edu_email && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <SectionIcon color="#34D399" bg="rgba(16,185,129,0.12)"><GraduationCap size={16} /></SectionIcon>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Student Email</div>
                  <div style={{ color: "white", fontSize: 14, fontFamily: "monospace" }}>{user.edu_email}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SECURITY — Change Password (код на email → новый пароль)
// ═══════════════════════════════════════════════════════════════════════════════
type PwStep = "idle" | "sending" | "code" | "verifying" | "newpw" | "resetting" | "done";

function SecurityTab({ user, toast }: { user: UserProfile | null; toast: Function }) {
  const [step, setStep] = useState<PwStep>("idle");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  async function sendCode() {
    if (!user) return;
    setStep("sending");
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: user.email }),
      });
      toast("Reset code sent to your email!", "success");
      setStep("code");
    } catch (err: any) {
      toast(err?.message ?? "Failed to send code", "error");
      setStep("idle");
    }
  }

  async function verifyCode() {
    if (!user || code.length !== 6) { toast("Enter the 6-digit code", "warning"); return; }
    setStep("verifying");
    try {
      await apiFetch("/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ email: user.email, code }),
      });
      setStep("newpw");
    } catch (err: any) {
      toast(err?.message ?? "Invalid code", "error");
      setStep("code");
    }
  }

  async function resetPassword() {
    if (!user) return;
    if (newPw.length < 8) { toast("Password must be at least 8 characters", "warning"); return; }
    if (newPw !== confirmPw) { toast("Passwords do not match", "warning"); return; }
    setStep("resetting");
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email: user.email, code, new_password: newPw }),
      });
      toast("Password changed! Please log in again.", "success");
      setStep("done");
      setCode(""); setNewPw(""); setConfirmPw("");
      // Revoke current JWT after password reset — security best practice
      try { await apiFetch("/auth/logout", { method: "POST" }); } catch { /* ignore */ }
      localStorage.removeItem("subsaver_token");
      setTimeout(() => window.location.href = "/login", 1500);
    } catch (err: any) {
      toast(err?.message ?? "Failed to reset password", "error");
      setStep("newpw");
    }
  }

  function reset() {
    setStep("idle");
    setCode(""); setNewPw(""); setConfirmPw("");
  }

  const busy = step === "sending" || step === "verifying" || step === "resetting";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardStyle()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <SectionIcon color="#60A5FA" bg="rgba(59,130,246,0.12)"><KeyRound size={18} /></SectionIcon>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Change Password</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
              We&apos;ll send a 6-digit code to verify your identity
            </div>
          </div>
        </div>

        {/* Step: idle / done */}
        {(step === "idle" || step === "done") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {step === "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 14, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                <CheckCircle2 size={16} />
                Password changed successfully!
              </div>
            )}
            <button
              onClick={sendCode}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "13px 20px", borderRadius: 14, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(124,58,237,0.2))",
                border: "1px solid rgba(59,130,246,0.35)",
                color: "#93C5FD", cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(124,58,237,0.3))"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(124,58,237,0.2))"; }}
            >
              <Send size={16} />
              Send Reset Code to {user?.email}
            </button>
          </div>
        )}

        {/* Step: sending */}
        {step === "sending" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            <Loader2 size={18} className="animate-spin" />
            Sending code…
          </div>
        )}

        {/* Step: code entry */}
        {step === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD", fontSize: 13 }}>
              📧 Check your inbox at <strong>{user?.email}</strong> for a 6-digit code.
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                Verification Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                style={{ ...inputStyle(focusedField === "code"), letterSpacing: "0.3em", fontSize: 20, fontFamily: "monospace", textAlign: "center" as const }}
                onFocus={() => setFocusedField("code")}
                onBlur={() => setFocusedField("")}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={reset}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={verifyCode}
                disabled={code.length !== 6}
                style={{
                  flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: code.length === 6 ? "linear-gradient(135deg, #3B82F6, #7C3AED)" : "rgba(255,255,255,0.06)",
                  color: code.length === 6 ? "white" : "rgba(255,255,255,0.3)",
                  border: "none", cursor: code.length === 6 ? "pointer" : "not-allowed",
                  boxShadow: code.length === 6 ? "0 4px 20px rgba(59,130,246,0.3)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <CheckCircle2 size={16} />
                Verify Code
              </button>
            </div>

            <button
              onClick={sendCode}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", textAlign: "center" as const, padding: "4px 0" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              <RefreshCw size={11} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
              Resend code
            </button>
          </div>
        )}

        {/* Step: verifying */}
        {step === "verifying" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            <Loader2 size={18} className="animate-spin" />
            Verifying code…
          </div>
        )}

        {/* Step: new password */}
        {step === "newpw" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399", fontSize: 13 }}>
              ✅ Code verified! Now set your new password.
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle(focusedField === "newpw"), paddingRight: 44 }}
                  onFocus={() => setFocusedField("newpw")}
                  onBlur={() => setFocusedField("")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat password"
                  style={{
                    ...inputStyle(focusedField === "confirmpw"),
                    borderColor: confirmPw && newPw !== confirmPw
                      ? "rgba(239,68,68,0.5)"
                      : confirmPw && newPw === confirmPw
                      ? "rgba(16,185,129,0.5)"
                      : focusedField === "confirmpw" ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)",
                  }}
                  onFocus={() => setFocusedField("confirmpw")}
                  onBlur={() => setFocusedField("")}
                />
                {confirmPw && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: newPw === confirmPw ? "#34D399" : "#F87171" }}>
                    {newPw === confirmPw ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={reset}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={resetPassword}
                disabled={newPw.length < 8 || newPw !== confirmPw}
                style={{
                  flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: (newPw.length >= 8 && newPw === confirmPw) ? "linear-gradient(135deg, #7C3AED, #D946EF)" : "rgba(255,255,255,0.06)",
                  color: (newPw.length >= 8 && newPw === confirmPw) ? "white" : "rgba(255,255,255,0.3)",
                  border: "none", cursor: (newPw.length >= 8 && newPw === confirmPw) ? "pointer" : "not-allowed",
                  boxShadow: (newPw.length >= 8 && newPw === confirmPw) ? "0 4px 24px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <Lock size={16} />
                Set New Password
              </button>
            </div>
          </div>
        )}

        {/* Step: resetting */}
        {step === "resetting" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            <Loader2 size={18} className="animate-spin" />
            Updating password…
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STUDENT
// ═══════════════════════════════════════════════════════════════════════════════
function StudentTab({ user, onRefresh, toast }: { user: UserProfile | null; onRefresh: () => void; toast: Function }) {
  const [eduEmail, setEduEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "sending" | "code" | "verifying" | "done">("idle");
  const [focusedField, setFocusedField] = useState("");

  if (!user) return null;

  async function sendCode() {
    if (!eduEmail.toLowerCase().endsWith(".edu")) {
      toast("Please enter a valid .edu email address", "warning"); return;
    }
    setStep("sending");
    try {
      await apiFetch("/auth/verify-edu", {
        method: "POST",
        body: JSON.stringify({ edu_email: eduEmail.trim().toLowerCase() }),
      });
      toast("Verification code sent to your .edu email!", "success");
      setStep("code");
    } catch (err: any) {
      toast(err?.message ?? "Failed to send code", "error");
      setStep("idle");
    }
  }

  async function verifyCode() {
    if (code.length !== 6) { toast("Enter the 6-digit code", "warning"); return; }
    setStep("verifying");
    try {
      await apiFetch("/auth/verify-edu/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      toast("Student status verified! 🎓", "success");
      setStep("done");
      onRefresh();
    } catch (err: any) {
      toast(err?.message ?? "Invalid code", "error");
      setStep("code");
    }
  }

  const busy = step === "sending" || step === "verifying";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status card */}
      <div style={cardStyle()}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SectionIcon color="#34D399" bg="rgba(16,185,129,0.12)"><GraduationCap size={18} /></SectionIcon>
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Student Status</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
              {user.is_verified ? "Your student status is verified" : "Verify with your .edu email to unlock discounts"}
            </div>
          </div>
          {user.is_verified ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              <CheckCircle2 size={13} /> Verified
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(245,158,11,0.1)", color: "#FBBF24", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              <AlertTriangle size={13} /> Unverified
            </span>
          )}
        </div>

        {user.edu_email && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
            <Mail size={14} style={{ color: "#34D399", flexShrink: 0 }} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.edu_email}
            </span>
          </div>
        )}
      </div>

      {/* Verify / Re-verify form */}
      {(!user.is_verified || step === "idle") && (
        <div style={cardStyle()}>
          <div style={{ fontWeight: 700, color: "white", fontSize: 14, marginBottom: 16 }}>
            {user.is_verified ? "Re-verify Student Email" : "Verify Your Student Email"}
          </div>

          {(step === "idle" || step === "done") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {step === "done" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399", fontSize: 13, fontWeight: 500 }}>
                  <CheckCircle2 size={15} /> Verified successfully!
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                  .edu Email Address
                </label>
                <input
                  value={eduEmail}
                  onChange={(e) => setEduEmail(e.target.value)}
                  placeholder="you@university.edu"
                  type="email"
                  style={inputStyle(focusedField === "edu")}
                  onFocus={() => setFocusedField("edu")}
                  onBlur={() => setFocusedField("")}
                />
              </div>
              <button
                onClick={sendCode}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px", borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: "linear-gradient(135deg, #059669, #10B981)",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                  color: "white", border: "none", cursor: "pointer", transition: "opacity 0.2s",
                }}
              >
                <Send size={15} /> Send Verification Code
              </button>
            </div>
          )}

          {step === "sending" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              <Loader2 size={18} className="animate-spin" /> Sending…
            </div>
          )}

          {step === "code" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399", fontSize: 13 }}>
                📧 Code sent to <strong>{eduEmail}</strong>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                  Verification Code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  style={{ ...inputStyle(focusedField === "vcode"), letterSpacing: "0.3em", fontSize: 20, fontFamily: "monospace", textAlign: "center" as const }}
                  onFocus={() => setFocusedField("vcode")}
                  onBlur={() => setFocusedField("")}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep("idle"); setCode(""); }} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Back
                </button>
                <button
                  onClick={verifyCode}
                  disabled={code.length !== 6}
                  style={{
                    flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "11px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: code.length === 6 ? "linear-gradient(135deg, #059669, #10B981)" : "rgba(255,255,255,0.06)",
                    color: code.length === 6 ? "white" : "rgba(255,255,255,0.3)",
                    border: "none", cursor: code.length === 6 ? "pointer" : "not-allowed",
                    boxShadow: code.length === 6 ? "0 4px 18px rgba(16,185,129,0.3)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <CheckCircle2 size={15} /> Confirm
                </button>
              </div>
            </div>
          )}

          {step === "verifying" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              <Loader2 size={18} className="animate-spin" /> Verifying…
            </div>
          )}
        </div>
      )}

      {/* Benefits card */}
      <div style={{ ...cardStyle(), background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
        <div style={{ color: "#34D399", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🎓 Student Benefits</div>
        <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
          {["Student prices from the catalog", "See which of your subscriptions have a student price", "Badge displayed on your profile"].map((b) => (
            <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
              <CheckCircle2 size={13} style={{ color: "#34D399", flexShrink: 0 }} />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function NotificationsTab({ toast }: { toast: Function }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    apiFetch("/reminders/settings")
      .then((data: any) => { setEnabled(data.reminder_enabled); setDays(data.reminder_days_before); })
      .catch((err: any) => toast(err?.message ?? "Failed to load settings", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/reminders/settings", {
        method: "PUT",
        body: JSON.stringify({ reminder_enabled: enabled, reminder_days_before: Number(days) }),
      });
      toast("Notification settings saved!", "success");
    } catch (err: any) {
      toast(err?.message ?? "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
    </div>
  );

  return (
    <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Email Reminders toggle */}
      <div style={cardStyle()}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SectionIcon color="#E879F9" bg="rgba(217,70,239,0.12)"><Bell size={18} /></SectionIcon>
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Email Reminders</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>Get notified before subscriptions renew</div>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            style={{
              position: "relative", width: 52, height: 28, borderRadius: 100, flexShrink: 0, cursor: "pointer",
              background: enabled ? "linear-gradient(135deg, #7C3AED, #D946EF)" : "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: enabled ? "0 0 20px rgba(124,58,237,0.4)" : "none",
              transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            <span style={{
              position: "absolute", top: 2, width: 22, height: 22, borderRadius: "50%", background: "white",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              left: enabled ? "calc(100% - 24px)" : "2px",
              transition: "left 0.3s cubic-bezier(0.23,1,0.32,1)",
            }} />
          </button>
        </div>
      </div>

      {/* Reminder Timing */}
      <div style={{ ...cardStyle(), opacity: enabled ? 1 : 0.4, pointerEvents: enabled ? "auto" : "none", transition: "opacity 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <SectionIcon color="#FBBF24" bg="rgba(245,158,11,0.12)"><Calendar size={18} /></SectionIcon>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Reminder Timing</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>Choose when to receive your reminder</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[{ value: 3, label: "3 Days", desc: "Last minute" }, { value: 7, label: "7 Days", desc: "Recommended" }, { value: 14, label: "14 Days", desc: "Early bird" }].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              style={{
                position: "relative", display: "flex", flexDirection: "column", alignItems: "center",
                padding: "20px 8px 16px", borderRadius: 16, cursor: "pointer",
                background: days === opt.value ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(217,70,239,0.15))" : "rgba(255,255,255,0.03)",
                border: `1px solid ${days === opt.value ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: days === opt.value ? "0 4px 20px rgba(124,58,237,0.2)" : "none",
                transition: "all 0.25s",
              }}
            >
              {days === opt.value && (
                <div style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #D946EF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color: "white" }} />
                </div>
              )}
              <span style={{ fontSize: 28, fontWeight: 900, color: days === opt.value ? "white" : "rgba(255,255,255,0.35)", fontFamily: "var(--font-syne, sans-serif)", lineHeight: 1, marginBottom: 6 }}>{opt.value}</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: days === opt.value ? "#E879F9" : "rgba(255,255,255,0.3)", marginBottom: 3 }}>{opt.label}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={saving}
        style={{
          width: "100%", padding: "15px", borderRadius: 16, fontSize: 15, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: "linear-gradient(135deg, #7C3AED, #DB2777)",
          boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1, transition: "all 0.2s", color: "white", border: "none",
        }}
      >
        {saving ? <><Loader2 size={18} className="animate-spin" /><span>Saving…</span></> : <><Save size={18} /><span>Save Changes</span></>}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: DANGER ZONE
// ═══════════════════════════════════════════════════════════════════════════════
function DangerTab({ router, toast }: { router: any; toast: Function }) {
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

  async function deleteAccount() {
    if (confirmText !== CONFIRM_PHRASE) {
      toast(`Type "${CONFIRM_PHRASE}" to confirm`, "warning"); return;
    }
    if (!password) {
      toast("Please enter your password to confirm deletion", "warning"); return;
    }
    setDeleting(true);
    try {
      // Revoke JWT on backend BEFORE deleting account
      try { await apiFetch("/auth/logout", { method: "POST" }); } catch { /* ignore */ }
      await apiFetch("/users/me", { method: "DELETE", body: JSON.stringify({ password }) });
      localStorage.removeItem("subsaver_token");
      toast("Account deleted. Goodbye! 👋", "info");
      router.push("/");
    } catch (err: any) {
      toast(err?.message ?? "Failed to delete account", "error");
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Warning info */}
      <div style={{ ...cardStyle(), border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <SectionIcon color="#F87171" bg="rgba(239,68,68,0.12)"><Trash2 size={18} /></SectionIcon>
          <div>
            <div style={{ color: "#F87171", fontWeight: 700, fontSize: 15 }}>Delete Account</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>This action is permanent and cannot be undone</div>
          </div>
        </div>

        <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: "0 0 20px 0", padding: 0, listStyle: "none" }}>
          {[
            "All your subscriptions will be permanently deleted",
            "Your notification settings will be removed",
            "Your student verification will be lost",
            "You will be immediately logged out",
          ].map((item) => (
            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              <XCircle size={14} style={{ color: "#F87171", flexShrink: 0, marginTop: 1 }} />
              {item}
            </li>
          ))}
        </ul>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "13px", borderRadius: 14, fontSize: 14, fontWeight: 700,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#F87171", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
          >
            <Trash2 size={16} />
            Delete My Account
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ color: "#F87171", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                ⚠️ Final confirmation required
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                Type <strong style={{ color: "#F87171", fontFamily: "monospace", letterSpacing: "0.05em" }}>{CONFIRM_PHRASE}</strong> to confirm deletion
              </div>
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder={CONFIRM_PHRASE}
              style={{
                ...inputStyle(false),
                borderColor: confirmText === CONFIRM_PHRASE ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
                color: confirmText === CONFIRM_PHRASE ? "#F87171" : "white",
                marginBottom: 10,
              }}
              maxLength={CONFIRM_PHRASE.length}
            />
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
              Your Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
              aria-label="Password confirmation for account deletion"
              style={{
                ...inputStyle(false),
                borderColor: "rgba(239,68,68,0.2)",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={confirmText !== CONFIRM_PHRASE || deleting}
                style={{
                  flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: confirmText === CONFIRM_PHRASE ? "linear-gradient(135deg, #DC2626, #B91C1C)" : "rgba(255,255,255,0.06)",
                  color: confirmText === CONFIRM_PHRASE ? "white" : "rgba(255,255,255,0.3)",
                  border: "none", cursor: (confirmText === CONFIRM_PHRASE && !deleting) ? "pointer" : "not-allowed",
                  boxShadow: confirmText === CONFIRM_PHRASE ? "0 4px 20px rgba(220,38,38,0.4)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting…</> : <><Trash2 size={16} /> Permanently Delete</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
