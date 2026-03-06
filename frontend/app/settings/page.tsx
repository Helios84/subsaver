"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import {
    LogOut, Save, Bell, Mail, Calendar,
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
        <main className="min-h-screen text-white pb-20 relative overflow-hidden" style={{ background: "#080B14" }}>

            {/* Aurora background */}
            <div className="aurora-container">
                <div className="aurora-blob animate-aurora-1" style={{
                    width: "600px", height: "600px",
                    background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
                    top: "-5%", right: "-5%",
                }} />
                <div className="aurora-blob animate-aurora-2" style={{
                    width: "500px", height: "500px",
                    background: "radial-gradient(circle, rgba(217,70,239,0.1) 0%, transparent 70%)",
                    bottom: "-5%", left: "-5%",
                }} />
            </div>

            {/* Header */}
            <header className="glass-header sticky top-0 z-20">
                <div className="mx-auto max-w-5xl px-6 lg:px-10 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="liquid-btn-ghost p-2 rounded-xl">
                            <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-white/50 group-hover:text-white transition-colors">
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

                    <button onClick={logout} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors font-medium group">
                        <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">

                {/* Page title */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-6"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
                        <Settings className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                        Notification Settings
                    </h1>
                    <p className="text-white/40">Manage your email reminder preferences</p>
                </div>

                <form onSubmit={saveSettings} className="space-y-4">

                    {/* Email display */}
                    <div className="liquid-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}>
                                <Mail className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Email Address</h3>
                                <p className="text-xs text-white/40">Reminders will be sent to this address</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 liquid-card rounded-xl px-4 py-3">
                            <span className="text-sm text-white/70 font-mono flex-1">{email || "Loading..."}</span>
                            <span className="flex items-center gap-1.5 text-xs bg-green-500/15 text-green-400 px-2.5 py-1 rounded-full font-semibold border border-green-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                            </span>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div className="liquid-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.25)" }}>
                                    <Bell className="w-5 h-5 text-fuchsia-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">Email Reminders</h3>
                                    <p className="text-xs text-white/40">Get notified before subscriptions renew</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEnabled(!enabled)}
                                className="relative flex-shrink-0"
                                style={{
                                    width: "52px", height: "28px",
                                    borderRadius: "100px",
                                    background: enabled
                                        ? "linear-gradient(135deg, #7C3AED, #D946EF)"
                                        : "rgba(255,255,255,0.1)",
                                    transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
                                    boxShadow: enabled ? "0 0 20px rgba(124,58,237,0.4)" : "none",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "2px",
                                        left: enabled ? "calc(100% - 26px)" : "2px",
                                        width: "22px", height: "22px",
                                        borderRadius: "50%",
                                        background: "white",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                                        transition: "left 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
                                    }}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Timing */}
                    <div className={`liquid-panel rounded-2xl p-6 transition-all duration-300 ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}>
                                <Calendar className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Reminder Timing</h3>
                                <p className="text-xs text-white/40">Choose when to receive your reminder</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 3, label: "3 Days", desc: "Last minute" },
                                { value: 7, label: "7 Days", desc: "Recommended" },
                                { value: 14, label: "14 Days", desc: "Early bird" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setDays(option.value)}
                                    className="relative flex flex-col items-center py-5 px-3 rounded-2xl transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: days === option.value
                                            ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(217,70,239,0.15))"
                                            : "rgba(255,255,255,0.03)",
                                        border: days === option.value
                                            ? "1px solid rgba(124,58,237,0.4)"
                                            : "1px solid rgba(255,255,255,0.07)",
                                        boxShadow: days === option.value ? "0 4px 20px rgba(124,58,237,0.2)" : "none",
                                    }}
                                >
                                    {days === option.value && (
                                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}>
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <span className={`text-3xl font-black mb-1 ${days === option.value ? "text-white" : "text-white/40"}`}
                                        style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                                        {option.value}
                                    </span>
                                    <span className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${days === option.value ? "text-fuchsia-400" : "text-white/30"}`}>
                                        {option.label}
                                    </span>
                                    <span className="text-xs text-white/25">{option.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex flex-col items-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="liquid-btn px-10 py-4 rounded-xl font-bold flex items-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed min-w-[200px] justify-center"
                        >
                            {saving ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
                            ) : (
                                <><Save className="w-5 h-5" /><span>Save Changes</span></>
                            )}
                        </button>

                        {msg && (
                            <div className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium ${msgType === "success"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                <CheckCircle2 className="w-4 h-4" />
                                {msg}
                            </div>
                        )}
                    </div>
                </form>

                {/* Info */}
                <div className="mt-6 liquid-card rounded-2xl p-5"
                    style={{ border: "1px solid rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.05)" }}>
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg shrink-0" style={{ background: "rgba(59,130,246,0.15)" }}>
                            <Bell className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1 text-sm">How it works</h4>
                            <p className="text-xs text-white/40 leading-relaxed">
                                We&apos;ll send you an email reminder before your subscription renews.
                                Set the <strong className="text-white/60">Next Billing Date</strong> when adding subscriptions in your dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
