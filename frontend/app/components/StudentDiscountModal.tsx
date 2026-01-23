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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 glass-panel border-b border-white/10 p-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Student Discount Available!</h2>
                            <p className="text-sm text-gray-600 mt-1">{discount.service_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Savings Highlight */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Your Savings</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Per Month</p>
                                <p className="text-3xl font-bold text-green-600">${monthlySavings}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Per Year</p>
                                <p className="text-3xl font-bold text-green-600">${annualSavings}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-green-200">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Regular Price:</span>
                                <span className="font-semibold text-gray-900 line-through">
                                    ${(discount.regular_price_cents / 100).toFixed(2)}/mo
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-600">Student Price:</span>
                                <span className="font-bold text-green-600 text-lg">
                                    ${(discount.student_price_cents / 100).toFixed(2)}/mo
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-bold text-orange-600">
                                    {discount.discount_percentage}% OFF
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            What You Need
                        </h3>
                        <ul className="space-y-2">
                            {requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                    </div>
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* How to Get It */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Get It</h3>
                        <ol className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    1
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Visit the student plan page</p>
                                    <p className="text-xs text-gray-600 mt-1">Click the link below to go directly to {discount.service_name}'s student signup</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Verify your student status</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {discount.verification_method === 'edu_email' && 'Enter your .edu email address'}
                                        {discount.verification_method === 'sheerid' && 'Complete SheerID verification'}
                                        {discount.verification_method === 'unidays' && 'Verify through UNiDAYS'}
                                        {discount.verification_method === 'manual' && 'Upload your student ID or documentation'}
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    3
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Enjoy your discount!</p>
                                    <p className="text-xs text-gray-600 mt-1">Start saving ${monthlySavings} every month</p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    {/* Additional Notes */}
                    {discount.notes && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-900">
                                <span className="font-semibold">💡 Pro Tip: </span>
                                {discount.notes}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <a
                            href={discount.direct_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            Get Student Discount
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        {discount.subscription_id && !discount.already_applied && (
                            <button
                                onClick={handleMarkAsApplied}
                                disabled={applying}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {applying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark as Applied
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {discount.already_applied && (
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-900 font-medium">
                                ✅ You've already marked this discount as applied!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
