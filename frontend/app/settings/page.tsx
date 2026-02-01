"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import {
    LogOut,
    Save,
    Bell,
    Mail,
    Calendar,
    Settings,
    ArrowLeft,
    CheckCircle2,
    Sparkles,
    Layers,
} from "lucide-react";

type ReminderSettings = {
    reminder_enabled: boolean;
    reminder_days_before: number;
};

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error">("success");

    // Settings state
    const [enabled, setEnabled] = useState(true);
    const [days, setDays] = useState(7);
    const [email, setEmail] = useState("");

    useEffect(() => {
        const t = localStorage.getItem("subsaver_token");
        if (!t) {
            router.push("/login");
            return;
        }

        // Decode email from token
        try {
            const base64Url = t.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            if (payload.sub) setEmail(payload.sub);
        } catch (e) {
            console.error("Failed to decode token", e);
        }

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
        } finally {
            setLoading(false);
        }
    }

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg("");
        try {
            await apiFetch("/reminders/settings", {
                method: "PUT",
                body: JSON.stringify({
                    reminder_enabled: enabled,
                    reminder_days_before: Number(days),
                }),
            });
            setMsg("Settings saved successfully");
            setMsgType("success");
            setTimeout(() => setMsg(""), 3000);
        } catch (err: any) {
            setMsg(err?.message ?? "Failed to save settings");
            setMsgType("error");
        } finally {
            setSaving(false);
        }
    }

    function logout() {
        localStorage.removeItem("subsaver_token");
        router.push("/login");
    }

    return (
        <main className="min-h-screen pb-20 bg-[#0F172A] text-white overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 glass-panel border-b border-white/5">
                <div className="mx-auto max-w-full px-6 lg:px-12 py-5 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-1.5 shadow-md group-hover:bg-violet-600 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-300 group-hover:text-white transition-colors">Back to Dashboard</span>
                    </Link>

                    <button
                        onClick={logout}
                        className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 flex justify-center px-6 py-16">
                <div className="w-full max-w-[700px]">
                    {/* Page Title */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl shadow-lg shadow-violet-500/30 mb-6 border border-white/10">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">Notification Settings</h1>
                        <p className="text-gray-400">Manage your email reminder preferences</p>
                    </div>

                    {/* Settings Card */}
                    <div className="glass-card rounded-3xl p-8 sm:p-12 shadow-xl border-white/10 bg-white/5 backdrop-blur-xl">
                        <form onSubmit={saveSettings}>

                            {/* Email Section */}
                            <div className="text-center pb-16 border-b border-white/10">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-4 ring-1 ring-blue-500/50">
                                    <Mail className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Email Address</h3>
                                <p className="text-sm text-gray-400 mb-6">Reminders will be sent to this address</p>
                                <div className="flex justify-center">
                                    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-6 py-3 shadow-sm">
                                        <span className="text-gray-200 font-medium font-mono text-sm">{email || "Loading..."}</span>
                                        <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-semibold border border-green-500/20">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Verified
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Notification Toggle */}
                            <div className="text-center pb-20 border-b border-white/10 mt-32">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-fuchsia-500/20 rounded-full mb-4 ring-1 ring-fuchsia-500/50">
                                    <Bell className="w-6 h-6 text-fuchsia-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Email Reminders</h3>
                                <p className="text-sm text-gray-400 mb-8">Get notified before your subscriptions renew</p>

                                <div className="flex justify-center">
                                    <div className="inline-flex items-center gap-4">
                                        <span className={`text-sm font-medium transition-colors ${!enabled ? 'text-white' : 'text-gray-500'}`}>
                                            Disabled
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setEnabled(!enabled)}
                                            className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${enabled ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30' : 'bg-gray-700'
                                                }`}
                                        >
                                            <span className="sr-only">Toggle notifications</span>
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${enabled ? 'translate-x-8' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                        <span className={`text-sm font-medium transition-colors ${enabled ? 'text-white' : 'text-gray-500'}`}>
                                            Enabled
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timing Selection */}
                            <div className={`text-center pb-20 mt-32 transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-full mb-4 ring-1 ring-orange-500/50">
                                    <Calendar className="w-6 h-6 text-orange-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Reminder Timing</h3>
                                <p className="text-sm text-gray-400 mb-10">Choose when to receive your reminder</p>

                                <div className="flex justify-center">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                        {[
                                            { value: 3, label: "3 Days", desc: "Last minute" },
                                            { value: 7, label: "7 Days", desc: "Recommended" },
                                            { value: 14, label: "14 Days", desc: "Early bird" }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setDays(option.value)}
                                                className={`relative group flex flex-col items-center p-6 border rounded-2xl text-center transition-all duration-300 hover:scale-105 ${days === option.value
                                                    ? 'border-violet-500/50 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 shadow-lg shadow-violet-500/20'
                                                    : 'border-white/10 bg-white/5 hover:border-violet-500/30 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className={`text-4xl font-bold mb-2 transition-colors ${days === option.value ? 'text-white' : 'text-gray-400'
                                                    }`}>
                                                    {option.value}
                                                </span>
                                                <span className={`text-sm font-semibold uppercase tracking-wide mb-1 transition-colors ${days === option.value ? 'text-fuchsia-400' : 'text-gray-500'
                                                    }`}>
                                                    {option.label}
                                                </span>
                                                <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{option.desc}</span>

                                                {days === option.value && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg border border-white/20">
                                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Save Button & Messages */}
                            <div className="pt-40 flex flex-col items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="group relative px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-violet-600/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 min-w-[200px]"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>

                                {msg && (
                                    <div className={`px-6 py-3 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${msgType === 'success'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {msgType === 'success' ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        <span className="font-medium">{msg}</span>
                                    </div>
                                )}
                            </div>

                        </form>
                    </div>

                    {/* Info Card */}
                    <div className="mt-10 glass-panel rounded-2xl p-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg shrink-0 text-blue-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-1">How it works</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    We'll send you an email reminder before your subscription renews. Make sure to set the <strong>Next Billing Date</strong> when adding subscriptions in your dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
