import { X, ExternalLink, CheckCircle2, GraduationCap } from "lucide-react";
import { useState } from "react";

type StudentDiscount = {
    id: number;
    service_name: string;
    category: string;
    regular_price_cents: number;
    student_price_cents: number;
    discount_percentage: number;
    monthly_savings_cents: number;
    annual_savings_cents: number;
    requirements: string;
    verification_method: string;
    direct_link: string;
    availability: string;
    notes: string | null;
    subscription_id?: number;
    already_applied?: boolean;
};

type Props = {
    discount: StudentDiscount;
    onApply: (subscriptionId: number) => void;
    onClose: () => void;
};

const VERIFY_LABELS: Record<string, string> = {
    edu_email: "Enter your .edu email",
    sheerid:   "Complete SheerID verification",
    unidays:   "Verify via UNiDAYS",
    manual:    "Upload student ID",
};

export default function StudentDiscountModal({ discount, onApply, onClose }: Props) {
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);

    const requirements = (() => {
        try { return JSON.parse(discount.requirements) as string[]; } catch { return []; }
    })();

    const monthly  = (discount.monthly_savings_cents / 100).toFixed(2);
    const annual   = (discount.annual_savings_cents / 100).toFixed(2);
    const regular  = (discount.regular_price_cents / 100).toFixed(2);
    const student  = (discount.student_price_cents / 100).toFixed(2);
    const verify   = VERIFY_LABELS[discount.verification_method] ?? discount.verification_method;
    const isApplied = discount.already_applied || applied;

    const handleApply = async () => {
        if (!discount.subscription_id) return;
        setApplying(true);
        try {
            await onApply(discount.subscription_id);
            setApplied(true);
            setTimeout(() => onClose(), 1200);
        } catch { } finally { setApplying(false); }
    };

    const divider = { borderBottom: "1px solid rgba(255,255,255,0.07)" };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="w-full flex flex-col"
                style={{
                    maxWidth: 620,
                    background: "linear-gradient(150deg, #0E1020 0%, #100D22 100%)",
                    border: "1px solid rgba(139,92,246,0.28)",
                    borderRadius: 28,
                    boxShadow: "0 0 80px rgba(124,58,237,0.2), 0 40px 100px rgba(0,0,0,0.7)",
                    overflow: "hidden",
                }}
            >
                {/* ── HEADER ── */}
                <div
                    className="flex items-center justify-between px-8 py-5"
                    style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(217,70,239,0.13))",
                        ...divider,
                    }}
                >
                    <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 rounded-2xl blur-lg opacity-50"
                                style={{ background: "linear-gradient(135deg,#7C3AED,#D946EF)" }} />
                            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg,#7C3AED,#D946EF)" }}>
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="text-lg font-bold text-white">Student Discount</span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                                    style={{ background: "rgba(217,70,239,0.2)", color: "#E879F9", border: "1px solid rgba(217,70,239,0.32)" }}>
                                    Available ✦
                                </span>
                            </div>
                            <p className="text-sm text-white/40 mt-0.5">{discount.service_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                        <X className="w-4 h-4 text-white/40" />
                    </button>
                </div>

                {/* ── SAVINGS ── */}
                <div className="px-8 py-6" style={divider}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-4"
                        style={{ color: "rgba(232,121,249,0.65)" }}>Your Savings</p>

                    <div className="flex items-end gap-10 mb-5">
                        <div>
                            <p className="text-xs text-white/30 uppercase tracking-wide mb-1">Per Month</p>
                            <p className="text-4xl font-black leading-none text-transparent bg-clip-text"
                                style={{ backgroundImage: "linear-gradient(135deg, #C084FC, #E879F9)" }}>
                                ${monthly}
                            </p>
                        </div>
                        <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.07)" }} />
                        <div>
                            <p className="text-xs text-white/30 uppercase tracking-wide mb-1">Per Year</p>
                            <p className="text-4xl font-black leading-none text-transparent bg-clip-text"
                                style={{ backgroundImage: "linear-gradient(135deg, #C084FC, #E879F9)" }}>
                                ${annual}
                            </p>
                        </div>
                    </div>

                    {/* Price comparison */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-white/30 line-through">${regular}/mo</span>
                        <span className="text-sm text-white/20">→</span>
                        <span className="text-sm font-semibold text-violet-300">${student}/mo</span>
                        <span className="ml-auto text-xs font-black px-3 py-1 rounded-full"
                            style={{ background: "rgba(217,70,239,0.15)", color: "#E879F9", border: "1px solid rgba(217,70,239,0.3)" }}>
                            {discount.discount_percentage}% OFF
                        </span>
                    </div>
                </div>

                {/* ── REQUIREMENTS ── */}
                {requirements.length > 0 && (
                    <div className="px-8 py-5" style={divider}>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Requirements</p>
                        <div className="flex flex-wrap gap-2.5">
                            {requirements.map((req, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full"
                                    style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.22)" }}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                                    <span className="text-sm text-white/65">{req}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STEPS ── */}
                <div className="px-8 py-5" style={divider}>
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">How to Get It</p>
                    <div className="flex flex-col gap-3.5">
                        {[
                            { n: 1, title: "Visit the student plan page", sub: `Go to ${discount.service_name}'s student signup` },
                            { n: 2, title: "Verify your student status", sub: verify },
                            { n: 3, title: "Start saving!", sub: `$${monthly}/month saved immediately` },
                        ].map(({ n, title, sub }) => (
                            <div key={n} className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                                    style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.45), rgba(217,70,239,0.3))", border: "1px solid rgba(139,92,246,0.45)", color: "#C084FC" }}>
                                    {n}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-sm font-semibold text-white/85">{title}</span>
                                    <span className="text-sm text-white/30"> — {sub}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── PRO TIP ── */}
                {discount.notes && (
                    <div className="px-8 py-4 flex items-start gap-3"
                        style={{ background: "rgba(250,204,21,0.05)", ...divider }}>
                        <span className="text-lg leading-none flex-shrink-0 mt-0.5">💡</span>
                        <p className="text-sm text-yellow-200/60 leading-relaxed">
                            <span className="font-semibold text-yellow-300/80">Pro Tip: </span>
                            {discount.notes}
                        </p>
                    </div>
                )}

                {/* ── ALREADY APPLIED ── */}
                {isApplied && (
                    <div className="px-8 py-3.5 flex items-center gap-2.5"
                        style={{ background: "rgba(16,185,129,0.08)", ...divider }}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <p className="text-sm font-semibold text-emerald-300">Discount already applied ✓</p>
                    </div>
                )}

                {/* ── ACTIONS ── */}
                <div className="px-8 py-5 flex items-center gap-3">
                    <a
                        href={discount.direct_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                            background: "linear-gradient(135deg, #7C3AED, #D946EF)",
                            boxShadow: "0 4px 20px rgba(124,58,237,0.38)",
                        }}
                    >
                        Get Student Discount
                        <ExternalLink className="w-4 h-4" />
                    </a>

                    {discount.subscription_id && !isApplied && (
                        <button
                            onClick={handleApply}
                            disabled={applying}
                            className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shrink-0"
                            style={{
                                background: "rgba(16,185,129,0.12)",
                                border: "1px solid rgba(16,185,129,0.3)",
                                color: "#34D399",
                            }}
                        >
                            {applying
                                ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                : <><CheckCircle2 className="w-4 h-4" /> Applied</>
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
