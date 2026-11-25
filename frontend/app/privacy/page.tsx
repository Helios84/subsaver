import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data SubSaver stores and how it is used.",
};

// Optional contact address; the contact line is hidden when it is not set.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function PrivacyPage() {
  const lastUpdated = "November 12, 2026";

  return (
    <main style={{ minHeight: "100vh", background: "#080B14", color: "white", fontFamily: "var(--font-inter, sans-serif)" }}>
      {/* Nav */}
      <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 800, color: "white", textDecoration: "none", fontFamily: "var(--font-syne, sans-serif)" }}>
          Sub<span style={{ background: "linear-gradient(135deg,#A78BFA,#E879F9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saver</span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Back to Dashboard</Link>
      </nav>

      {/* Content */}
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "60px 40px 100px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 12, color: "#34D399", fontWeight: 600, marginBottom: 16 }}>Legal</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, fontFamily: "var(--font-syne, sans-serif)", marginBottom: 12 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Last updated: {lastUpdated}</p>
        </div>

        <div style={{ marginBottom: 40, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            SubSaver is a student portfolio project, not a commercial service.
          </p>
        </div>

        {[
          {
            title: "1. What We Store",
            body: "Your email address, your password (stored only as a bcrypt hash), the subscription data you enter, your dashboard preferences and, if you verify student status, your .edu email address. We do not collect payment information, and the app never connects to your bank, card or subscription providers."
          },
          {
            title: "2. How It Is Used",
            body: "To show your dashboard, to send account emails (confirmation codes, password reset codes and, if enabled, renewal reminders) and to record your student verification. Your data is not sold or shared for marketing."
          },
          {
            title: "3. Where It Is Stored",
            body: "Data is kept in a PostgreSQL database hosted by Neon. The API runs on Railway and the website on Vercel. All traffic uses HTTPS."
          },
          {
            title: "4. Emails",
            body: "We only send account emails. You can turn renewal reminders off in Settings > Notifications."
          },
          {
            title: "5. Local Storage",
            body: "Your browser's localStorage holds your sign-in token, dashboard preferences and cached exchange rates. We do not use cookies or analytics."
          },
          {
            title: "6. Third-Party Services",
            body: "Hosting is provided by Vercel, Railway and Neon, and emails are sent through an SMTP provider. Exchange rates are fetched from open.er-api.com; no personal data is sent with that request."
          },
          {
            title: "7. Deleting Your Data",
            body: "You can delete your account at any time in Settings > Danger Zone. This permanently removes your account and all of your subscriptions."
          },
        ].map((section) => (
          <section key={section.title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "white", fontFamily: "var(--font-syne, sans-serif)" }}>{section.title}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>{section.body}</p>
          </section>
        ))}

        <div style={{ marginTop: 48, padding: "24px 28px", borderRadius: 16, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
            Also see our{" "}
            <Link href="/terms" style={{ color: "#34D399", fontWeight: 600 }}>Terms of Service</Link>
            .
            {CONTACT_EMAIL && (
              <>
                {" "}Questions? Contact{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#34D399" }}>{CONTACT_EMAIL}</a>.
              </>
            )}
          </p>
        </div>
      </article>
    </main>
  );
}
