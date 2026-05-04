"use client";

import { useState, useEffect } from "react";
import { X, GraduationCap, Loader2, CheckCircle, AlertCircle, Mail, ArrowRight, RotateCcw } from "lucide-react";
import { apiFetch } from "../lib/api";

type Step = "email" | "code" | "success";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function VerificationModal({ isOpen, onClose, onSuccess }: Props) {
    const [step, setStep] = useState<Step>("email");
    const [eduEmail, setEduEmail] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0); // seconds until resend allowed
    const [devCode, setDevCode] = useState<string | null>(null); // shown when SMTP is off

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep("email");
            setEduEmail("");
            setCode("");
            setError(null);
            setDevCode(null);
            setCountdown(0);
        }
    }, [isOpen]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    if (!isOpen) return null;

    // ── Step 1: Request verification code ────────────────────────────────────
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eduEmail.toLowerCase().endsWith(".edu")) {
            setError("Please enter a valid .edu email address.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch("/auth/verify-edu", {
                method: "POST",
                body: JSON.stringify({ edu_email: eduEmail }),
            });
            // C-2: Only show dev_code in development — never expose in production
            if (res.dev_code && process.env.NODE_ENV === "development") {
                setDevCode(res.dev_code);
            }
            setStep("code");
            setCountdown(60); // allow resend after 60s

        } catch (err: any) {
            setError(err.message || "Failed to send code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Confirm the code ──────────────────────────────────────────────
    const handleConfirmCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(code)) {
            setError("Please enter the 6-digit code from your email.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await apiFetch("/auth/verify-edu/confirm", {
                method: "POST",
                body: JSON.stringify({ code }),
            });
            setStep("success");
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2500);
        } catch (err: any) {
            setError(err.message || "Invalid or expired code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Resend code ───────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (countdown > 0) return;
        setLoading(true);
        setError(null);
        setDevCode(null);
        setCode(""); // M-7: clear stale code so user can't accidentally submit it
        try {
            const res = await apiFetch("/auth/verify-edu", {
                method: "POST",
                body: JSON.stringify({ edu_email: eduEmail }),
            });
            // C-2: Only show dev_code in development
            if (res.dev_code && process.env.NODE_ENV === "development") setDevCode(res.dev_code);
            setCountdown(60);
        } catch (err: any) {
            setError(err.message || "Failed to resend. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{
                    background: "rgba(13, 10, 30, 0.97)",
                    border: "1px solid rgba(168,85,247,0.2)",
                    boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 24px 48px rgba(0,0,0,0.6)",
                }}
            >
                {/* Header */}
                <div
                    className="relative px-6 pt-6 pb-5 text-center"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>

                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}
                    >
                        <GraduationCap size={24} className="text-violet-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Student Verification</h2>
                    <p className="text-sm text-white/40 mt-0.5">Unlock exclusive student discounts</p>

                    {/* Step indicators */}
                    {step !== "success" && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            {(["email", "code"] as Step[]).map((s, i) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                                        style={{
                                            background: step === s || (s === "email" && step === "code")
                                                ? "rgba(168,85,247,0.3)"
                                                : "rgba(255,255,255,0.05)",
                                            border: step === s
                                                ? "1px solid rgba(168,85,247,0.7)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                            color: step === s ? "#A855F7" : "rgba(255,255,255,0.3)",
                                        }}
                                    >
                                        {s === "email" && step === "code" ? "✓" : i + 1}
                                    </div>
                                    {i === 0 && (
                                        <div className="w-8 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="px-6 py-5">

                    {/* ── STEP 1: Email ─────────────────────────────────── */}
                    {step === "email" && (
                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                    University Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" style={{ width: 17, height: 17 }} />
                                    <input
                                        type="email"
                                        placeholder="you@university.edu"
                                        value={eduEmail}
                                        onChange={e => { setEduEmail(e.target.value); setError(null); }}
                                        className="liquid-input w-full rounded-xl text-sm py-3.5"
                                        style={{ paddingLeft: "2.75rem", paddingRight: "1rem" }}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-white/30 mt-2">
                                    We'll send a 6-digit verification code to this address.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <AlertCircle size={15} className="text-red-400 shrink-0" />
                                    <span className="text-red-400">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="liquid-btn w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading
                                    ? <><Loader2 size={17} className="animate-spin" /> Sending code...</>
                                    : <>Send Verification Code <ArrowRight size={16} /></>
                                }
                            </button>
                        </form>
                    )}

                    {/* ── STEP 2: Code ──────────────────────────────────── */}
                    {step === "code" && (
                        <form onSubmit={handleConfirmCode} className="space-y-4">
                            {/* Dev code hint */}
                            {devCode && (
                                <div className="p-3 rounded-xl text-center"
                                    style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                                    <p className="text-xs text-yellow-400/80 font-medium">🛠 Dev mode — SMTP not configured</p>
                                    <p className="text-2xl font-black text-yellow-400 tracking-widest mt-1">{devCode}</p>
                                    <p className="text-xs text-yellow-400/50 mt-1">Use this code to complete verification</p>
                                </div>
                            )}

                            {!devCode && (
                                <div className="p-3 rounded-xl text-center"
                                    style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                                    <p className="text-sm text-white/60">Code sent to</p>
                                    <p className="text-sm font-semibold text-violet-400 mt-0.5">{eduEmail}</p>
                                    <p className="text-xs text-white/30 mt-1">Check your inbox & spam folder. Valid for 15 minutes.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                    6-Digit Code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={code}
                                    onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(null); }}
                                    className="liquid-input w-full rounded-xl text-center text-2xl py-3.5 font-bold tracking-[0.5em]"
                                    required
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <AlertCircle size={15} className="text-red-400 shrink-0" />
                                    <span className="text-red-400">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="liquid-btn w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading
                                    ? <><Loader2 size={17} className="animate-spin" /> Verifying...</>
                                    : <>Verify <ArrowRight size={16} /></>
                                }
                            </button>

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => { setStep("email"); setCode(""); setError(null); setDevCode(null); }}
                                    className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                                >
                                    <ArrowRight size={12} className="rotate-180" /> Change email
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={countdown > 0 || loading}
                                    className="text-xs text-violet-400/70 hover:text-violet-400 disabled:text-white/20 transition-colors flex items-center gap-1"
                                >
                                    <RotateCcw size={12} />
                                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── STEP 3: Success ───────────────────────────────── */}
                    {step === "success" && (
                        <div className="text-center py-6">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
                            >
                                <CheckCircle size={32} className="text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">You're Verified! 🎓</h3>
                            <p className="text-white/50">Student discounts are now unlocked.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
