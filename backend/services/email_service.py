"""Email service for sending emails via SMTP (Mailtrap sandbox or production SMTP).

Graceful degradation: if SMTP is not configured, the service logs warnings
but the server starts normally. No crashes on missing credentials.
"""

import smtplib
import os
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from jinja2 import Template


class EmailService:
    """Service for sending emails via SMTP with graceful degradation."""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "2525"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@subsaver.example")
        self.from_name = os.getenv("SMTP_FROM_NAME", "SubSaver")

        # Graceful degradation: don't crash if SMTP is not configured
        self.enabled = bool(self.smtp_host and self.smtp_user and self.smtp_password)
        if not self.enabled:
            print("[WARNING] Email service: SMTP not configured. Emails will NOT be sent.")
            print("          Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env to enable.")

    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Internal method to send an email via SMTP.
        Returns False (without raising) if SMTP is not configured or fails.
        """
        if not self.enabled:
            print(f"[WARNING] Email not sent (SMTP disabled): to={to_email}, subject={subject}")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            html_part = MIMEText(html_content, "html")
            msg.attach(html_part)

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            print(f"[SUCCESS] Email sent to {to_email}: {subject}")
            return True

        except Exception as e:
            # Safely log the error without triggering UnicodeEncodeError on Windows console
            error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
            print(f"[ERROR] Failed to send email to {to_email}: {error_msg}")
            return False

    # ─── Public methods ───────────────────────────────────────────────────────

    def send_verification_code(self, to_email: str, code: str) -> bool:
        """
        Send a 6-digit student verification code to the given .edu email.
        """
        subject = "SubSaver - Your Verification Code"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#080B14;font-family:Inter,-apple-system,sans-serif;color:#fff;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#080B14;padding:40px 20px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
                <tr><td>
                  <!-- Logo -->
                  <p style="margin:0 0 32px;font-size:20px;font-weight:700;color:#fff;">
                    Sub<span style="color:#A855F7;">Saver</span>
                  </p>

                  <!-- Heading -->
                  <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#fff;">
                    Verify your student email
                  </h1>
                  <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
                    Enter the code below in the SubSaver app to confirm your student status.
                    This code expires in <strong style="color:#fff;">15 minutes</strong>.
                  </p>

                  <!-- Code box -->
                  <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);
                    border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                    <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;
                      color:#A855F7;font-family:monospace;">{code}</p>
                  </div>

                  <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.6;">
                    If you didn't request this, you can safely ignore this email.
                    Someone may have typed your email by mistake.
                  </p>
                </td></tr>
              </table>

              <!-- Footer -->
              <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.2);">
                © 2026 SubSaver. The #1 savings app for students.
              </p>
            </td></tr>
          </table>
        </body>
        </html>
        """
        return self._send_email(to_email, subject, html_content)


    def send_password_reset_code(self, to_email: str, code: str) -> bool:
        """
        Send a 6-digit password reset code to the given user email.
        """
        subject = "SubSaver - Password Reset Request"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#080B14;font-family:Inter,-apple-system,sans-serif;color:#fff;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#080B14;padding:40px 20px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
                <tr><td>
                  <!-- Logo -->
                  <p style="margin:0 0 32px;font-size:20px;font-weight:700;color:#fff;">
                    Sub<span style="color:#A855F7;">Saver</span>
                  </p>

                  <!-- Heading -->
                  <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#fff;">
                    Reset your password
                  </h1>
                  <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
                    Someone (hopefully you) requested a password reset for your SubSaver account.
                    Enter the code below to set a new password.
                    This code expires in <strong style="color:#fff;">15 minutes</strong>.
                  </p>

                  <!-- Code box -->
                  <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);
                    border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                     <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;
                       color:#A855F7;font-family:monospace;">{code}</p>
                  </div>

                  <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.6;">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will remain unchanged.
                  </p>
                </td></tr>
              </table>

              <!-- Footer -->
              <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.2);">
                © 2026 SubSaver. The #1 savings app for students.
              </p>
            </td></tr>
          </table>
        </body>
        </html>
        """
        return self._send_email(to_email, subject, html_content)

    def send_password_changed_notification(self, to_email: str) -> bool:
        """
        Send a notification that the password has been successfully changed.
        """
        subject = "SubSaver - Password Changed"
        html_content = """
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#080B14;font-family:Inter,-apple-system,sans-serif;color:#fff;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#080B14;padding:40px 20px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
                <tr><td>
                  <!-- Logo -->
                  <p style="margin:0 0 32px;font-size:20px;font-weight:700;color:#fff;">
                    Sub<span style="color:#A855F7;">Saver</span>
                  </p>

                  <!-- Heading -->
                  <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#fff;">
                    Password successfully changed
                  </h1>
                  <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
                    Hello,<br><br>
                    This is a confirmation that your password for your SubSaver account was successfully updated.
                    You can now use your new password to log in to your account.
                  </p>
                  
                  <!-- CTA -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="https://subsaver.example/login" style="display:inline-block;background:linear-gradient(135deg, #7C3AED, #D946EF);color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;">
                      Log In Now
                    </a>
                  </div>

                  <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.6;">
                    If you did not make this change, please contact support immediately or reset your password again.
                  </p>
                </td></tr>
              </table>

              <!-- Footer -->
              <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.2);">
                © 2026 SubSaver. The #1 savings app for students.
              </p>
            </td></tr>
          </table>
        </body>
        </html>
        """
        return self._send_email(to_email, subject, html_content)


    def send_reminder_email(
        self,
        to_email: str,
        subscription_name: str,
        price_cents: int,
        billing_cycle: str,
        next_billing_date: datetime,
        days_until_renewal: int,
    ) -> bool:
        """Send a subscription renewal reminder email."""
        price_dollars = price_cents / 100
        formatted_date = next_billing_date.strftime("%B %d, %Y")

        html_content = self._get_reminder_template(
            subscription_name=subscription_name,
            price=f"${price_dollars:.2f}",
            billing_cycle=billing_cycle,
            renewal_date=formatted_date,
            days_until=days_until_renewal,
        )
        subject = f"Reminder: {subscription_name} renews in {days_until_renewal} days"
        return self._send_email(to_email, subject, html_content)

    def _get_reminder_template(
        self,
        subscription_name: str,
        price: str,
        billing_cycle: str,
        renewal_date: str,
        days_until: int,
    ) -> str:
        """Generate HTML email template for reminder."""
        template_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "templates", "upcoming_renewal.html"
        )
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                template_str = f.read()
        except FileNotFoundError:
            print(f"[WARNING] Template not found at {template_path}, using fallback.")
            return (
                f"<p>Your subscription <strong>{subscription_name}</strong>"
                f" ({price}) renews on {renewal_date}.</p>"
            )

        template = Template(template_str)
        return template.render(
            subscription_name=subscription_name,
            price=price,
            billing_cycle=billing_cycle.capitalize(),
            renewal_date=renewal_date,
            days_until=days_until,
        )


# Singleton instance — never raises, always safe to import
email_service = EmailService()
