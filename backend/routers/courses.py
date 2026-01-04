from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Course, CourseCreate, User, Role
from ..auth import get_current_user

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
    db_course.teacher_id = current_user.id
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
    
    if current_user.role != Role.admin and (current_user.role != Role.teacher or course.teacher_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")

    session.delete(course)
    session.commit()
    return {"ok": True}
