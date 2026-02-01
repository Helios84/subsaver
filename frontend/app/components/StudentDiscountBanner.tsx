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
            <div className="mb-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-green-400">
                        ✅ Student Discount Applied
                    </p>
                    <p className="text-xs text-green-500/80">
                        Saving ${monthlySavings}/month • ${annualSavings}/year
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group relative overflow-hidden"
            onClick={onLearnMore}>
            <div className="flex items-center gap-3 relative z-10">
                {/* Icon */}
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform shadow-inner border border-white/10">
                    <GraduationCap className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-lg drop-shadow-sm">
                            STUDENT DEAL FOUND!
                        </h3>
                        <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                            <span className="text-white text-xs font-bold">
                                {discount.discount_percentage}% OFF
                            </span>
                        </div>
                    </div>
                    <p className="text-white/90 text-sm font-medium">
                        Save ${monthlySavings}/month • ${annualSavings}/year
                    </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-white text-xs font-medium opacity-90">View Deal</span>
                        <div className="flex items-center gap-1 text-white/80">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs">Verify now</span>
                        </div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

            {/* Background Texture */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none mix-blend-overlay" />
        </div>
    );
}
