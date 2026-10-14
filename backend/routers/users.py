from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import User, Role, Enrollment, Section, Course
from auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

class UserEnrollmentResponse(BaseModel):
    id: int
    course_id: int
    course_title: str
    course_code: str
    course_description: Optional[str] = ""
    section_name: str
    section_id: int
    teacher_name: str
    teacher_email: str

@router.get("/{user_id}/enrollments", response_model=List[UserEnrollmentResponse])
def get_user_enrollments(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all enrolled courses/sections for a user (or teaching sections if teacher)"""
    target_user = session.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    result = []
    
    # 1. Check student enrollments
    enrollments = session.exec(select(Enrollment).where(Enrollment.student_id == user_id)).all()
    for enrollment in enrollments:
        section = session.get(Section, enrollment.section_id)
        if section:
            course = section.course
            teacher = section.teacher
            result.append(UserEnrollmentResponse(
                id=enrollment.id,
                course_id=course.id if course else section.course_id,
                course_title=course.title if course else "Unknown Course",
                course_code=course.code if course else "",
                course_description=course.description or "" if course else "",
                section_name=section.name,
                section_id=section.id,
                teacher_name=teacher.full_name if teacher else "Not Assigned",
                teacher_email=teacher.email if teacher else ""
            ))
            
    # 2. If no enrollments and user is a teacher or admin, return their teaching sections
    if not result and target_user.role in [Role.teacher, Role.admin]:
        teaching_sections = session.exec(select(Section).where(Section.teacher_id == user_id)).all()
        for section in teaching_sections:
            course = section.course
            result.append(UserEnrollmentResponse(
                id=section.id,
                course_id=course.id if course else section.course_id,
                course_title=course.title if course else "Unknown Course",
                course_code=course.code if course else "",
                course_description=course.description or "" if course else "",
                section_name=section.name,
                section_id=section.id,
                teacher_name=target_user.full_name,
                teacher_email=target_user.email
            ))
            
    return result
