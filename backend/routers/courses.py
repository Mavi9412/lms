from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import Course, CourseCreate, User, Role, Enrollment, Section
from auth import get_current_user

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
    # Teacher assignment is now done via Section, but Course still holds department.
    # We might need to adjust logic here, but for now allow creating the course object.
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
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

class CourseDetailResponse(BaseModel):
    id: int
    title: str
    description: str = "" # Added default
    created_at: str = "" # Placeholder
    is_enrolled: bool = False
    enrollment_count: int = 0

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
    
    return CourseDetailResponse(
        id=course.id,
        title=course.title,
        description=f"{course.code} - {course.credit_hours} Credits", 
        is_enrolled=enrollment is not None,
        enrollment_count=enrollment_count
    )

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
