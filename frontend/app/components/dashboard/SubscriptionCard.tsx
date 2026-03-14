"use client";

import { Edit2, X, Save, Activity, Trash2, GraduationCap, Calendar } from "lucide-react";
import { getServiceIcon } from "../../dashboard/serviceIcons";

type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";

export type Sub = {
  id: number;
  name: string;
  price_cents: number;
  billing_cycle: BillingCycle;
  status: Status;
  category: string;
  created_at: string;
  next_billing_date?: string;
  student_discount_applied?: boolean;
  split_with?: number;
};

export type StudentDiscount = {
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

const CATEGORIES = [
  { value: "Entertainment", icon: "🎬", color: "#7C3AED" },
  { value: "Productivity", icon: "💼", color: "#F59E0B" },
  { value: "Gaming", icon: "🎮", color: "#8B5CF6" },
  { value: "Utilities", icon: "🔧", color: "#3B82F6" },
  { value: "Communication", icon: "📱", color: "#10B981" },
  { value: "Health & Fitness", icon: "🏋️", color: "#db2777" },
  { value: "Education", icon: "📚", color: "#6366F1" },
  { value: "Food & Delivery", icon: "🍔", color: "#F97316" },
  { value: "Other", icon: "🎨", color: "#6B7280" },
];

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calculateDaysUntil(next_billing_date?: string): number | null {
  if (!next_billing_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(next_billing_date);
  renewal.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type EditState = {
  name: string;
  price: string;
  cycle: BillingCycle;
  status: Status;
  category: string;
  billingDate: string;
  splitWith: number;
  isSplit: boolean;
};

type Props = {
  sub: Sub;
  isVerified: boolean;
  discount?: StudentDiscount;
  isEditing: boolean;
  isDeleting: boolean;
  editState: EditState;
  onStartEdit: (s: Sub) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => void;
  onToggleStatus: (s: Sub) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  onExecuteDelete: (id: number) => void;
  onDiscountClick: (d: StudentDiscount) => void;
  onEditChange: (patch: Partial<EditState>) => void;
  layoutCompact?: boolean;
};

export default function SubscriptionCard({
  sub: s,
  isVerified,
  discount,
  isEditing,
  isDeleting,
  editState,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleStatus,
  onConfirmDelete,
  onCancelDelete,
  onExecuteDelete,
  onDiscountClick,
  onEditChange,
  layoutCompact,
}: Props) {
  const daysUntil = calculateDaysUntil(s.next_billing_date);

  const renewalBadgeClass =
    daysUntil !== null && daysUntil <= 3 && daysUntil >= 0
      ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
      : daysUntil !== null && daysUntil <= 7
      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
      : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";

  if (isEditing) {
    return (
      <div className="md:col-span-2 xl:col-span-3 border border-violet-500/30 bg-white/5 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-violet-400" />
          Edit Subscription
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</label>
            <input
              value={editState.name}
              onChange={(e) => onEditChange({ name: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-medium">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editState.price}
                onChange={(e) => onEditChange({ price: e.target.value })}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billing Cycle</label>
            <select
              value={editState.cycle}
              onChange={(e) => onEditChange({ cycle: e.target.value as BillingCycle })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
            >
              <option value="monthly" style={{ backgroundColor: "#1E293B" }}>Monthly</option>
              <option value="yearly" style={{ backgroundColor: "#1E293B" }}>Yearly</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
            <select
              value={editState.status}
              onChange={(e) => onEditChange({ status: e.target.value as Status })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
            >
              <option value="active" style={{ backgroundColor: "#1E293B" }}>Active</option>
              <option value="cancelled" style={{ backgroundColor: "#1E293B" }}>Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
            <select
              value={editState.category}
              onChange={(e) => onEditChange({ category: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} style={{ backgroundColor: "#1E293B" }}>
                  {cat.icon} {cat.value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Next Billing Date</label>
            <input
              type="date"
              value={editState.billingDate}
              onChange={(e) => onEditChange({ billingDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Split Cost?</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={editState.isSplit}
                onChange={(e) => onEditChange({ isSplit: e.target.checked })}
                className="w-4 h-4 text-violet-400 rounded focus:ring-violet-500 border-white/20"
              />
              <span className="text-sm text-gray-300">Split with others</span>
            </div>
            {editState.isSplit && (
              <input
                type="number"
                min="1"
                value={editState.splitWith}
                onChange={(e) => onEditChange({ splitWith: parseInt(e.target.value) || 1 })}
                placeholder="Number of people"
                className="mt-2 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
              />
            )}
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => onSaveEdit(s.id)}
            className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-violet-500/40"
          >
            <Save className="w-5 h-5" /> Save Changes
          </button>
          <button
            onClick={onCancelEdit}
            className="flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border-2 border-white/20 text-gray-300 hover:bg-white/5 hover:border-white/30 transition-all hover:scale-[1.02]"
          >
            <X className="w-5 h-5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  const ServiceIcon = getServiceIcon(s.name);

  if (layoutCompact) {
    // Compact list view
    return (
      <div
        className={`flex items-center gap-4 p-3 rounded-xl liquid-card transition-all ${
          isDeleting ? "border border-red-500/30 bg-red-500/5" : ""
        }`}
      >
        {/* Icon */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-violet-500/30 blur-lg rounded-full" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
            {ServiceIcon ? (
              <ServiceIcon className="w-5 h-5 text-violet-300" />
            ) : (
              <span className="text-violet-300 font-bold">{s.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">{s.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              s.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-400"
            }`}>{s.status}</span>
            <span className="text-[11px] text-white/40 capitalize">{s.billing_cycle}</span>
          </div>
        </div>
        {/* Price */}
        <div className="text-emerald-400 font-bold text-base shrink-0">
          {formatMoney(s.split_with && s.split_with > 1 ? s.price_cents / s.split_with : s.price_cents)}
        </div>
        {/* Actions */}
        {!isDeleting ? (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onStartEdit(s)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => onToggleStatus(s)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all" title={s.status === "active" ? "Pause" : "Resume"}><Activity className="w-3.5 h-3.5" /></button>
            <button onClick={() => onConfirmDelete(s.id)} className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onExecuteDelete(s.id)} className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">Delete</button>
            <button onClick={onCancelDelete} className="px-3 py-1.5 text-xs font-semibold border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all">Cancel</button>
          </div>
        )}
      </div>
    );
  }

  // Normal grid card view
  return (
    <div
      className="group relative rounded-xl transition-all duration-300 overflow-hidden liquid-card"
      style={isDeleting ? { border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.05)" } : {}}
    >
      {/* Student Discount Badge */}
      {discount && isVerified && (
        <div className="absolute top-3 right-3 z-10">
          {discount.already_applied ? (
            <div className="px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Applied</span>
            </div>
          ) : (
            <button
              onClick={() => onDiscountClick(discount)}
              className="px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(217,70,239,0.2))", border: "1px solid rgba(217,70,239,0.3)", boxShadow: "0 0 10px rgba(124,58,237,0.2)" }}
            >
              <GraduationCap className="w-3.5 h-3.5 text-fuchsia-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">{discount.discount_percentage}% OFF</span>
            </button>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Icon & Name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-violet-500/30 blur-lg rounded-full" />
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              {ServiceIcon ? (
                <ServiceIcon className="w-6 h-6 text-violet-300" />
              ) : (
                <span className="text-violet-300 font-bold text-xl">{s.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate">{s.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                s.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-gray-400 border border-white/10"
              }`}>{s.status}</span>
              <span className="text-[11px] font-medium text-white/40 capitalize bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{s.billing_cycle}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          {s.split_with && s.split_with > 1 ? (
            <>
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-400/30 blur-lg rounded-lg" />
                <div className="relative text-2xl font-bold text-green-400">{formatMoney(s.price_cents / s.split_with)}</div>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Split with {s.split_with} • Total: {formatMoney(s.price_cents)}</div>
            </>
          ) : (
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-400/30 blur-lg rounded-lg" />
              <div className="relative text-2xl font-bold text-green-400">{formatMoney(s.price_cents)}</div>
            </div>
          )}
        </div>

        {/* Renewal Info */}
        {s.next_billing_date && (
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
            <Calendar className="w-3.5 h-3.5 text-white/30" />
            <span className="text-xs font-medium text-white/40">{formatDate(s.next_billing_date)}</span>
            {daysUntil !== null && (
              <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${renewalBadgeClass}`}>
                {daysUntil <= 0 ? "Overdue" : `${daysUntil}d`}
              </span>
            )}
          </div>
        )}

        {/* Delete Confirmation */}
        {isDeleting && (
          <div className="flex flex-col gap-3 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <span className="text-sm font-bold text-red-300 text-center">Delete this subscription?</span>
            <div className="flex gap-3">
              <button onClick={() => onExecuteDelete(s.id)} className="flex-1 px-6 py-3.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all hover:scale-[1.02]">Yes, Delete</button>
              <button onClick={onCancelDelete} className="flex-1 px-6 py-3.5 text-sm font-semibold border-2 border-white/20 text-gray-300 rounded-xl hover:bg-white/5 transition-all hover:scale-[1.02]">Cancel</button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isDeleting && (
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => onStartEdit(s)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all text-white/50 hover:text-white hover:bg-white/10" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} title="Edit">
              <Edit2 className="w-3.5 h-3.5" /><span>Edit</span>
            </button>
            <button onClick={() => onToggleStatus(s)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${s.status === "active" ? "text-white/50 hover:text-white bg-white/5 border-white/10 hover:bg-white/10" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"}`} title={s.status === "active" ? "Pause" : "Resume"}>
              <Activity className="w-3.5 h-3.5" /><span>{s.status === "active" ? "Pause" : "Resume"}</span>
            </button>
            <button onClick={() => onConfirmDelete(s.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all text-red-500/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20" title="Delete">
              <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
