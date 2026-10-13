from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel
from pydantic import BaseModel
from database import get_session
from models import LessonProgress, Course, CourseCreate, User, Role, Enrollment, Section, Lesson, LessonCreate, LessonUpdate, Semester, Department, CourseMaterial, utcnow, CourseModule
from datetime import datetime
from auth import get_current_user
from permissions import require_course_access, require_enrollment
import shutil
import os
from fastapi import UploadFile, File

router = APIRouter(
    prefix="/courses",
    tags=["courses"],
)

@router.get("/", response_model=List[Course])
def read_courses(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    # Public catalog: archived courses are hidden (admins use /admin/courses)
    courses = session.exec(
        select(Course).where(Course.is_archived == False).offset(skip).limit(limit)  # noqa: E711
    ).all()
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
        
    # Must teach a section of this course (or be admin)
    require_course_access(session, current_user, course_id, "add lessons to this course")

    db_lesson = Lesson.model_validate(lesson)
    db_lesson.course_id = course_id # Ensure course_id matches URL
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

@router.put("/{course_id}/lessons/{lesson_id}", response_model=Lesson)
def update_lesson(
    course_id: int,
    lesson_id: int,
    lesson_update: LessonUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    lesson = session.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")

    require_course_access(session, current_user, course_id, "edit lessons in this course")

    update_data = lesson_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return lesson

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
        
    require_course_access(session, current_user, course_id, "delete lessons from this course")

    session.delete(lesson)
    session.commit()
    return {"ok": True}

# Enroll in a course
@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    section_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role != Role.student:
         raise HTTPException(status_code=403, detail="Only students can enroll")

    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not course.is_published:
        raise HTTPException(status_code=400, detail="Course is not published yet")
    if course.is_archived:
        raise HTTPException(status_code=400, detail="Course is archived — enrollment closed")

    if section_id is not None:
        section = session.get(Section, section_id)
        if not section or section.course_id != course_id:
            raise HTTPException(status_code=404, detail="Section not found for this course")
    else:
        # Backwards-compatible default: a section named "Section A"
        section = session.exec(select(Section).where(Section.course_id == course_id).where(Section.name == "Section A")).first()
        if not section:
            raise HTTPException(status_code=400, detail="No default section for this course — pass section_id")

    existing = session.exec(select(Enrollment).where(Enrollment.student_id == current_user.id).where(Enrollment.section_id == section.id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = Enrollment(student_id=current_user.id, section_id=section.id)
    session.add(enrollment)
    session.commit()
    return {"ok": True, "section_id": section.id}

# --- Course Materials (Uploads) ---

@router.post("/{course_id}/materials", response_model=CourseMaterial)
def upload_course_material(
    course_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    require_course_access(session, current_user, course_id, "upload materials to this course")

    # Save file
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_location = f"{upload_dir}/{course_id}_{int(utcnow().timestamp())}_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    material = CourseMaterial(
        title=file.filename,
        file_path=file_location,
        course_id=course_id
    )
    session.add(material)
    session.commit()
    session.refresh(material)
    return material

@router.get("/{course_id}/materials", response_model=List[CourseMaterial])
def get_course_materials(
    course_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check if course exists
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Anyone authenticated can view materials for now
    
    materials = session.exec(select(CourseMaterial).where(CourseMaterial.course_id == course_id)).all()
    return materials

@router.delete("/{course_id}/materials/{material_id}")
def delete_course_material(
    course_id: int,
    material_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    material = session.get(CourseMaterial, material_id)
    if not material or material.course_id != course_id:
        raise HTTPException(status_code=404, detail="Material not found")
        
    require_course_access(session, current_user, course_id, "delete materials from this course")

    # Delete file from disk
    if os.path.exists(material.file_path):
        os.remove(material.file_path)

    session.delete(material)
    session.commit()
    return {"ok": True}


# --- Lesson Progress Tracking ---

@router.post("/{course_id}/lessons/{lesson_id}/complete")
def complete_lesson(
    course_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Student marks a lesson complete."""
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students track progress")
    lesson = session.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    require_enrollment(session, current_user.id, course_id)

    existing = session.exec(
        select(LessonProgress)
        .where(LessonProgress.student_id == current_user.id)
        .where(LessonProgress.lesson_id == lesson_id)
    ).first()
    if existing:
        return {"ok": True, "already_completed": True}
    progress = LessonProgress(student_id=current_user.id, lesson_id=lesson_id)
    session.add(progress)
    session.commit()
    return {"ok": True, "completed_at": progress.completed_at.isoformat()}


@router.delete("/{course_id}/lessons/{lesson_id}/complete")
def uncomplete_lesson(
    course_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Student un-marks a lesson."""
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students track progress")
    progress = session.exec(
        select(LessonProgress)
        .where(LessonProgress.student_id == current_user.id)
        .where(LessonProgress.lesson_id == lesson_id)
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Lesson not marked complete")
    session.delete(progress)
    session.commit()
    return {"ok": True}


@router.get("/{course_id}/progress")
def my_course_progress(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Student's own progress: completed lesson ids + percentage."""
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students track progress")
    require_enrollment(session, current_user.id, course_id)
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id)).all()
    done = session.exec(
        select(LessonProgress.lesson_id).where(LessonProgress.student_id == current_user.id)
    ).all()
    done_ids = [lid for lid in done if any(l.id == lid for l in lessons)]
    total = len(lessons)
    return {
        "course_id": course_id,
        "completed_lesson_ids": done_ids,
        "total_lessons": total,
        "percentage": round(len(done_ids) / total * 100, 1) if total else 0,
    }


@router.get("/{course_id}/students/{student_id}/progress")
def student_course_progress(
    course_id: int,
    student_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Teacher/admin view of a student's progress in a course."""
    require_course_access(session, current_user, course_id, "view progress for this course")
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id)).all()
    done = session.exec(
        select(LessonProgress.lesson_id).where(LessonProgress.student_id == student_id)
    ).all()
    done_ids = [lid for lid in done if any(l.id == lid for l in lessons)]
    total = len(lessons)
    return {
        "course_id": course_id,
        "student_id": student_id,
        "completed_lesson_ids": done_ids,
        "total_lessons": total,
        "percentage": round(len(done_ids) / total * 100, 1) if total else 0,
    }


# --- Course Modules ---

class ModuleCreate(SQLModel):
    title: str
    description: Optional[str] = None
    order: int = 0


class ModuleUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


def _can_view_course(session: Session, user: User, course_id: int) -> bool:
    if user.role == Role.admin:
        return True
    if user.role == Role.teacher:
        return session.exec(
            select(Section).where(
                Section.course_id == course_id, Section.teacher_id == user.id
            )
        ).first() is not None
    return session.exec(
        select(Enrollment).join(Section).where(
            Enrollment.student_id == user.id, Section.course_id == course_id
        )
    ).first() is not None


def _module_payload(session: Session, module: "CourseModule") -> dict:
    lessons = session.exec(
        select(Lesson).where(Lesson.module_id == module.id).order_by(Lesson.order)
    ).all()
    return {
        "id": module.id,
        "course_id": module.course_id,
        "title": module.title,
        "description": module.description,
        "order": module.order,
        "lessons": [
            {"id": l.id, "title": l.title, "content": l.content, "order": l.order,
             "course_id": l.course_id, "module_id": l.module_id}
            for l in lessons
        ],
    }


@router.post("/{course_id}/modules")
def create_module(
    course_id: int,
    data: ModuleCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a module (chapter) in a course. Teacher of the course / admin."""
    require_course_access(session, current_user, course_id, "manage modules for this course")
    module = CourseModule(course_id=course_id, title=data.title,
                          description=data.description, order=data.order)
    session.add(module)
    session.commit()
    session.refresh(module)
    return _module_payload(session, module)


@router.get("/{course_id}/modules")
def list_modules(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Modules with nested lessons + unassigned lessons. Enrolled students, teachers, admin."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not _can_view_course(session, current_user, course_id):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    modules = session.exec(
        select(CourseModule).where(CourseModule.course_id == course_id).order_by(CourseModule.order)
    ).all()
    unassigned = session.exec(
        select(Lesson).where(Lesson.course_id == course_id, Lesson.module_id == None).order_by(Lesson.order)  # noqa: E711
    ).all()
    return {
        "modules": [_module_payload(session, m) for m in modules],
        "unassigned_lessons": [
            {"id": l.id, "title": l.title, "content": l.content, "order": l.order,
             "course_id": l.course_id, "module_id": l.module_id}
            for l in unassigned
        ],
    }


@router.put("/{course_id}/modules/{module_id}")
def update_module(
    course_id: int,
    module_id: int,
    data: ModuleUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    require_course_access(session, current_user, course_id, "manage modules for this course")
    module = session.get(CourseModule, module_id)
    if not module or module.course_id != course_id:
        raise HTTPException(status_code=404, detail="Module not found")
    if data.title is not None:
        module.title = data.title
    if data.description is not None:
        module.description = data.description
    if data.order is not None:
        module.order = data.order
    session.add(module)
    session.commit()
    session.refresh(module)
    return _module_payload(session, module)


@router.delete("/{course_id}/modules/{module_id}")
def delete_module(
    course_id: int,
    module_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a module. Its lessons are kept, moved back to unassigned."""
    require_course_access(session, current_user, course_id, "manage modules for this course")
    module = session.get(CourseModule, module_id)
    if not module or module.course_id != course_id:
        raise HTTPException(status_code=404, detail="Module not found")
    lessons = session.exec(select(Lesson).where(Lesson.module_id == module_id)).all()
    for lesson in lessons:
        lesson.module_id = None
        session.add(lesson)
    session.delete(module)
    session.commit()
    return {"ok": True, "unassigned_lessons": len(lessons)}


@router.patch("/{course_id}/lessons/{lesson_id}/move")
def move_lesson(
    course_id: int,
    lesson_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Move a lesson into/out of a module. Body: {module_id (or null), order?}."""
    require_course_access(session, current_user, course_id, "manage modules for this course")
    lesson = session.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    module_id = data.get("module_id")
    if module_id is not None:
        module = session.get(CourseModule, module_id)
        if not module or module.course_id != course_id:
            raise HTTPException(status_code=404, detail="Module not found")
    lesson.module_id = module_id
    if data.get("order") is not None:
        lesson.order = data["order"]
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return {"ok": True, "lesson_id": lesson.id, "module_id": lesson.module_id}
