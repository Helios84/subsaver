"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import {
    Save, Bell, Mail, Calendar,
    ArrowLeft, CheckCircle2, Settings,
} from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error">("success");
    const [enabled, setEnabled] = useState(true);
    const [days, setDays] = useState(7);
    const [email, setEmail] = useState("");

    useEffect(() => {
        const t = localStorage.getItem("subsaver_token");
        if (!t) { router.push("/login"); return; }
        try {
            const base64Url = t.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            const payload = JSON.parse(jsonPayload);
            if (payload.sub) setEmail(payload.sub);
        } catch (e) { console.error(e); }
        loadSettings();
    }, [router]);

    async function loadSettings() {
        setLoading(true);
        try {
            const data = await apiFetch("/reminders/settings", { method: "GET" });
            setEnabled(data.reminder_enabled);
            setDays(data.reminder_days_before);
        } catch (err: any) {
            setMsg(err?.message ?? "Failed to load settings");
            setMsgType("error");
        } finally { setLoading(false); }
    }

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg("");
        try {
            await apiFetch("/reminders/settings", {
                method: "PUT",
                body: JSON.stringify({ reminder_enabled: enabled, reminder_days_before: Number(days) }),
            });
            setMsg("Settings saved successfully");
            setMsgType("success");
            setTimeout(() => setMsg(""), 3000);
        } catch (err: any) {
            setMsg(err?.message ?? "Failed to save settings");
            setMsgType("error");
        } finally { setSaving(false); }
    }

    function logout() {
        localStorage.removeItem("subsaver_token");
        router.push("/login");
    }

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
                            <Image src="/logo.png" alt="SubSaver" width={20} height={20} className="w-5 h-5 rounded" />
                        </div>
                        <span className="text-base font-bold hidden sm:block" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                            Sub<span className="gradient-text">Saver</span>
                        </span>
                    </Link>

                    <div className="w-24" />
                </div>
            </header>

            {/* Page Content */}
            <div className="relative z-10 w-full flex flex-col items-center px-5 py-12">
                <div className="w-full max-w-xl">

                {/* Title */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
                        <Settings className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                        Notification Settings
                    </h1>
                    <p className="text-white/50 text-sm">Manage your email reminder preferences</p>
                </div>

                <form onSubmit={saveSettings}>
                    <div className="flex flex-col gap-4">

                        {/* ── Email card ── */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Mail style={{ width: 18, height: 18, color: "#60A5FA" }} />
                                </div>
                                <div>
                                    <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>Email Address</div>
                                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Reminders will be sent to this address</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px" }}>
                                <span style={{ color: "rgba(255,255,255,0.75)", fontFamily: "monospace", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email || "Loading..."}</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "4px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                                    <CheckCircle2 style={{ width: 12, height: 12 }} />
                                    Verified
                                </span>
                            </div>
                        </div>

                        {/* ── Email Reminders toggle ── */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Bell style={{ width: 18, height: 18, color: "#E879F9" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>Email Reminders</div>
                                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Get notified before subscriptions renew</div>
                                </div>
                                {/* Toggle switch */}
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

                        {/* ── Reminder Timing ── */}
                        <div style={{
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px",
                            opacity: enabled ? 1 : 0.4, pointerEvents: enabled ? "auto" : "none", transition: "opacity 0.3s",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Calendar style={{ width: 18, height: 18, color: "#FBBF24" }} />
                                </div>
                                <div>
                                    <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>Reminder Timing</div>
                                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Choose when to receive your reminder</div>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                {[
                                    { value: 3, label: "3 Days", desc: "Last minute" },
                                    { value: 7, label: "7 Days", desc: "Recommended" },
                                    { value: 14, label: "14 Days", desc: "Early bird" },
                                ].map((opt) => (
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
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: days === opt.value ? "#E879F9" : "rgba(255,255,255,0.3)", marginBottom: 3 }}>{opt.label}</span>
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{opt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Save Button ── */}
                        <button
                            type="submit"
                            disabled={saving || loading}
                            style={{
                                width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                background: "linear-gradient(135deg, #7C3AED, #DB2777)",
                                boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
                                cursor: saving || loading ? "not-allowed" : "pointer",
                                opacity: saving || loading ? 0.6 : 1,
                                transition: "all 0.2s",
                                color: "white", border: "none", marginTop: 4,
                            }}
                        >
                            {saving ? (
                                <><div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} /><span>Saving...</span></>
                            ) : (
                                <><Save style={{ width: 20, height: 20 }} /><span>Save Changes</span></>
                            )}
                        </button>

                        {/* ── Status message ── */}
                        {msg && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderRadius: 14, fontSize: 14, fontWeight: 500, background: msgType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: msgType === "success" ? "#34D399" : "#F87171", border: `1px solid ${msgType === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                                <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
                                {msg}
                            </div>
                        )}

                        {/* ── How it works ── */}
                        <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 16, padding: "18px 20px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{ padding: 8, borderRadius: 10, background: "rgba(59,130,246,0.15)", flexShrink: 0 }}>
                                    <Bell style={{ width: 14, height: 14, color: "#60A5FA" }} />
                                </div>
                                <div>
                                    <div style={{ color: "white", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>How it works</div>
                                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.65, margin: 0 }}>
                                        We&apos;ll send you an email reminder before your subscription renews.
                                        Set the <strong style={{ color: "rgba(255,255,255,0.65)" }}>Next Billing Date</strong> when adding subscriptions in your dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
                </div>
            </div>
        </main>
    );
}
