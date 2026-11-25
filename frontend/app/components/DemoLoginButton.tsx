"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { apiFetch } from "../lib/api";

// The button is shown only when the deployment has a demo account
// (backend DEMO_ENABLED=true and this flag set at build time).
const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_ENABLED === "true";

export default function DemoLoginButton({ className, style }: { className?: string; style?: CSSProperties }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!DEMO_ENABLED) return null;

  async function openDemo() {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/demo-login", { method: "POST", skipAuth: true });
      localStorage.setItem("subsaver_token", data.access_token);
      // The demo already has data, so skip the first-run walkthrough.
      localStorage.setItem("subsaver_onboarding_done", "1");
      router.push("/dashboard");
    } catch {
      setError("The demo is unavailable right now. Please try again later.");
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openDemo} disabled={loading} className={className} style={{ cursor: loading ? "wait" : "pointer", ...style }}>
        <Play style={{ width: 15, height: 15, flexShrink: 0 }} />
        {loading ? "Opening demo…" : "Try the demo"}
      </button>
      {error && (
        <p role="alert" style={{ marginTop: 8, fontSize: 13, color: "#FCA5A5", textAlign: "center" }}>
          {error}
        </p>
      )}
    </>
  );
}
