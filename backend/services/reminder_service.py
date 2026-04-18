"""Reminder service for checking and sending subscription renewal reminders."""

from datetime import datetime, timezone, timedelta
from typing import List, Tuple
from sqlalchemy.orm import Session

try:
    from dateutil.relativedelta import relativedelta
    HAS_RELATIVEDELTA = True
except ImportError:
    HAS_RELATIVEDELTA = False

from models.db import User, Subscription
from services.email_service import email_service


class ReminderService:
    """Service for managing subscription reminders."""
    
    def get_subscriptions_needing_reminders(self, db: Session) -> List[Tuple]:
        """
        Get all subscriptions that need reminders sent.
        
        Returns list of tuples: (subscription, user, days_until_renewal)
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        subscriptions_to_remind = []
        
        # Get all active subscriptions with next_billing_date set
        subscriptions = (
            db.query(Subscription, User)
            .join(User)
            .filter(
                Subscription.status == "active",
                Subscription.next_billing_date.isnot(None),
                Subscription.reminder_sent == False,
                User.reminder_enabled == True
            )
            .all()
        )
        
        for sub, user in subscriptions:
            # Calculate days until renewal
            days_until = (sub.next_billing_date - now).days
            
            # Check if we should send reminder based on user's preference
            if days_until <= user.reminder_days_before and days_until >= 0:
                subscriptions_to_remind.append((sub, user, days_until))
        
        return subscriptions_to_remind
    
    def send_reminders(self, db: Session) -> dict:
        """
        Check for subscriptions needing reminders and send emails.
        Also resets reminder_sent flag for subscriptions whose billing date has passed.
        
        Returns:
            dict with 'sent', 'failed', and 'total' counts
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # ── Auto-reset reminder_sent for subscriptions whose billing date has passed ──
        overdue_subs = (
            db.query(Subscription)
            .filter(
                Subscription.status == "active",
                Subscription.reminder_sent == True,
                Subscription.next_billing_date.isnot(None),
                Subscription.next_billing_date < now,
            )
            .all()
        )
        for sub in overdue_subs:
            sub.reminder_sent = False
            sub.last_reminder_date = None
            # H-4 fix: use next_billing_date as base, not created_at
            sub.next_billing_date = self.calculate_next_billing_date(
                sub.next_billing_date, sub.billing_cycle
            )
        if overdue_subs:
            db.flush()  # flush within transaction so next query sees updates

        subscriptions_to_remind = self.get_subscriptions_needing_reminders(db)
        
        sent_count = 0
        failed_count = 0
        
        for sub, user, days_until in subscriptions_to_remind:
            # Send reminder email
            success = email_service.send_reminder_email(
                to_email=user.email,
                subscription_name=sub.name,
                price_cents=sub.price_cents,
                billing_cycle=sub.billing_cycle,
                next_billing_date=sub.next_billing_date,
                days_until_renewal=days_until
            )
            
            if success:
                # Mark reminder as sent
                sub.reminder_sent = True
                sub.last_reminder_date = datetime.now(timezone.utc).replace(tzinfo=None)
                sent_count += 1
            else:
                failed_count += 1
        
        # Commit changes
        db.commit()
        
        return {
            "sent": sent_count,
            "failed": failed_count,
            "total": len(subscriptions_to_remind)
        }
    
    def calculate_next_billing_date(
        self,
        current_billing_date: datetime,
        billing_cycle: str
    ) -> datetime:
        """
        Calculate next billing date by advancing from current_billing_date.
        H-4/H-5 fix: use current next_billing_date as base (not created_at),
        and use relativedelta for accurate month arithmetic.
        
        Args:
            current_billing_date: The current next_billing_date
            billing_cycle: 'monthly' or 'yearly'
            
        Returns:
            Next billing date
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        next_date = current_billing_date
        
        if billing_cycle == "monthly":
            while next_date <= now:
                if HAS_RELATIVEDELTA:
                    next_date = next_date + relativedelta(months=1)
                else:
                    # Fallback if python-dateutil not installed
                    next_date = next_date + timedelta(days=30)
        else:  # yearly
            while next_date <= now:
                if HAS_RELATIVEDELTA:
                    next_date = next_date + relativedelta(years=1)
                else:
                    next_date = next_date + timedelta(days=365)
        
        return next_date
    
    def reset_reminder_for_next_cycle(self, subscription, db: Session):
        """
        Reset reminder flags when subscription renews.
        H-4 fix: use next_billing_date as base, not created_at.
        
        Args:
            subscription: Subscription object
            db: Database session
        """
        subscription.reminder_sent = False
        subscription.last_reminder_date = None
        # H-4 fix: use next_billing_date as base
        subscription.next_billing_date = self.calculate_next_billing_date(
            subscription.next_billing_date,
            subscription.billing_cycle
        )
        db.commit()


# Singleton instance
reminder_service = ReminderService()
