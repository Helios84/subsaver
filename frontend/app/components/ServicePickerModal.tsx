import { Search, X, Check, DollarSign, Tag, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getServiceIcon } from "../dashboard/serviceIcons";

type StudentDiscount = {
    id: number;
    service_name: string;
    category: string;
    student_price_cents: number;
    regular_price_cents: number;
    discount_percentage: number;
    direct_link: string;
};

type Props = {
    onSelect: (service: StudentDiscount) => void;
    onClose: () => void;
};

const CATEGORY_COLORS: Record<string, string> = {
    "Entertainment": "bg-purple-100 text-purple-700",
    "Music": "bg-pink-100 text-pink-700",
    "Productivity": "bg-blue-100 text-blue-700",
    "Creative": "bg-orange-100 text-orange-700",
    "Software": "bg-gray-100 text-gray-700",
    "News": "bg-yellow-100 text-yellow-700",
    "Shopping": "bg-green-100 text-green-700",
    "Other": "bg-gray-100 text-gray-600"
};

export default function ServicePickerModal({ onSelect, onClose }: Props) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/20">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">Choose a Service</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                            <X className="w-5 h-5 text-gray-400 hover:text-white" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search services (e.g. Spotify, Adobe...)"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-gray-300">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-3">
                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                            <p>Loading popular services...</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium">No services found</p>
                            <p className="text-sm mt-1">Try searching for something else</p>
                        </div>
                    ) : (
                        filteredServices.map(service => (
                            <button
                                key={service.id}
                                onClick={() => onSelect(service)}
                                className="w-full text-left p-4 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-200 transition group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        const ServiceIcon = getServiceIcon(service.service_name);
                                        return ServiceIcon ? (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center shadow-sm">
                                                <ServiceIcon className="w-6 h-6 text-violet-300" />
                                            </div>
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${CATEGORY_COLORS[service.category] || "bg-gray-100 text-gray-600"}`}>
                                                {service.service_name[0]}
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition">
                                            {service.service_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[service.category] || "bg-gray-100 text-gray-600"
                                                }`}>
                                                {service.category}
                                            </span>
                                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                Save {service.discount_percentage}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                        ${(service.student_price_cents / 100).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500 line-through">
                                        ${(service.regular_price_cents / 100).toFixed(2)}/mo
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl text-center text-xs text-gray-500">
                    Can't find a service? You can still add it manually.
                </div>
            </div>
        </div>
    );
}
