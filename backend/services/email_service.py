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
        template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "upcoming_renewal.html")
        
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                template_str = f.read()
        except FileNotFoundError:
            # Fallback if file not found
            print(f"⚠️ Template not found at {template_path}, using fallback.")
            return f"Subscription {subscription_name} is renewing on {renewal_date}."

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
