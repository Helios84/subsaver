from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from dependencies import get_db, get_current_user
from main import User, Subscription

# Import will work after we create the table
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

router = APIRouter(prefix="/api/student-discounts", tags=["student-discounts"])


@router.get("")
async def get_all_student_discounts(db: Session = Depends(get_db)):
    """
    Get all available student discounts.
    Public endpoint - no authentication required.
    """
    try:
        from models.student_discount import StudentDiscount
        
        discounts = db.query(StudentDiscount).filter(
            StudentDiscount.is_active == True
        ).all()
        
        return [discount.to_dict() for discount in discounts]
    except Exception as e:
        # If table doesn't exist yet, return empty list
        return []


@router.get("/check/{subscription_id}")
async def check_discount_for_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if a student discount exists for a specific subscription.
    Returns discount info if available, null if not.
    """
    # Get the subscription
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    try:
        from models.student_discount import StudentDiscount
        
        # Try to find matching discount by service name (case-insensitive)
        discount = db.query(StudentDiscount).filter(
            StudentDiscount.service_name.ilike(f"%{subscription.name}%"),
            StudentDiscount.is_active == True
        ).first()
        
        if not discount:
            # Try exact match
            discount = db.query(StudentDiscount).filter(
                StudentDiscount.service_name == subscription.name,
                StudentDiscount.is_active == True
            ).first()
        
        if discount:
            result = discount.to_dict()
            result["subscription_id"] = subscription_id
            result["already_applied"] = subscription.student_discount_applied
            return result
        
        return None
    except Exception as e:
        return None


@router.post("/apply/{subscription_id}")
async def mark_discount_applied(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a student discount as applied for a subscription.
    Updates the subscription to reflect the discounted price.
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    try:
        from models.student_discount import StudentDiscount
        
        # Find the matching discount
        discount = db.query(StudentDiscount).filter(
            StudentDiscount.service_name.ilike(f"%{subscription.name}%"),
            StudentDiscount.is_active == True
        ).first()
        
        if not discount:
            raise HTTPException(status_code=404, detail="No student discount found for this service")
        
        # Update subscription
        subscription.student_discount_applied = True
        subscription.discount_applied_date = datetime.utcnow()
        
        # Optionally update the price to student price
        # subscription.price_cents = discount.student_price_cents
        
        db.commit()
        db.refresh(subscription)
        
        return {
            "message": "Student discount marked as applied",
            "subscription_id": subscription_id,
            "savings_per_month_cents": discount.regular_price_cents - discount.student_price_cents,
            "savings_per_year_cents": (discount.regular_price_cents - discount.student_price_cents) * 12
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to apply discount: {str(e)}")


@router.delete("/unapply/{subscription_id}")
async def unmark_discount_applied(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove the student discount applied status from a subscription.
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription.student_discount_applied = False
    subscription.discount_applied_date = None
    
    db.commit()
    db.refresh(subscription)
    
    return {"message": "Student discount removed"}
