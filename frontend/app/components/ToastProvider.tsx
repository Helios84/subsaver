"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 4000
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Single Toast Item ────────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  error:   <XCircle     className="w-4 h-4 shrink-0" />,
  info:    <Info        className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
};

const STYLES: Record<ToastType, { bg: string; border: string; color: string; shadow: string }> = {
  success: {
    bg:     "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
    color:  "#34D399",
    shadow: "rgba(16,185,129,0.15)",
  },
  error: {
    bg:     "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    color:  "#F87171",
    shadow: "rgba(239,68,68,0.15)",
  },
  info: {
    bg:     "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.3)",
    color:  "#60A5FA",
    shadow: "rgba(59,130,246,0.15)",
  },
  warning: {
    bg:     "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    color:  "#FBBF24",
    shadow: "rgba(245,158,11,0.15)",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const s = STYLES[toast.type];

  // Auto-dismiss with animation
  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Start exit animation before actual removal
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 350);
    }, toast.duration ?? 4000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [toast.duration, onDismiss]);

  function handleClose() {
    setExiting(true);
    setTimeout(onDismiss, 350);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${s.border}`,
        background: `${s.bg}`,
        backdropFilter: "blur(12px)",
        boxShadow: `0 8px 32px ${s.shadow}, 0 2px 8px rgba(0,0,0,0.3)`,
        color: s.color,
        fontSize: 14,
        fontWeight: 500,
        minWidth: 280,
        maxWidth: 400,
        transform: visible && !exiting ? "translateX(0) scale(1)" : "translateX(120%) scale(0.95)",
        opacity: visible && !exiting ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1), opacity 0.35s ease",
        cursor: "default",
      }}
    >
      {ICONS[toast.type]}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={handleClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: s.color,
          opacity: 0.6,
          padding: 2,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]); // max 5 at a time
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}

      {/* Toast Stack — bottom right */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "all" }}>
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
