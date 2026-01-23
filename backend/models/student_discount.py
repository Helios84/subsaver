from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from datetime import datetime
from database import Base


class StudentDiscount(Base):
    """
    Model for storing student discount information for various subscription services.
    This allows us to automatically detect and suggest discounts to verified students.
    """
    __tablename__ = "student_discounts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Service information
    service_name = Column(String, nullable=False, unique=True, index=True)
    category = Column(String, default="Other")  # Match subscription categories
    
    # Pricing information (in cents)
    regular_price_cents = Column(Integer, nullable=False)
    student_price_cents = Column(Integer, nullable=False)
    discount_percentage = Column(Integer, nullable=False)  # Calculated: (regular - student) / regular * 100
    
    # Verification requirements
    requirements = Column(Text, nullable=False)  # JSON string: ["edu email", "SheerID verification"]
    verification_method = Column(String, nullable=False)  # "edu_email", "sheerid", "unidays", "manual"
    
    # Links and availability
    direct_link = Column(String, nullable=False)  # Direct URL to student plan signup
    availability = Column(String, default="US")  # Countries where available: "US", "US,UK,CA"
    
    # Metadata
    notes = Column(Text, nullable=True)  # Additional info, tips, special conditions
    last_updated = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)  # Can disable outdated discounts
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "service_name": self.service_name,
            "category": self.category,
            "regular_price_cents": self.regular_price_cents,
            "student_price_cents": self.student_price_cents,
            "discount_percentage": self.discount_percentage,
            "monthly_savings_cents": self.regular_price_cents - self.student_price_cents,
            "annual_savings_cents": (self.regular_price_cents - self.student_price_cents) * 12,
            "requirements": self.requirements,
            "verification_method": self.verification_method,
            "direct_link": self.direct_link,
            "availability": self.availability,
            "notes": self.notes,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }
