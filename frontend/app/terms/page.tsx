import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — SubSaver",
  description: "Read SubSaver's Terms of Service to understand how you can use our platform.",
};

export default function TermsPage() {
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
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", fontSize: 12, color: "#A78BFA", fontWeight: 600, marginBottom: 16 }}>Legal</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, fontFamily: "var(--font-syne, sans-serif)", marginBottom: 12 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Last updated: {lastUpdated}</p>
        </div>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing or using SubSaver (the \"Service\"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service."
          },
          {
            title: "2. Description of Service",
            body: "SubSaver is a subscription tracking and management platform designed for students. We help you track your subscriptions, discover student discounts, and manage renewal reminders. The Service is provided free of charge for personal use."
          },
          {
            title: "3. User Accounts",
            body: "You must provide a valid email address to create an account. You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account."
          },
          {
            title: "4. Student Verification",
            body: "Student discount verification requires a valid institutional (.edu or similar) email address. We reserve the right to revoke verified status if we determine the verification was fraudulent. Misuse of student pricing is a violation of these terms."
          },
          {
            title: "5. Acceptable Use",
            body: "You agree not to use the Service for any unlawful purpose, to harass other users, to submit false or misleading information, to attempt to gain unauthorized access to our systems, or to reverse engineer any portion of the Service."
          },
          {
            title: "6. Privacy",
            body: "Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices."
          },
          {
            title: "7. Intellectual Property",
            body: "The Service and its original content, features, and functionality are owned by SubSaver and are protected by international copyright, trademark, and other intellectual property laws."
          },
          {
            title: "8. Disclaimer of Warranties",
            body: "The Service is provided on an \"as is\" and \"as available\" basis without any warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or completely secure."
          },
          {
            title: "9. Limitation of Liability",
            body: "In no event shall SubSaver be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service, even if we have been advised of the possibility of such damages."
          },
          {
            title: "10. Changes to Terms",
            body: "We reserve the right to modify these terms at any time. We will notify users of significant changes via email or a prominent notice on our website. Your continued use of the Service after changes constitutes acceptance of the new Terms."
          },
          {
            title: "11. Contact Us",
            body: "If you have any questions about these Terms, please contact us at legal@subsaver.example."
          },
        ].map((section) => (
          <section key={section.title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "white", fontFamily: "var(--font-syne, sans-serif)" }}>{section.title}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>{section.body}</p>
          </section>
        ))}

        <div style={{ marginTop: 48, padding: "24px 28px", borderRadius: 16, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
            Also see our{" "}
            <Link href="/privacy" style={{ color: "#A78BFA", fontWeight: 600 }}>Privacy Policy</Link>
            . For any questions, contact us at{" "}
            <a href="mailto:legal@subsaver.example" style={{ color: "#A78BFA" }}>legal@subsaver.example</a>
          </p>
        </div>
      </article>
    </main>
  );
}
