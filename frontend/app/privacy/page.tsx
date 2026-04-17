import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — SubSaver",
  description: "Learn how SubSaver collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  const lastUpdated = "April 17, 2025";

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

        {[
          {
            title: "1. Information We Collect",
            body: "We collect information you provide directly: email address, password (hashed), and subscription data you enter. We also collect usage data such as login timestamps and feature interactions to improve the Service. We do not collect payment information."
          },
          {
            title: "2. How We Use Your Information",
            body: "We use your information to provide, maintain, and improve the Service; to send renewal reminders and service notifications; to verify student status; and to respond to your requests. We do not sell your personal information to third parties."
          },
          {
            title: "3. Data Storage & Security",
            body: "Your data is stored on secure cloud servers (Neon PostgreSQL). Passwords are hashed using industry-standard bcrypt. We use HTTPS for all data transmission and implement appropriate technical safeguards to protect your information."
          },
          {
            title: "4. Student Email Verification",
            body: "When you verify your student status, we store your institutional (.edu) email address. This is used solely to verify your eligibility for student discounts. We do not share this information with subscription services."
          },
          {
            title: "5. Email Communications",
            body: "We send transactional emails including: account verification codes, renewal reminders (if enabled), and password reset codes. You can disable reminder emails in Settings > Reminders. We do not send marketing emails without explicit consent."
          },
          {
            title: "6. Data Retention",
            body: "We retain your account data for as long as your account is active. You can delete your account at any time from Settings > Danger Zone, which permanently removes all your data including subscriptions and verification status."
          },
          {
            title: "7. Cookies & Local Storage",
            body: "We use browser localStorage to store your authentication token and dashboard preferences. We do not use tracking cookies or third-party analytics. No cookies are set for non-authenticated visitors."
          },
          {
            title: "8. Third-Party Services",
            body: "We use Neon PostgreSQL for database hosting and Mailtrap/SMTP for email delivery. These services have their own privacy policies. We share only the minimum data necessary for these services to function."
          },
          {
            title: "9. GDPR / Your Rights",
            body: "If you are in the European Union, you have the right to access, correct, or delete your personal data. You can exercise most of these rights directly in our app. For additional requests, contact us at privacy@subsaver.example."
          },
          {
            title: "10. Changes to This Policy",
            body: "We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice in the app. Continued use of the Service after changes constitutes acceptance."
          },
          {
            title: "11. Contact",
            body: "For privacy-related questions or to exercise your data rights, contact us at privacy@subsaver.example."
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
            . For privacy concerns, contact us at{" "}
            <a href="mailto:privacy@subsaver.example" style={{ color: "#34D399" }}>privacy@subsaver.example</a>
          </p>
        </div>
      </article>
    </main>
  );
}
