from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import User, Notification, NotificationCreate, NotificationType
from auth import get_current_user

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)


@router.get("/")
def get_my_notifications(
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get notifications for current user"""
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    notifications = session.exec(
        query.order_by(Notification.created_at.desc()).limit(limit)
    ).all()
    
    return notifications


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get unread notification count"""
    count = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    ).all()
    
    return {"count": len(count)}


@router.post("/{notification_id}/mark-read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark a notification as read"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = True
    session.add(notification)
    session.commit()
    
    return {"message": "Notification marked as read"}


@router.post("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark all notifications as read"""
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    ).all()
    
    for notification in notifications:
        notification.is_read = True
        session.add(notification)
    
    session.commit()
    
    return {"message": f"Marked {len(notifications)} notifications as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a notification"""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(notification)
    session.commit()
    
    return {"message": "Notification deleted"}


# Helper function to create notifications (used by other routers)
def create_notification(
    session: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    content: str,
    link: str = None
):
    """Helper function to create a notification"""
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        content=content,
        link=link
    )
    session.add(notification)
    session.commit()
    return notification
