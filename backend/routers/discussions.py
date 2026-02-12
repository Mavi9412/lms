from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import (
    User, Role, DiscussionThread, ThreadReply,
    DiscussionThreadCreate, ThreadReplyCreate
)
from auth import get_current_user

router = APIRouter(
    prefix="/discussions",
    tags=["discussions"],
)


# --- Threads ---

@router.post("/", response_model=DiscussionThread)
def create_thread(
    thread_data: DiscussionThreadCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new discussion thread"""
    thread = DiscussionThread(
        **thread_data.model_dump(),
        created_by=current_user.id
    )
    
    session.add(thread)
    session.commit()
    session.refresh(thread)
    
    return thread


@router.get("/course/{course_id}")
def get_course_threads(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all discussion threads for a course"""
    threads = session.exec(
        select(DiscussionThread)
        .where(DiscussionThread.course_id == course_id)
        .order_by(DiscussionThread.is_pinned.desc(), DiscussionThread.created_at.desc())
    ).all()
    
    result = []
    for thread in threads:
        thread_dict = thread.model_dump()
        creator = session.get(User, thread.created_by)
        thread_dict['creator_name'] = creator.full_name if creator else "Unknown"
        
        # Count replies
        replies_count = len(session.exec(
            select(ThreadReply).where(ThreadReply.thread_id == thread.id)
        ).all())
        thread_dict['replies_count'] = replies_count
        
        result.append(thread_dict)
    
    return result


@router.get("/{thread_id}")
def get_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a thread with all its replies"""
    thread = session.get(DiscussionThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Get thread details
    thread_dict = thread.model_dump()
    creator = session.get(User, thread.created_by)
    thread_dict['creator_name'] = creator.full_name if creator else "Unknown"
    
    # Get replies
    replies = session.exec(
        select(ThreadReply)
        .where(ThreadReply.thread_id == thread_id)
        .order_by(ThreadReply.created_at.asc())
    ).all()
    
    replies_data = []
    for reply in replies:
        reply_dict = reply.model_dump()
        reply_creator = session.get(User, reply.created_by)
        reply_dict['creator_name'] = reply_creator.full_name if reply_creator else "Unknown"
        replies_data.append(reply_dict)
    
    thread_dict['replies'] = replies_data
    
    return thread_dict


@router.delete("/{thread_id}")
def delete_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a thread (Creator/Admin only)"""
    thread = session.get(DiscussionThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if current_user.role != Role.admin and thread.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(thread)
    session.commit()
    
    return {"message": "Thread deleted successfully"}


# --- Replies ---

@router.post("/{thread_id}/replies", response_model=ThreadReply)
def create_reply(
    thread_id: int,
    content: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Add a reply to a thread"""
    thread = session.get(DiscussionThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    reply = ThreadReply(
        thread_id=thread_id,
        content=content,
        created_by=current_user.id
    )
    
    session.add(reply)
    session.commit()
    session.refresh(reply)
    
    # TODO: Create notification for thread creator
    
    return reply


@router.post("/replies/{reply_id}/upvote")
def upvote_reply(
    reply_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upvote a reply"""
    reply = session.get(ThreadReply, reply_id)
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    reply.upvotes += 1
    session.add(reply)
    session.commit()
    
    return {"upvotes": reply.upvotes}


@router.delete("/replies/{reply_id}")
def delete_reply(
    reply_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a reply (Creator/Admin only)"""
    reply = session.get(ThreadReply, reply_id)
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    if current_user.role != Role.admin and reply.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(reply)
    session.commit()
    
    return {"message": "Reply deleted successfully"}
