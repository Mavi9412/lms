from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import Course, CourseCreate, User, Role, Enrollment, Section, Lesson, LessonCreate, Semester, Department, CourseMaterial
from datetime import datetime
from auth import get_current_user
import shutil
import os
from fastapi import UploadFile, File

router = APIRouter(
    prefix="/courses",
    tags=["courses"],
)

@router.get("/", response_model=List[Course])
def read_courses(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    courses = session.exec(select(Course).offset(skip).limit(limit)).all()
    return courses

@router.get("/{course_id}", response_model=Course)
def read_course(course_id: int, session: Session = Depends(get_session)):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/", response_model=Course)
def create_course(
    course: CourseCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can create courses")
    
    db_course = Course.model_validate(course)
    session.add(db_course)
    session.commit()
    session.refresh(db_course)

    # Automatically create "Section A" for the current/default semester
    # For now, we'll try to find an active semester, or create a dummy one if none exists
    semester = session.exec(select(Semester).where(Semester.is_active == True)).first()
    if not semester:
        # Fallback: Find ANY semester
        semester = session.exec(select(Semester)).first()
        if not semester:
            # Create a default semester
             semester = Semester(name="Fall 2024", is_active=True)
             session.add(semester)
             session.commit()
             session.refresh(semester)
    
    # Create Section A
    section = Section(
        name="Section A",
        course_id=db_course.id,
        semester_id=semester.id,
        teacher_id=current_user.id if current_user.role == Role.teacher else None
    )
    session.add(section)
    session.commit()

    return db_course

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Simple admin check for now
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")

    session.delete(course)
    session.commit()
    return {"ok": True}

# Response models for detailed course info
class TeacherInfo(BaseModel):
    id: int
    full_name: str
    email: str

class LessonResponse(BaseModel):
    id: int
    title: str
    content: str
    order: int
    created_at: datetime

class CourseDetailResponse(BaseModel):
    id: int
    title: str
    description: str = "" # Added default
    created_at: str = "" # Placeholder
    is_enrolled: bool = False
    is_enrolled: bool = False
    enrollment_count: int = 0
    teacher: Optional[TeacherInfo] = None
    lessons: List[LessonResponse] = []

# Get course details 
@router.get("/{course_id}/details", response_model=CourseDetailResponse)
def get_course_details(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if current user is enrolled in ANY section of this course
    # This logic is a bit complex with the new schema, simplification for now:
    # We check if student has enrollment in a section that belongs to this course.
    
    enrollment = session.exec(
        select(Enrollment)
        .join(Section)
        .where(
            Enrollment.student_id == current_user.id,
            Section.course_id == course_id
        )
    ).first()
    
    # Get enrollment count (total across all sections)
    enrollment_count = len(session.exec(
        select(Enrollment)
        .join(Section)
        .where(Section.course_id == course_id)
    ).all())
    
    # Find the teacher for Section A (default)
    section_a = session.exec(select(Section).where(Section.course_id == course_id).where(Section.name == "Section A")).first()
    teacher_info = None
    if section_a and section_a.teacher:
         teacher_info = TeacherInfo(id=section_a.teacher.id, full_name=section_a.teacher.full_name, email=section_a.teacher.email)
    
    # Get Lessons
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)).all()
    lesson_responses = [LessonResponse(id=l.id, title=l.title, content=l.content, order=l.order, created_at=l.created_at) for l in lessons]

    return CourseDetailResponse(
        id=course.id,
        title=course.title,
        description=course.description or f"{course.code} - {course.credit_hours} Credits", 
        is_enrolled=enrollment is not None,
        enrollment_count=enrollment_count,
        teacher=teacher_info,
        lessons=lesson_responses
    )

# --- Lessons CRUD ---

@router.post("/{course_id}/lessons", response_model=Lesson)
def create_lesson(
    course_id: int,
    lesson: LessonCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Check permissions (must be teacher of the course or admin)
    # Simplified: Check if user is the teacher of Section A or Admin
    is_authorized = False
    if current_user.role == Role.admin:
        is_authorized = True
    else:
        section = session.exec(select(Section).where(Section.course_id == course_id).where(Section.name == "Section A")).first()
        if section and section.teacher_id == current_user.id:
            is_authorized = True
            
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to add lessons to this course")

    db_lesson = Lesson.model_validate(lesson)
    db_lesson.course_id = course_id # Ensure course_id matches URL
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

@router.delete("/{course_id}/lessons/{lesson_id}")
def delete_lesson(
    course_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    lesson = session.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Check permissions
    is_authorized = False
    if current_user.role == Role.admin:
        is_authorized = True
    else:
        section = session.exec(select(Section).where(Section.course_id == course_id).where(Section.name == "Section A")).first()
        if section and section.teacher_id == current_user.id:
            is_authorized = True
            
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to delete lessons from this course")

    session.delete(lesson)
    session.commit()
    return {"ok": True}

# Enroll in a course (Enroll in DEFAULT Section A for now)
@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # This is a bit hacky for Phase 1 compatibility
    # validating student role
    if current_user.role != Role.student:
         raise HTTPException(status_code=403, detail="Only students can enroll")

    # Find Section A
    section = session.exec(select(Section).where(Section.course_id == course_id).where(Section.name == "Section A")).first()
    if not section:
        raise HTTPException(status_code=404, detail="Default Section A not found for this course")

    existing = session.exec(select(Enrollment).where(Enrollment.student_id == current_user.id).where(Enrollment.section_id == section.id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = Enrollment(student_id=current_user.id, section_id=section.id)
    session.add(enrollment)
    session.commit()
    return {"ok": True}
