from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import User, Role, Announcement, AnnouncementCreate
from auth import get_current_user

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"],
)


@router.post("/", response_model=Announcement)
def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new announcement (Teacher/Admin only)"""
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    announcement = Announcement(
        **announcement_data.model_dump(),
        created_by=current_user.id
    )
    
    session.add(announcement)
    session.commit()
    session.refresh(announcement)
    
    # TODO: Create notifications for students enrolled in the course
    
    return announcement


@router.get("/course/{course_id}")
def get_course_announcements(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all announcements for a course"""
    announcements = session.exec(
        select(Announcement)
        .where(Announcement.course_id == course_id)
        .order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
    ).all()
    
    # Include creator info
    result = []
    for ann in announcements:
        ann_dict = ann.model_dump()
        creator = session.get(User, ann.created_by)
        ann_dict['creator_name'] = creator.full_name if creator else "Unknown"
        result.append(ann_dict)
    
    return result


@router.get("/{announcement_id}")
def get_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a single announcement"""
    announcement = session.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    result = announcement.model_dump()
    creator = session.get(User, announcement.created_by)
    result['creator_name'] = creator.full_name if creator else "Unknown"
    
    return result


@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update an announcement (Creator/Admin only)"""
    announcement = session.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Check authorization
    if current_user.role != Role.admin and announcement.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in announcement_data.model_dump().items():
        setattr(announcement, key, value)
    
    session.add(announcement)
    session.commit()
    session.refresh(announcement)
    
    return announcement


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete an announcement (Creator/Admin only)"""
    announcement = session.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Check authorization
    if current_user.role != Role.admin and announcement.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(announcement)
    session.commit()
    
    return {"message": "Announcement deleted successfully"}
