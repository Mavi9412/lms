from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from database import get_session
from models import User, PasswordResetToken
from auth import get_password_hash
from datetime import datetime, timedelta
import secrets
import sys
import os

# Add parent directory to path to import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.email_service import send_password_reset_email

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

# Request models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    session: Session = Depends(get_session)
):
    """
    Send password reset email to user
    """
    # Find user by email
    user = session.exec(select(User).where(User.email == request.email)).first()
    
    if not user:
        # Don't reveal if email exists or not (security best practice)
        return {"message": "If an account with this email exists, a password reset link has been sent."}
    
    # Generate reset token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    # Invalidate any existing tokens for this user
    existing_tokens = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        )
    ).all()
    
    for old_token in existing_tokens:
        old_token.used = True
        session.add(old_token)
    
    # Create new reset token
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    session.add(reset_token)
    session.commit()
    
    # Send email
    try:
        send_password_reset_email(
            to_email=user.email,
            reset_token=token,
            user_name=user.full_name
        )
    except Exception as e:
        print(f"Failed to send reset email: {e}")
        # Don't fail the request if email fails
    
    return {"message": "If an account with this email exists, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    session: Session = Depends(get_session)
):
    """
    Reset password using token
    """
    # Find token
    reset_token = session.exec(
        select(PasswordResetToken).where(PasswordResetToken.token == request.token)
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Check if token already used
    if reset_token.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has already been used"
        )
    
    # Get user
    user = session.get(User, reset_token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    
    # Mark token as used
    reset_token.used = True
    
    session.add(user)
    session.add(reset_token)
    session.commit()
    
    return {"message": "Password reset successfully"}
