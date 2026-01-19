"""Reminder service for checking and sending subscription renewal reminders."""

from datetime import datetime, timedelta
from typing import List, Tuple
from sqlalchemy.orm import Session

# Import models from main.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.email_service import email_service


class ReminderService:
    """Service for managing subscription reminders."""
    
    def get_subscriptions_needing_reminders(self, db: Session) -> List[Tuple]:
        """
        Get all subscriptions that need reminders sent.
        
        Returns list of tuples: (subscription, user, days_until_renewal)
        """
        from main import Subscription, User
        
        now = datetime.utcnow()
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
        
        Returns:
            dict with 'sent', 'failed', and 'total' counts
        """
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
                sub.last_reminder_date = datetime.utcnow()
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
        created_at: datetime,
        billing_cycle: str
    ) -> datetime:
        """
        Calculate next billing date based on creation date and cycle.
        
        Args:
            created_at: When subscription was created
            billing_cycle: 'monthly' or 'yearly'
            
        Returns:
            Next billing date
        """
        now = datetime.utcnow()
        
        if billing_cycle == "monthly":
            # Add months until we're in the future
            next_date = created_at
            while next_date <= now:
                # Add 30 days (approximate month)
                next_date = next_date + timedelta(days=30)
        else:  # yearly
            # Add years until we're in the future
            next_date = created_at
            while next_date <= now:
                next_date = next_date + timedelta(days=365)
        
        return next_date
    
    def reset_reminder_for_next_cycle(self, subscription, db: Session):
        """
        Reset reminder flags when subscription renews.
        
        Args:
            subscription: Subscription object
            db: Database session
        """
        subscription.reminder_sent = False
        subscription.last_reminder_date = None
        subscription.next_billing_date = self.calculate_next_billing_date(
            subscription.created_at,
            subscription.billing_cycle
        )
        db.commit()


# Singleton instance
reminder_service = ReminderService()
