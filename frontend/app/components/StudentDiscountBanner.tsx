import { GraduationCap, TrendingUp, ExternalLink } from "lucide-react";

type StudentDiscount = {
    id: number;
    service_name: string;
    monthly_savings_cents: number;
    annual_savings_cents: number;
    discount_percentage: number;
    already_applied?: boolean;
};

type Props = {
    discount: StudentDiscount;
    onLearnMore: () => void;
};

export default function StudentDiscountBanner({ discount, onLearnMore }: Props) {
    const monthlySavings = (discount.monthly_savings_cents / 100).toFixed(2);
    const annualSavings = (discount.annual_savings_cents / 100).toFixed(2);

    if (discount.already_applied) {
        // Show a subtle "applied" badge instead of the full banner
        return (
            <div className="mb-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2.5 flex items-center gap-2.5">
                <div className="p-1.5 bg-green-500/20 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-300">
                        ✅ Student Discount Applied
                    </p>
                    <p className="text-xs text-green-400/70 mt-0.5">
                        Saving ${monthlySavings}/mo • ${annualSavings}/yr
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-2 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 rounded-lg p-3 hover:border-violet-500/50 transition-all cursor-pointer group relative overflow-hidden backdrop-blur-sm"
            onClick={onLearnMore}>
            <div className="flex items-center gap-2.5 relative z-10">
                {/* Icon */}
                <div className="p-1.5 bg-violet-500/20 rounded-lg group-hover:bg-violet-500/30 transition-colors">
                    <GraduationCap className="w-4 h-4 text-violet-300" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-violet-200 font-semibold text-sm">
                            Student Deal Available
                        </h3>
                        <div className="px-1.5 py-0.5 bg-violet-500/25 rounded text-violet-200 text-[10px] font-bold border border-violet-500/30">
                            {discount.discount_percentage}% OFF
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                        Save ${monthlySavings}/mo • ${annualSavings}/yr
                    </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1.5">
                    <span className="text-violet-300 text-xs font-medium hidden sm:inline">Details</span>
                    <div className="bg-violet-500/20 p-1.5 rounded group-hover:bg-violet-500/30 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5 text-violet-300" />
                    </div>
                </div>
            </div>

            {/* Subtle shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        </div>
    );
}
