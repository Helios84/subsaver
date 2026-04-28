"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080B14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      {/* Aurora blobs */}
      <div className="aurora-container">
        <div
          className="aurora-blob animate-aurora-1"
          style={{
            width: "650px", height: "650px",
            background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)",
            top: "-10%", right: "-5%",
          }}
        />
        <div
          className="aurora-blob animate-aurora-2"
          style={{
            width: "550px", height: "550px",
            background: "radial-gradient(circle, rgba(217,70,239,0.1) 0%, transparent 70%)",
            bottom: "-10%", left: "-5%",
          }}
        />
        <div
          className="aurora-blob animate-aurora-3"
          style={{
            width: "350px", height: "350px",
            background: "radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)",
            top: "30%", left: "20%",
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative", zIndex: 10, textAlign: "center", maxWidth: 520,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.6s ease",
        }}
      >
        {/* Giant 404 */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <div
            style={{
              fontSize: "clamp(120px, 20vw, 180px)",
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "var(--font-syne, sans-serif)",
              background: "linear-gradient(135deg, #7C3AED 0%, #D946EF 50%, #F87171 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 60px rgba(124,58,237,0.35))",
              userSelect: "none",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            404
          </div>

          {/* Glow beneath */}
          <div
            style={{
              position: "absolute",
              bottom: -20, left: "50%", transform: "translateX(-50%)",
              width: 200, height: 30, borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />
        </div>

        {/* Label */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 100, marginBottom: 28,
            background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
            color: "#A78BFA", fontSize: 12, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}
        >
          Page Not Found
        </div>

        {/* Heading */}
        <h1
          style={{
            color: "white", fontSize: "clamp(22px, 4vw, 30px)",
            fontWeight: 800, lineHeight: 1.25,
            fontFamily: "var(--font-syne, sans-serif)",
            marginBottom: 14,
          }}
        >
          Oops! This page doesn&apos;t exist
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.65,
            maxWidth: 380, margin: "0 auto 40px",
          }}
        >
          The page you&apos;re looking for may have been moved, deleted, or
          never existed. Let&apos;s get you back on track.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/dashboard"
            className="hero-btn-primary"
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "13px 24px", borderRadius: 14,
              color: "white", fontWeight: 700, fontSize: 14,
              textDecoration: "none",
            }}
          >
            <LayoutDashboard size={17} />
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="hero-btn-ghost"
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "13px 24px", borderRadius: 14,
              color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14,
              textDecoration: "none",
            }}
          >
            <Home size={17} />
            Go Home
          </Link>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 28, background: "none", border: "none",
            color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
        >
          <ArrowLeft size={13} /> Go back to previous page
        </button>
      </div>

      {/* Float animation — uses global liquid-float, redefined here for isolation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </main>
  );
}
