"use client";

import { useEffect, useRef } from "react";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import type { Sub } from "../types/index";

// ─── Types ────────────────────────────────────────────────────────────────────
type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";

export type EditState = {
  name: string;
  price: string;
  cycle: BillingCycle;
  status: Status;
  category: string;
  billingDate: string;
  splitWith: number;
  isSplit: boolean;
};

const CATEGORIES = [
  { value: "Entertainment",  icon: "🎬" },
  { value: "Productivity",   icon: "💼" },
  { value: "Gaming",         icon: "🎮" },
  { value: "Utilities",      icon: "🔧" },
  { value: "Communication",  icon: "📱" },
  { value: "Health & Fitness", icon: "🏋️" },
  { value: "Education",      icon: "📚" },
  { value: "Food & Delivery", icon: "🍔" },
  { value: "News & Media",   icon: "📰" },
  { value: "Finance",        icon: "💳" },
  { value: "Other",          icon: "🎨" },
];

type Props = {
  sub: Sub;
  editState: EditState;
  saving?: boolean;
  onEditChange: (patch: Partial<EditState>) => void;
  onSave: (id: number) => void;
  onClose: () => void;
};

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function EditSubscriptionModal({ sub, editState, saving = false, onEditChange, onSave, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(8,11,20,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{transform:translateY(16px) scale(0.98);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}`}</style>
      <div
        style={{
          background: "#0F1220",
          border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: 24,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(124,58,237,0.2), 0 8px 32px rgba(0,0,0,0.5)",
          animation: "slideUp 0.25s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, rgba(124,58,237,0.3),rgba(217,70,239,0.2))", border: "1px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Edit2 style={{ width: 16, height: 16, color: "#A78BFA" }} />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Edit Subscription</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 1 }}>{sub.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Form Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Service Name — full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Service Name">
              <input
                value={editState.name}
                onChange={(e) => onEditChange({ name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                placeholder="e.g. Netflix"
              />
            </Field>
          </div>

          {/* Price */}
          <Field label="Price / month">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>$</span>
              <input
                type="number" min="0" step="0.01"
                value={editState.price}
                onChange={(e) => onEditChange({ price: e.target.value })}
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
          </Field>

          {/* Billing Cycle */}
          <Field label="Billing Cycle">
            <select
              value={editState.cycle}
              onChange={(e) => onEditChange({ cycle: e.target.value as BillingCycle })}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            >
              <option value="monthly" style={{ background: "#0F1220" }}>Monthly</option>
              <option value="yearly" style={{ background: "#0F1220" }}>Yearly</option>
            </select>
          </Field>

          {/* Status */}
          <Field label="Status">
            <select
              value={editState.status}
              onChange={(e) => onEditChange({ status: e.target.value as Status })}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            >
              <option value="active" style={{ background: "#0F1220" }}>Active</option>
              <option value="cancelled" style={{ background: "#0F1220" }}>Cancelled</option>
            </select>
          </Field>

          {/* Category */}
          <Field label="Category">
            <select
              value={editState.category}
              onChange={(e) => onEditChange({ category: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} style={{ background: "#0F1220" }}>{c.icon} {c.value}</option>
              ))}
            </select>
          </Field>

          {/* Next Billing Date */}
          <Field label="Next Billing Date">
            <input
              type="date"
              value={editState.billingDate}
              onChange={(e) => onEditChange({ billingDate: e.target.value })}
              style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </Field>

          {/* Split Cost — full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <button
                type="button"
                onClick={() => onEditChange({ isSplit: !editState.isSplit })}
                style={{
                  position: "relative", width: 44, height: 24, borderRadius: 100, flexShrink: 0,
                  background: editState.isSplit ? "linear-gradient(135deg, #7C3AED, #D946EF)" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
                  boxShadow: editState.isSplit ? "0 0 16px rgba(124,58,237,0.4)" : "none",
                }}
              >
                <span style={{
                  position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%", background: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  left: editState.isSplit ? "calc(100% - 20px)" : "2px",
                  transition: "left 0.3s cubic-bezier(0.23,1,0.32,1)",
                }} />
              </button>
              <div>
                <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>Split Cost</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Divide the cost between multiple people</div>
              </div>
            </div>

            {editState.isSplit && (
              <div style={{ marginTop: 10 }}>
                <Field label="Split between (people)">
                  <input
                    type="number" min="2" max="20"
                    value={editState.splitWith}
                    onChange={(e) => onEditChange({ splitWith: Math.max(2, parseInt(e.target.value) || 2) })}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => onSave(sub.id)}
            disabled={saving}
            style={{
              flex: 1, padding: "13px 24px", borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: saving ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7C3AED, #D946EF)",
              boxShadow: saving ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
              color: "white", border: "none",
              transition: "all 0.2s",
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {saving
              ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Saving…</>
              : <><Save style={{ width: 16, height: 16 }} /> Save Changes</>
            }
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "13px 20px", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
