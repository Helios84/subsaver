"use client";

import { Plus, Search, Activity } from "lucide-react";
import { CATEGORIES } from "../../lib/categories";
import type { StudentDiscount } from "../../types";

type BillingCycle = "monthly" | "yearly";

type Props = {
  msg: string;
  onSubmit: (e: React.FormEvent) => void;
  onOpenPicker: () => void;
  suggestions: StudentDiscount[];
  showSuggestions: boolean;
  onNameChange: (val: string) => void;
  onSuggestionSelect: (service: StudentDiscount) => void;
  currency?: string;
  currencySymbol?: string;
  isSubmitting?: boolean;
  autocompleteContainerRef?: React.RefObject<HTMLDivElement | null>;
  formState: {
    name: string;
    price: string;
    cycle: BillingCycle;
    category: string;
    billingDate: string;
    isSplit: boolean;
    splitWith: number;
  };
  onFormChange: (patch: Partial<Props["formState"]>) => void;
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 12,
  color: "white",
  fontSize: 14,
  padding: "10px 14px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s, background 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: "rgba(255,255,255,0.55)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 7,
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

export default function AddSubscriptionPanel({
  msg, onSubmit, onOpenPicker, suggestions, showSuggestions,
  onNameChange, onSuggestionSelect, formState, onFormChange,
  currencySymbol, isSubmitting, autocompleteContainerRef,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Main form card ── */}
      <section
        id="add-new-form"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "20px",
          position: "sticky",
          top: 96,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Plus style={{ width: 15, height: 15, color: "#E879F9" }} />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-syne, sans-serif)" }}>Add New</span>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Service Name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Service Name</label>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  aria-label="Service name"
                  value={formState.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => onFormChange({ name: formState.name }), 200)}
                  style={{ ...inputStyle, flex: 1, minWidth: 0, paddingRight: "40px" }}
                  placeholder="e.g. Spotify"
                  required
                  autoComplete="off"
                />
                <button
                  aria-label="Browse services"
                  type="button"
                  onClick={onOpenPicker}
                  title="Browse Services"
                  style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  <Search style={{ width: 15, height: 15, color: "#A78BFA" }} />
                </button>
              </div>

              {showSuggestions && (
                <div ref={autocompleteContainerRef} style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 48,
                  background: "#161B27", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 50,
                  maxHeight: 200, overflowY: "auto",
                }}>
                  {suggestions.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => onSuggestionSelect(service)}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 14px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: "1px solid rgba(255,255,255,0.05)", background: "none", cursor: "pointer",
                        color: "white",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{service.service_name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{service.category}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399" }}>${(service.student_price_cents / 100).toFixed(2)}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textDecoration: "line-through" }}>${(service.regular_price_cents / 100).toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cost */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Cost</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: 500, pointerEvents: "none", zIndex: 1 }}>{currencySymbol ?? "$"}</span>
              <input
                aria-label="Cost"
                value={formState.price}
                onChange={(e) => onFormChange({ price: e.target.value })}
                type="number" min="0" step="0.01"
                placeholder="0.00"
                required
                style={{ ...inputStyle, paddingLeft: "28px" }}
              />
            </div>
          </div>

          {/* Billing Cycle */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Billing Cycle</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 4 }}>
              {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onFormChange({ cycle: c })}
                  onMouseEnter={(e) => {
                    if (formState.cycle !== c) {
                      e.currentTarget.style.background = "rgba(124,58,237,0.15)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formState.cycle !== c) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                    }
                  }}
                  style={{
                    padding: "8px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    textTransform: "capitalize", transition: "all 0.2s", border: "none",
                    background: formState.cycle === c ? "linear-gradient(135deg, #7C3AED, #D946EF)" : "transparent",
                    color: formState.cycle === c ? "white" : "rgba(255,255,255,0.35)",
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Category</label>
            <select
              aria-label="Category"
              value={formState.category}
              onChange={(e) => onFormChange({ category: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} style={{ backgroundColor: "#161B27", color: "white" }}>{cat.icon} {cat.value}</option>
              ))}
            </select>
          </div>

          {/* Billing Date */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Next Billing Date</label>
            <input
              aria-label="Next billing date"
              value={formState.billingDate}
              onChange={(e) => onFormChange({ billingDate: e.target.value })}
              type="date"
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 5 }}>Optional — enables email reminders</span>
          </div>

          {/* Split Cost */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Split Cost</label>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, cursor: "pointer", userSelect: "none",
              }}
              onClick={() => onFormChange({ isSplit: !formState.isSplit })}
            >
              {/* Toggle pill */}
              <div style={{
                position: "relative", width: 36, height: 20, borderRadius: 100, flexShrink: 0,
                background: formState.isSplit ? "linear-gradient(135deg,#7C3AED,#D946EF)" : "rgba(255,255,255,0.1)",
                border: formState.isSplit ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.15)",
                transition: "all 0.2s cubic-bezier(0.23,1,0.32,1)",
              }}>
                <span style={{
                  position: "absolute", top: 2, borderRadius: "50%", width: 14, height: 14, background: "white",
                  left: formState.isSplit ? 18 : 2, transition: "left 0.2s cubic-bezier(0.23,1,0.32,1)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                }} />
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>I share this subscription</span>
            </div>
            {formState.isSplit && (
              <div style={{ marginTop: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 6 }}>Number of People (including you)</label>
                <input
                  aria-label="Number of people sharing"
                  value={formState.splitWith}
                  onChange={(e) => onFormChange({ splitWith: parseInt(e.target.value) || 1 })}
                  type="number" min="1"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="liquid-btn"
            style={{
              width: "100%", padding: "13px", borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              background: isSubmitting ? "rgba(124,58,237,0.4)" : undefined,
              boxShadow: isSubmitting ? "none" : undefined,
              color: "white", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <Plus style={{ width: 18, height: 18 }} />
            {isSubmitting ? "Adding…" : "Add Subscription"}
          </button>

          {msg && (
            <p style={{ fontSize: 12, color: "#A78BFA", textAlign: "center", padding: "8px 12px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, margin: 0 }}>
              {msg}
            </p>
          )}
        </form>
      </section>

      {/* ── Pro Tip ── */}
      <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: "16px 18px" }} className="hidden lg:block">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity style={{ width: 13, height: 13, color: "#34D399" }} />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Pro Tip</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>
          Mark a subscription as cancelled to keep it in your history without counting it in your totals.
        </p>
      </div>

    </div>
  );
}
