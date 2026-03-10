import { X, ExternalLink, CheckCircle2, GraduationCap, DollarSign } from "lucide-react";
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

export default function StudentDiscountModal({ discount, onApply, onClose }: Props) {
    const [applying, setApplying] = useState(false);

    const requirements = JSON.parse(discount.requirements) as string[];
    const monthlySavings = (discount.monthly_savings_cents / 100).toFixed(2);
    const annualSavings = (discount.annual_savings_cents / 100).toFixed(2);

    const handleMarkAsApplied = async () => {
        if (!discount.subscription_id) return;

        setApplying(true);
        try {
            await onApply(discount.subscription_id);
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to mark discount as applied:", error);
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="liquid-panel rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Header */}
                <div className="sticky top-0 bg-[#0F1219]/80 backdrop-blur-md border-b border-white/10 p-6 flex items-start justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl shadow-lg shadow-fuchsia-500/20">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>Student Discount Available!</h2>
                            <p className="text-sm text-white/50 mt-1">{discount.service_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white/50 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Savings Highlight */}
                    <div className="liquid-card rounded-xl p-6 border border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.05)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-lg font-bold text-emerald-300">Your Savings</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-white/40">Per Month</p>
                                <p className="text-3xl font-black text-emerald-400" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>${monthlySavings}</p>
                            </div>
                            <div>
                                <p className="text-sm text-white/40">Per Year</p>
                                <p className="text-3xl font-black text-emerald-400" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>${annualSavings}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-emerald-500/20">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/40">Regular Price:</span>
                                <span className="font-semibold text-white/30 line-through">
                                    ${(discount.regular_price_cents / 100).toFixed(2)}/mo
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-white/40">Student Price:</span>
                                <span className="font-bold text-emerald-400 text-lg">
                                    ${(discount.student_price_cents / 100).toFixed(2)}/mo
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-white/40">Discount:</span>
                                <span className="font-bold text-fuchsia-400">
                                    {discount.discount_percentage}% OFF
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>
                            <CheckCircle2 className="w-5 h-5 text-violet-400" />
                            What You Need
                        </h3>
                        <ul className="space-y-2">
                            {requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
                                    <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-violet-500/30">
                                        <div className="w-2 h-2 rounded-full bg-violet-400" />
                                    </div>
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* How to Get It */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>How to Get It</h3>
                        <ol className="space-y-4">
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    1
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Visit the student plan page</p>
                                    <p className="text-xs text-white/50 mt-1">Click the link below to go directly to {discount.service_name}&apos;s student signup</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Verify your student status</p>
                                    <p className="text-xs text-white/50 mt-1">
                                        {discount.verification_method === 'edu_email' && 'Enter your .edu email address'}
                                        {discount.verification_method === 'sheerid' && 'Complete SheerID verification'}
                                        {discount.verification_method === 'unidays' && 'Verify through UNiDAYS'}
                                        {discount.verification_method === 'manual' && 'Upload your student ID or documentation'}
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    3
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Enjoy your discount!</p>
                                    <p className="text-xs text-white/50 mt-1">Start saving ${monthlySavings} every month</p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    {/* Additional Notes */}
                    {discount.notes && (
                        <div className="rounded-lg p-4 border border-blue-500/30 bg-blue-500/10">
                            <p className="text-sm text-blue-300">
                                <span className="font-bold text-blue-400">💡 Pro Tip: </span>
                                {discount.notes}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <a
                            href={discount.direct_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-4 rounded-xl font-bold hover:from-violet-700 hover:to-fuchsia-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20"
                        >
                            Get Student Discount
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        {discount.subscription_id && !discount.already_applied && (
                            <button
                                onClick={handleMarkAsApplied}
                                disabled={applying}
                                className="px-6 py-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold hover:bg-emerald-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {applying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Mark as Applied
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {discount.already_applied && (
                        <div className="rounded-lg p-4 border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <p className="text-sm text-emerald-300 font-bold">
                                ✅ You&apos;ve already marked this discount as applied!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
