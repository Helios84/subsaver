"""Background scheduler for running reminder checks."""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ReminderScheduler:
    """Scheduler for automated reminder checks."""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.db_session_maker = None
    
    def set_db_session_maker(self, session_maker):
        """Set the database session maker."""
        self.db_session_maker = session_maker
    
    def check_and_send_reminders(self):
        """Job function to check and send reminders."""
        if not self.db_session_maker:
            logger.error("Database session maker not set!")
            return

        from services.reminder_service import reminder_service

        logger.info(f"🔔 Running reminder check at {datetime.now()}")

        # Create database session
        db = self.db_session_maker()
        try:
            result = reminder_service.send_reminders(db)
            logger.info(
                f"✅ Reminder check complete: {result['sent']} sent, "
                f"{result['failed']} failed, {result['total']} total"
            )
        except Exception as e:
            logger.error(f"❌ Error during reminder check: {str(e)}")
        finally:
            db.close()

    def cleanup_expired_tokens(self):
        """Remove expired entries from the JWT blacklist table (C-1)."""
        if not self.db_session_maker:
            return
        from models.db import RevokedToken
        db = self.db_session_maker()
        try:
            now = datetime.now()
            deleted = db.query(RevokedToken).filter(RevokedToken.expires_at < now).delete()
            db.commit()
            if deleted:
                logger.info(f"🗑️  Cleaned up {deleted} expired revoked tokens")
        except Exception as e:
            logger.error(f"❌ Error during token cleanup: {str(e)}")
        finally:
            db.close()
    
    def start(self):
        """Start the scheduler."""
        # Run every day at 9:00 AM UTC (S-8 fix: timezone explicitly set)
        self.scheduler.add_job(
            self.check_and_send_reminders,
            CronTrigger(hour=9, minute=0, timezone="UTC"),
            id="daily_reminder_check",
            name="Check and send subscription reminders",
            replace_existing=True
        )

        # Cleanup expired JWT blacklist entries daily at 3:00 AM UTC (C-1)
        self.scheduler.add_job(
            self.cleanup_expired_tokens,
            CronTrigger(hour=3, minute=0, timezone="UTC"),
            id="daily_token_cleanup",
            name="Clean up expired revoked tokens",
            replace_existing=True
        )

        self.scheduler.start()
        logger.info("📅 Reminder scheduler started (daily at 9:00 AM) + token cleanup (daily at 3:00 AM)")
    
    def stop(self):
        """Stop the scheduler."""
        self.scheduler.shutdown()
        logger.info("📅 Reminder scheduler stopped")
    
    def run_now(self):
        """Manually trigger reminder check (for testing)."""
        logger.info("🔔 Manually triggering reminder check...")
        self.check_and_send_reminders()


# Singleton instance
reminder_scheduler = ReminderScheduler()
