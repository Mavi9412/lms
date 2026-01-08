from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from ..database import get_session
from ..models import Course, CourseCreate, User, Role, Lesson, LessonCreate, LessonUpdate, Enrollment
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

# Response models for detailed course info
class TeacherInfo(BaseModel):
    id: int
    full_name: str
    email: str

class CourseDetailResponse(BaseModel):
    id: int
    title: str
    description: str
    teacher_id: int
    created_at: str
    teacher: TeacherInfo
    lessons: List[Lesson]
    is_enrolled: bool = False
    enrollment_count: int = 0

class EnrollmentResponse(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    enrolled_at: str

# Get course details with teacher info and lessons
@router.get("/{course_id}/details", response_model=CourseDetailResponse)
def get_course_details(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get teacher info
    teacher = session.get(User, course.teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get lessons
    lessons = session.exec(
        select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)
    ).all()
    
    # Check if current user is enrolled
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id
        )
    ).first()
    
    # Get enrollment count
    enrollment_count = len(session.exec(
        select(Enrollment).where(Enrollment.course_id == course_id)
    ).all())
    
    return CourseDetailResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        teacher_id=course.teacher_id,
        created_at=course.created_at.isoformat(),
        teacher=TeacherInfo(
            id=teacher.id,
            full_name=teacher.full_name,
            email=teacher.email
        ),
        lessons=lessons,
        is_enrolled=enrollment is not None,
        enrollment_count=enrollment_count
    )

# Enroll in a course
@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students can enroll in courses")
    
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    existing = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    enrollment = Enrollment(student_id=current_user.id, course_id=course_id)
    session.add(enrollment)
    session.commit()
    return {"ok": True, "message": "Successfully enrolled"}

# Unenroll from a course
@router.delete("/{course_id}/enroll")
def unenroll_from_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")
    
    session.delete(enrollment)
    session.commit()
    return {"ok": True, "message": "Successfully unenrolled"}

# Get enrolled students (teachers/admins only)
@router.get("/{course_id}/enrollments", response_model=List[EnrollmentResponse])
def get_course_enrollments(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Only teacher of course or admin can view enrollments
    if current_user.role != Role.admin and (current_user.role != Role.teacher or course.teacher_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view enrollments")
    
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.course_id == course_id)
    ).all()
    
    result = []
    for enrollment in enrollments:
        student = session.get(User, enrollment.student_id)
        if student:
            result.append(EnrollmentResponse(
                student_id=student.id,
                student_name=student.full_name,
                student_email=student.email,
                enrolled_at=enrollment.enrolled_at.isoformat()
            ))
    
    return result

# Create a lesson
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
    
    # Only teacher of course or admin can create lessons
    if current_user.role != Role.admin and (current_user.role != Role.teacher or course.teacher_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to create lessons for this course")
    
    db_lesson = Lesson.model_validate(lesson)
    db_lesson.course_id = course_id
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

# Update a lesson
@router.put("/{course_id}/lessons/{lesson_id}", response_model=Lesson)
def update_lesson(
    course_id: int,
    lesson_id: int,
    lesson_update: LessonUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Only teacher of course or admin can update lessons
    if current_user.role != Role.admin and (current_user.role != Role.teacher or course.teacher_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update lessons for this course")
    
    lesson = session.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    lesson_data = lesson_update.model_dump(exclude_unset=True)
    for key, value in lesson_data.items():
        setattr(lesson, key, value)
    
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return lesson

# Delete a lesson
@router.delete("/{course_id}/lessons/{lesson_id}")
def delete_lesson(
    course_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Only teacher of course or admin can delete lessons
    if current_user.role != Role.admin and (current_user.role != Role.teacher or course.teacher_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete lessons for this course")
    
    lesson = session.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    session.delete(lesson)
    session.commit()
    return {"ok": True}

