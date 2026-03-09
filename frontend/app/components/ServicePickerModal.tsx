import { Search, X, Check, DollarSign, Tag, Globe, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
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

const CATEGORY_COLORS: Record<string, { bg: string, text: string, border: string }> = {
    "Entertainment": { bg: "rgba(124,58,237,0.15)", text: "text-violet-400", border: "border-violet-500/30" },
    "Music": { bg: "rgba(236,72,153,0.15)", text: "text-pink-400", border: "border-pink-500/30" },
    "Productivity": { bg: "rgba(59,130,246,0.15)", text: "text-blue-400", border: "border-blue-500/30" },
    "Creative": { bg: "rgba(249,115,22,0.15)", text: "text-orange-400", border: "border-orange-500/30" },
    "Software": { bg: "rgba(107,114,128,0.15)", text: "text-gray-400", border: "border-gray-500/30" },
    "News": { bg: "rgba(234,179,8,0.15)", text: "text-yellow-400", border: "border-yellow-500/30" },
    "Shopping": { bg: "rgba(16,185,129,0.15)", text: "text-emerald-400", border: "border-emerald-500/30" },
    "Other": { bg: "rgba(156,163,175,0.15)", text: "text-gray-400", border: "border-gray-500/30" }
};

export default function ServicePickerModal({ isVerified, onSelect, onClose }: Props) {
    const [services, setServices] = useState<StudentDiscount[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

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

    const filteredServices = services.filter(s =>
        s.service_name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="liquid-card rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10" style={{ background: '#0F1322' }}>
                {/* Header */}
                <div className="p-6 border-b border-white/10 relative overflow-hidden rounded-t-2xl">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="aurora-blob w-64 h-64 opacity-20" style={{
                            background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)",
                            top: "-50%", right: "-10%"
                        }} />
                    </div>

                    <div className="relative z-10 flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center border border-white/10">
                                <Sparkles className="w-5 h-5 text-violet-300" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>Choose a Service</h2>
                                <p className="text-xs text-white/40">Select a subscription to add to your stack</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                            <X className="w-5 h-5 text-gray-400 hover:text-white" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative z-10">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search by name or category (e.g., Spotify, Music...)"
                            className="liquid-input w-full pl-12 pr-4 py-3.5 rounded-xl text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-2.5 flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-white/40 space-y-4">
                            <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                            <p className="text-sm font-medium">Discovering student discounts...</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-white/40 px-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <Search className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="text-base font-medium text-white/60 mb-1">No services found</p>
                            <p className="text-xs">We couldn't find a default template for "{search}".</p>
                        </div>
                    ) : (
                        filteredServices.map(service => {
                            const catStyle = CATEGORY_COLORS[service.category] || CATEGORY_COLORS["Other"];
                            const ServiceIcon = getServiceIcon(service.service_name);

                            return (
                                <button
                                    key={service.id}
                                    onClick={() => onSelect(service)}
                                    className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-violet-500/30 transition-all group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        {ServiceIcon ? (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                <ServiceIcon className="w-6 h-6 text-white group-hover:text-violet-300 transition-colors" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-xl font-bold shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300" style={{ background: catStyle.bg, color: catStyle.text.replace('text-', '') }}>
                                                {service.service_name[0]}
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors">
                                                {service.service_name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${catStyle.text} ${catStyle.border}`} style={{ background: catStyle.bg }}>
                                                    {service.category}
                                                </span>
                                                {isVerified && service.discount_percentage > 0 && (
                                                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                        <Tag className="w-3 h-3" />
                                                        {service.discount_percentage}% Student Discount
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0 ml-4">
                                        <div className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>
                                            ${((isVerified ? service.student_price_cents : service.regular_price_cents) / 100).toFixed(2)}<span className="text-sm font-medium text-white/40">/mo</span>
                                        </div>
                                        {isVerified && service.student_price_cents !== service.regular_price_cents && (
                                            <div className="text-xs text-white/30 line-through mt-0.5 font-medium">
                                                ${(service.regular_price_cents / 100).toFixed(2)}/mo
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20 rounded-b-2xl text-center flex flex-col items-center justify-center gap-2">
                    {!isVerified && (
                        <p className="text-xs font-semibold text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20 inline-flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Verify your student email to unlock exclusive discounts!
                        </p>
                    )}
                    <p className="text-[11px] text-white/30 font-medium">
                        Can't find a service? You can close this window and enter it manually.
                    </p>
                </div>
            </div>
        </div>
    );
}
