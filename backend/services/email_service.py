"""Email service for sending reminder emails via Gmail SMTP."""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from jinja2 import Template
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class EmailService:
    """Service for sending emails via SMTP."""
    
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("SMTP_FROM_NAME", "SubSaver")
        
        if not self.smtp_user or not self.smtp_password:
            raise ValueError("SMTP_USER and SMTP_PASSWORD must be set in environment variables")
    
    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Send an email via SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            
            # Attach HTML content
            html_part = MIMEText(html_content, "html")
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_reminder_email(
        self,
        to_email: str,
        subscription_name: str,
        price_cents: int,
        billing_cycle: str,
        next_billing_date: datetime,
        days_until_renewal: int
    ) -> bool:
        """
        Send a subscription renewal reminder email.
        
        Args:
            to_email: User's email address
            subscription_name: Name of the subscription
            price_cents: Price in cents
            billing_cycle: 'monthly' or 'yearly'
            next_billing_date: When the subscription renews
            days_until_renewal: Number of days until renewal
            
        Returns:
            True if email sent successfully, False otherwise
        """
        # Convert price to dollars
        price_dollars = price_cents / 100
        
        # Format date
        formatted_date = next_billing_date.strftime("%B %d, %Y")
        
        # Create HTML email from template
        html_content = self._get_reminder_template(
            subscription_name=subscription_name,
            price=f"${price_dollars:.2f}",
            billing_cycle=billing_cycle,
            renewal_date=formatted_date,
            days_until=days_until_renewal
        )
        
        subject = f"⏰ Reminder: {subscription_name} renews in {days_until_renewal} days"
        
        return self.send_email(to_email, subject, html_content)
    
    def _get_reminder_template(
        self,
        subscription_name: str,
        price: str,
        billing_cycle: str,
        renewal_date: str,
        days_until: int
    ) -> str:
        """Generate HTML email template for reminder."""
        
        template_str = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .alert-box {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 24px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .alert-box h2 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .alert-box p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
        }
        .details {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
        }
        .detail-value {
            color: #111827;
            font-weight: 500;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">💰 SubSaver</div>
            <p style="color: #6b7280; margin: 0;">Your Subscription Manager</p>
        </div>
        
        <div class="alert-box">
            <h2>⏰ Renewal Reminder</h2>
            <p>Your subscription is renewing soon!</p>
        </div>
        
        <p>Hi there,</p>
        <p>This is a friendly reminder that your <strong>{{ subscription_name }}</strong> subscription will renew in <strong>{{ days_until }} days</strong>.</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription</span>
                <span class="detail-value">{{ subscription_name }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="detail-value">{{ price }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Billing Cycle</span>
                <span class="detail-value">{{ billing_cycle }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Renewal Date</span>
                <span class="detail-value">{{ renewal_date }}</span>
            </div>
        </div>
        
        <p>If you want to cancel this subscription before it renews, make sure to do so before <strong>{{ renewal_date }}</strong>.</p>
        
        <div style="text-align: center;">
            <a href="http://localhost:3000/dashboard" class="cta-button">View Dashboard</a>
        </div>
        
        <div class="footer">
            <p>You're receiving this email because you enabled renewal reminders in SubSaver.</p>
            <p>To change your notification preferences, visit your <a href="http://localhost:3000/settings" style="color: #dc2626;">Settings</a>.</p>
        </div>
    </div>
</body>
</html>
        """
        
        template = Template(template_str)
        return template.render(
            subscription_name=subscription_name,
            price=price,
            billing_cycle=billing_cycle.capitalize(),
            renewal_date=renewal_date,
            days_until=days_until
        )


# Singleton instance
email_service = EmailService()
