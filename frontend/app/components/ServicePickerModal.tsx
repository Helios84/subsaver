"use client";

import { Search, X, Sparkles, Tag, TrendingDown, Star, Zap } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { getServiceIcon } from "../dashboard/serviceIcons";

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
};

type Props = {
    isVerified: boolean;
    onSelect: (service: StudentDiscount) => void;
    onClose: () => void;
};

// Same deterministic colour as SubscriptionCard — stays consistent across UI
function getServiceColor(name: string): string {
    const palette = [
        "#7C3AED", "#D946EF", "#06B6D4", "#10B981",
        "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
        "#F97316", "#3B82F6",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

const CATEGORY_FILTERS = [
    "All", "Entertainment", "Productivity", "Gaming",
    "Education", "Health & Fitness", "Finance", "News & Media", "Other",
];

export default function ServicePickerModal({ isVerified, onSelect, onClose }: Props) {
    const [services, setServices] = useState<StudentDiscount[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeCategory, setCategory] = useState("All");

    useEffect(() => {
        apiFetch("/api/student-discounts")
            .then(data => { setServices(data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => services.filter(s => {
        const q = search.toLowerCase();
        return (s.service_name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
            && (activeCategory === "All" || s.category === activeCategory);
    }), [services, search, activeCategory]);

    // Escape key closes modal
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Lock scroll while open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // Top 3 by discount — only show when no active filter
    const topPicks = useMemo(() =>
        [...services].filter(s => s.discount_percentage > 0 && s.discount_percentage < 100)
            .sort((a, b) => b.discount_percentage - a.discount_percentage)
            .slice(0, 3),
        [services]);

    const showTopPicks = !search && activeCategory === "All" && topPicks.length > 0;

    return (
        <>
            {/* CSS for pure-CSS hover on list rows — no JS style mutations = no scroll jank */}
            <style>{`
                .spm-row {
                    transition: background 0.15s, border-color 0.15s, transform 0.15s;
                }
                .spm-row:hover {
                    border-color: var(--spm-accent, rgba(124,58,237,0.4)) !important;
                    transform: translateX(2px);
                }
                .spm-top-card {
                    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
                }
                .spm-top-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
                }
                .spm-pill {
                    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
                }
            `}</style>

            <div
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
                style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)" }}
                onClick={e => e.target === e.currentTarget && onClose()}
            >
                <div
                    className="relative w-full sm:max-w-xl flex flex-col rounded-t-3xl sm:rounded-2xl"
                    style={{
                        background: "linear-gradient(160deg, #0e1123 0%, #0b0e1c 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
                        maxHeight: "92vh",
                    }}
                >
                    {/* Background glow — pointer-events:none so it doesn't block clicks */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" aria-hidden>
                        <div className="absolute -top-24 -right-12 w-72 h-72 rounded-full blur-3xl"
                            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
                        <div className="absolute -top-12 -left-8 w-48 h-48 rounded-full blur-3xl"
                            style={{ background: "radial-gradient(circle, rgba(217,70,239,0.10) 0%, transparent 70%)" }} />
                    </div>

                    {/* ── HEADER ── */}
                    <div className="relative flex-shrink-0 px-5 pt-5 pb-0">
                        {/* Title row */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(217,70,239,0.25))",
                                        border: "1px solid rgba(124,58,237,0.35)",
                                        boxShadow: "0 0 16px rgba(124,58,237,0.25)",
                                    }}>
                                    <Sparkles className="w-5 h-5 text-violet-300" />
                                </div>
                                <div>
                                    <h2 className="text-[18px] font-bold text-white leading-tight tracking-tight">Choose a Service</h2>
                                    <p className="text-[12px] text-white/40 mt-0.5">
                                        {services.length > 0 ? `${services.length} services` : "Loading…"}
                                        {isVerified && <span className="ml-1.5 text-emerald-400 font-medium">· Student prices ON</span>}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose}
                                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 mt-0.5"
                                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                                aria-label="Close service picker"
                            >
                                <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search services (e.g. Spotify, Adobe…)"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                                className="w-full text-sm text-white placeholder:text-white/25 outline-none"
                                style={{
                                    background: "rgba(255,255,255,0.055)",
                                    border: "1px solid rgba(255,255,255,0.09)",
                                    borderRadius: 14,
                                    padding: "11px 40px 11px 40px",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.55)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                            />
                            {search && (
                                <button onClick={() => setSearch("")}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category pills — horizontal scroll, no scrollbar shown */}
                        <div className="flex gap-2 pb-4 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                            {CATEGORY_FILTERS.map(cat => {
                                const active = activeCategory === cat;
                                return (
                                    <button key={cat} onClick={() => setCategory(cat)}
                                        className="spm-pill flex-shrink-0 text-[11px] font-semibold rounded-full px-3.5 py-1.5"
                                        style={{
                                            background: active ? "linear-gradient(135deg, #7C3AED, #D946EF)" : "rgba(255,255,255,0.055)",
                                            border: active ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                            color: active ? "white" : "rgba(255,255,255,0.45)",
                                            boxShadow: active ? "0 0 14px rgba(124,58,237,0.35)" : "none",
                                            outline: "none",
                                        }}>
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="absolute left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>

                    {/* ── SCROLLABLE LIST ── */}
                    <div className="flex-1 overflow-y-auto" style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255,255,255,0.08) transparent",
                        overscrollBehavior: "contain",
                    }}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-9 h-9 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                                <p className="text-sm text-white/35 font-medium">Discovering student discounts…</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                    <Search className="w-6 h-6 text-white/20" />
                                </div>
                                <p className="text-sm font-semibold text-white/50 mb-1">No services found</p>
                                <p className="text-xs text-white/30">Try a different search term or category</p>
                            </div>
                        ) : (
                            <div className="px-3 py-4 space-y-0">

                                {/* ── TOP STUDENT DISCOUNTS ── */}
                                {showTopPicks && (
                                    <div className="mb-5">
                                        <div className="flex items-center gap-2 px-2 mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                                                <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.08em]">Top Student Discounts</span>
                                            </div>
                                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2.5 px-1">
                                            {topPicks.map(service => {
                                                const accent = getServiceColor(service.service_name);
                                                const Icon = getServiceIcon(service.service_name);
                                                const price = isVerified ? service.student_price_cents : service.regular_price_cents;
                                                return (
                                                    <button key={`top-${service.id}`}
                                                        onClick={() => onSelect(service)}
                                                        className="spm-top-card group flex flex-col items-center gap-2.5 p-4 rounded-2xl text-center"
                                                        style={{
                                                            background: `linear-gradient(145deg, ${accent}12, ${accent}06)`,
                                                            border: `1px solid ${accent}28`,
                                                        }}>
                                                        {/* Icon */}
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                                            style={{ background: `${accent}22`, border: `1px solid ${accent}38` }}>
                                                            {Icon
                                                                ? <Icon className="w-6 h-6" style={{ color: accent }} />
                                                                : <span className="font-black text-lg" style={{ color: accent }}>{service.service_name[0]}</span>
                                                            }
                                                        </div>
                                                        {/* Name */}
                                                        <div className="w-full">
                                                            <div className="text-xs font-bold text-white truncate leading-tight"
                                                                title={service.service_name}>{service.service_name}</div>
                                                            <div className="text-[11px] font-black mt-1" style={{ color: accent }}>
                                                                ${(price / 100).toFixed(2)}<span className="text-[9px] font-medium opacity-60">/mo</span>
                                                            </div>
                                                            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full"
                                                                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)" }}>
                                                                <Zap className="w-2.5 h-2.5 text-emerald-400" fill="currentColor" />
                                                                <span className="text-[9px] font-bold text-emerald-400">
                                                                    -{service.discount_percentage}% OFF
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Section separator */}
                                        <div className="flex items-center gap-2 px-2 mt-5 mb-3">
                                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.08em] px-1">All Services</span>
                                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                                        </div>
                                    </div>
                                )}

                                {/* ── FULL LIST ── */}
                                <div className="space-y-1">
                                    {filtered.map(service => {
                                        const accent = getServiceColor(service.service_name);
                                        const Icon = getServiceIcon(service.service_name);
                                        const price = isVerified ? service.student_price_cents : service.regular_price_cents;
                                        const hasSaving = isVerified && service.student_price_cents < service.regular_price_cents;

                                        return (
                                            <button
                                                key={service.id}
                                                onClick={() => onSelect(service)}
                                                className="spm-row w-full text-left flex items-center gap-3.5 px-3.5 py-3 rounded-2xl"
                                                // CSS var so the :hover rule in <style> can use it per-element
                                                style={{
                                                    background: "rgba(255,255,255,0.028)",
                                                    border: "1px solid rgba(255,255,255,0.06)",
                                                    ["--spm-accent" as any]: `${accent}45`,
                                                }}
                                            >
                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
                                                    {Icon
                                                        ? <Icon className="w-5 h-5" style={{ color: accent }} />
                                                        : <span className="font-black text-sm" style={{ color: accent }}>{service.service_name[0]}</span>
                                                    }
                                                </div>

                                                {/* Name + category */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[14px] font-semibold text-white leading-tight truncate">
                                                        {service.service_name}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                            style={{ background: `${accent}16`, color: accent, border: `1px solid ${accent}28` }}>
                                                            {service.category}
                                                        </span>
                                                        {isVerified && service.discount_percentage > 0 && (
                                                            <span className="text-[10px] font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                                                                style={{ background: "rgba(16,185,129,0.1)", color: "#34D399", border: "1px solid rgba(16,185,129,0.2)" }}>
                                                                <Tag className="w-2.5 h-2.5" />
                                                                -{service.discount_percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right flex-shrink-0 min-w-[70px]">
                                                    <div className="text-[16px] font-black text-white leading-tight">
                                                        ${(price / 100).toFixed(2)}
                                                        <span className="text-[11px] font-medium text-white/30">/mo</span>
                                                    </div>
                                                    {hasSaving ? (
                                                        <div className="flex items-center gap-1 justify-end mt-1">
                                                            <TrendingDown className="w-3 h-3 text-emerald-400" />
                                                            <span className="text-[10px] font-semibold text-emerald-400">
                                                                save ${(service.monthly_savings_cents / 100).toFixed(2)}/mo
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-white/22 mt-0.5">
                                                            ${(service.regular_price_cents / 100).toFixed(2)} regular
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                            </div>
                        )}
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="flex-shrink-0 px-5 py-3.5 flex flex-col items-center gap-2.5"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.18)" }}>
                        {!isVerified && (
                            <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(217,70,239,0.08))",
                                    border: "1px solid rgba(124,58,237,0.22)",
                                }}>
                                <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                <p className="text-[12px] font-semibold text-violet-300 leading-tight">
                                    Verify your student email to unlock exclusive discounts!
                                </p>
                            </div>
                        )}
                        <p className="text-[12px] text-white/35">
                            Can&apos;t find a service?{" "}
                            <button onClick={onClose}
                                className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
                                style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                                Enter it manually
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
