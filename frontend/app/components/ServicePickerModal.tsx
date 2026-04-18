import { Search, X, Sparkles, Tag, TrendingDown, Star } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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

// Deterministic accent colour per service name (matches SubscriptionCard)
function getServiceColor(name: string): string {
    const palette = [
        "#7C3AED", "#D946EF", "#06B6D4", "#10B981",
        "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
        "#F97316", "#3B82F6",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
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
    const [activeCategory, setActiveCategory] = useState("All");

    useEffect(() => {
        apiFetch("/api/student-discounts")
            .then(data => {
                setServices(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch services", err);
                setLoading(false);
            });
    }, []);

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchSearch = s.service_name.toLowerCase().includes(search.toLowerCase()) ||
                s.category.toLowerCase().includes(search.toLowerCase());
            const matchCat = activeCategory === "All" || s.category === activeCategory;
            return matchSearch && matchCat;
        });
    }, [services, search, activeCategory]);

    // Top picks: services with highest discount
    const topPicks = useMemo(() =>
        [...services]
            .filter(s => s.discount_percentage > 0)
            .sort((a, b) => b.discount_percentage - a.discount_percentage)
            .slice(0, 3),
        [services]
    );

    const showTopPicks = !search && activeCategory === "All" && topPicks.length > 0;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)" }}
        >
            <div
                className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl"
                style={{
                    background: "linear-gradient(145deg, #0d1021 0%, #111326 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)",
                }}
            >
                {/* ── Glow blobs behind header ── */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full blur-3xl opacity-15"
                        style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }} />
                    <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-10"
                        style={{ background: "radial-gradient(circle, #D946EF 0%, transparent 70%)" }} />
                </div>

                {/* ── Header ── */}
                <div className="relative z-10 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(217,70,239,0.3))", border: "1px solid rgba(124,58,237,0.3)" }}>
                                <Sparkles className="w-5 h-5 text-violet-300" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Choose a Service</h2>
                                <p className="text-xs text-white/40 mt-0.5">
                                    {services.length} services available
                                    {isVerified && <span className="text-emerald-400 ml-1">· Student prices active</span>}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl transition-all text-white/40 hover:text-white hover:bg-white/10"
                            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search services (e.g. Spotify, Adobe…)"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                borderRadius: 14,
                                color: "white",
                                fontSize: 14,
                                padding: "12px 16px 12px 44px",
                                width: "100%",
                                outline: "none",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Category pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
                        {CATEGORY_FILTERS.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                                style={{
                                    background: activeCategory === cat
                                        ? "linear-gradient(135deg, #7C3AED, #D946EF)"
                                        : "rgba(255,255,255,0.05)",
                                    border: activeCategory === cat
                                        ? "1px solid rgba(124,58,237,0.5)"
                                        : "1px solid rgba(255,255,255,0.07)",
                                    color: activeCategory === cat ? "white" : "rgba(255,255,255,0.45)",
                                    boxShadow: activeCategory === cat ? "0 0 12px rgba(124,58,237,0.3)" : "none",
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── List ── */}
                <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-4">
                            <div className="w-10 h-10 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                            <p className="text-sm text-white/40 font-medium">Discovering student discounts…</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <Search className="w-7 h-7 text-white/20" />
                            </div>
                            <p className="text-sm font-semibold text-white/50 mb-1">No services found</p>
                            <p className="text-xs text-white/30">Try a different search or category</p>
                        </div>
                    ) : (
                        <>
                            {/* Top Picks */}
                            {showTopPicks && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2.5 px-1">
                                        <Star className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Top Student Discounts</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2.5 mb-1">
                                        {topPicks.map(service => {
                                            const accent = getServiceColor(service.service_name);
                                            const ServiceIcon = getServiceIcon(service.service_name);
                                            return (
                                                <button
                                                    key={`top-${service.id}`}
                                                    onClick={() => onSelect(service)}
                                                    className="group flex flex-col items-center gap-2 p-3.5 rounded-xl text-center transition-all"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${accent}10, ${accent}05)`,
                                                        border: `1px solid ${accent}25`,
                                                    }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${accent}50`;
                                                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${accent}25`;
                                                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                                                    }}
                                                >
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                        style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}>
                                                        {ServiceIcon
                                                            ? <ServiceIcon className="w-5 h-5" style={{ color: accent }} />
                                                            : <span className="font-black text-sm" style={{ color: accent }}>{service.service_name[0]}</span>
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-white truncate max-w-[80px]">{service.service_name}</div>
                                                        <div className="text-[10px] font-bold mt-0.5" style={{ color: accent }}>
                                                            -{service.discount_percentage}% OFF
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="h-px my-4" style={{ background: "rgba(255,255,255,0.06)" }} />
                                    <div className="flex items-center gap-2 mb-2.5 px-1">
                                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">All Services</span>
                                    </div>
                                </div>
                            )}

                            {/* Full list */}
                            <div className="space-y-1.5 pb-3">
                                {filteredServices.map(service => {
                                    const accent = getServiceColor(service.service_name);
                                    const ServiceIcon = getServiceIcon(service.service_name);
                                    const displayPrice = isVerified ? service.student_price_cents : service.regular_price_cents;
                                    const hasSaving = isVerified && service.student_price_cents < service.regular_price_cents;

                                    return (
                                        <button
                                            key={service.id}
                                            onClick={() => onSelect(service)}
                                            className="group w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all"
                                            style={{
                                                background: "rgba(255,255,255,0.024)",
                                                border: "1px solid rgba(255,255,255,0.055)",
                                            }}
                                            onMouseEnter={e => {
                                                const el = e.currentTarget as HTMLButtonElement;
                                                el.style.background = `${accent}0E`;
                                                el.style.border = `1px solid ${accent}35`;
                                                el.style.transform = "translateX(3px)";
                                            }}
                                            onMouseLeave={e => {
                                                const el = e.currentTarget as HTMLButtonElement;
                                                el.style.background = "rgba(255,255,255,0.024)";
                                                el.style.border = "1px solid rgba(255,255,255,0.055)";
                                                el.style.transform = "translateX(0)";
                                            }}
                                        >
                                            {/* Icon */}
                                            <div
                                                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                                                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                                            >
                                                {ServiceIcon
                                                    ? <ServiceIcon className="w-5 h-5" style={{ color: accent }} />
                                                    : <span className="font-black text-base" style={{ color: accent }}>{service.service_name[0]}</span>
                                                }
                                            </div>

                                            {/* Name + badges */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-white text-sm leading-tight truncate">
                                                    {service.service_name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span
                                                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                        style={{
                                                            background: `${accent}15`,
                                                            color: accent,
                                                            border: `1px solid ${accent}30`,
                                                        }}
                                                    >
                                                        {service.category}
                                                    </span>
                                                    {isVerified && service.discount_percentage > 0 && (
                                                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded-full"
                                                            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                                                            <Tag className="w-2.5 h-2.5" />
                                                            {service.discount_percentage}% off
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right shrink-0">
                                                <div className="font-black text-lg text-white leading-tight">
                                                    ${(displayPrice / 100).toFixed(2)}
                                                    <span className="text-xs font-medium text-white/35">/mo</span>
                                                </div>
                                                {hasSaving && (
                                                    <div className="flex items-center gap-1 justify-end mt-0.5">
                                                        <TrendingDown className="w-2.5 h-2.5 text-emerald-400" />
                                                        <span className="text-[10px] text-emerald-400 font-semibold">
                                                            save ${(service.monthly_savings_cents / 100).toFixed(2)}/mo
                                                        </span>
                                                    </div>
                                                )}
                                                {!hasSaving && (
                                                    <div className="text-[10px] text-white/25 mt-0.5">regular price</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="relative z-10 px-5 py-4 flex flex-col items-center gap-2.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
                    {!isVerified && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center"
                            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(217,70,239,0.08))", border: "1px solid rgba(124,58,237,0.2)" }}>
                            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <p className="text-xs font-semibold text-violet-300">
                                Verify your student email to unlock exclusive discounts!
                            </p>
                        </div>
                    )}
                    <p className="text-xs text-white/40">
                        Can&apos;t find a service?{" "}
                        <button onClick={onClose} className="text-violet-400 font-semibold hover:text-violet-300 transition-colors underline-offset-2 hover:underline">
                            Enter it manually
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
