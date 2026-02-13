from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from database import get_session
from models import User, Role, Department, Program, Course, Section, Semester, AuditLog, UserCreate, UserUpdate, CourseUpdate
from auth import get_current_user, get_password_hash
from typing import List, Dict, Any

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

# Admin Dependency
def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# --- Dashboard Stats ---

@router.get("/stats")
def get_stats(
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    total_students = session.exec(select(func.count(User.id)).where(User.role == Role.student)).one()
    total_teachers = session.exec(select(func.count(User.id)).where(User.role == Role.teacher)).one()
    total_courses = session.exec(select(func.count(Course.id))).one()
    total_departments = session.exec(select(func.count(Department.id))).one()
    
    return {
        "students": total_students,
        "teachers": total_teachers,
        "courses": total_courses,
        "departments": total_departments
    }

# --- User Management ---

@router.get("/users", response_model=List[User])
def get_users(
    role: Role = None,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    return session.exec(query).all()

@router.post("/users", response_model=User)
def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    # Check if email exists
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        hashed_password=hashed_password,
        program_id=user_data.program_id
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Audit Log
    log = AuditLog(
        action="CREATE_USER",
        performed_by=admin.id,
        target_id=new_user.id,
        details=f"Created user {new_user.email} as {new_user.role}"
    )
    session.add(log)
    session.commit()
    
    return new_user

@router.patch("/users/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being changed and if it's already taken by another user
    if user_data.email != user.email:
        existing = session.exec(select(User).where(User.email == user_data.email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update user fields
    user.email = user_data.email
    user.full_name = user_data.full_name
    user.role = user_data.role
    user.program_id = user_data.program_id
    
    # Update password only if provided
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Audit Log
    log = AuditLog(
        action="UPDATE_USER",
        performed_by=admin.id,
        target_id=user.id,
        details=f"Updated user {user.email}"
    )
    session.add(log)
    session.commit()
    
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Delete user - this will fail if there are foreign key constraints
        session.delete(user)
        session.commit()
        
        # Audit Log
        log = AuditLog(
            action="DELETE_USER",
            performed_by=admin.id,
            target_id=user_id,
            details=f"Deleted user {user.email}"
        )
        session.add(log)
        session.commit()
        
        return {"message": "User deleted"}
    except Exception as e:
        session.rollback()
        # Check if it's a foreign key constraint error
        if "FOREIGN KEY constraint failed" in str(e) or "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete user: User has associated data (enrollments, submissions, or teaching assignments). Please remove these first or contact system administrator."
            )
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Toggle user active/inactive status"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle the active status
    user.is_active = not user.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Audit Log
    action_status = "ACTIVATE_USER" if user.is_active else "DEACTIVATE_USER"
    log = AuditLog(
        action=action_status,
        performed_by=admin.id,
        target_id=user_id,
        details=f"{'Activated' if user.is_active else 'Deactivated'} user {user.email}"
    )
    session.add(log)
    session.commit()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}

# --- Academic Structure ---

# Departments
@router.post("/departments", response_model=Department)
def create_department(dept: Department, session: Session = Depends(get_session), admin: User = Depends(get_current_admin)):
    session.add(dept)
    session.commit()
    session.refresh(dept)
    return dept

@router.delete("/departments/{dept_id}")
def delete_department(dept_id: int, session: Session = Depends(get_session), admin: User = Depends(get_current_admin)):
    dept = session.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    session.delete(dept)
    session.commit()
    return {"message": "Deleted"}

# Programs
@router.post("/programs", response_model=Program)
def create_program(prog: Program, session: Session = Depends(get_session), admin: User = Depends(get_current_admin)):
    session.add(prog)
    session.commit()
    session.refresh(prog)
    return prog

@router.delete("/programs/{prog_id}")
def delete_program(prog_id: int, session: Session = Depends(get_session), admin: User = Depends(get_current_admin)):
    prog = session.get(Program, prog_id)
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    session.delete(prog)
    session.commit()
    return {"message": "Deleted"}

# Courses
@router.get("/courses", response_model=List[Course])
def get_all_courses(
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Get all courses for admin management"""
    courses = session.exec(select(Course)).all()
    return courses

@router.get("/courses/{course_id}", response_model=Course)
def get_course(
    course_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Get single course details"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/courses", response_model=Course)
def create_course(
    course_data: Course,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Create a new course"""
    # Check if code already exists
    existing = session.exec(select(Course).where(Course.code == course_data.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    
    session.add(course_data)
    session.commit()
    session.refresh(course_data)
    
    # Audit Log
    log = AuditLog(
        action="CREATE_COURSE",
        performed_by=admin.id,
        target_id=course_data.id,
        details=f"Created course {course_data.code} - {course_data.title}"
    )
    session.add(log)
    session.commit()
    
    return course_data

@router.patch("/courses/{course_id}", response_model=Course)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Update course details"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if code is being changed and if it's already taken
    if course_data.code and course_data.code != course.code:
        existing = session.exec(select(Course).where(Course.code == course_data.code)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Course code already exists")
    
    # Update fields
    update_data = course_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(course, key, value)
    
    session.add(course)
    session.commit()
    session.refresh(course)
    
    # Audit Log
    log = AuditLog(
        action="UPDATE_COURSE",
        performed_by=admin.id,
        target_id=course_id,
        details=f"Updated course {course.code}"
    )
    session.add(log)
    session.commit()
    
    return course

@router.patch("/courses/{course_id}/approve")
def approve_course(
    course_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Approve a course"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_approved = True
    session.add(course)
    session.commit()
    
    # Audit Log
    log = AuditLog(
        action="APPROVE_COURSE",
        performed_by=admin.id,
        target_id=course_id,
        details=f"Approved course {course.code}"
    )
    session.add(log)
    session.commit()
    
    return {"message": "Course approved", "is_approved": True}

@router.patch("/courses/{course_id}/toggle-publish")
def toggle_course_publish(
    course_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Toggle course publish status"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_published = not course.is_published
    session.add(course)
    session.commit()
    
    # Audit Log
    action = "PUBLISH_COURSE" if course.is_published else "UNPUBLISH_COURSE"
    log = AuditLog(
        action=action,
        performed_by=admin.id,
        target_id=course_id,
        details=f"{'Published' if course.is_published else 'Unpublished'} course {course.code}"
    )
    session.add(log)
    session.commit()
    
    return {"message": f"Course {'published' if course.is_published else 'unpublished'}", "is_published": course.is_published}

@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Delete a course"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    code = course.code
    session.delete(course)
    session.commit()
    
    # Audit Log
    log = AuditLog(
        action="DELETE_COURSE",
        performed_by=admin.id,
        target_id=course_id,
        details=f"Deleted course {code}"
    )
    session.add(log)
    session.commit()
    
    return {"message": "Deleted"}

# Semesters
@router.post("/semesters", response_model=Semester)
def create_semester(sem: Semester, session: Session = Depends(get_session), admin: User = Depends(get_current_admin)):
    session.add(sem)
    session.commit()
    session.refresh(sem)
    return sem

# Sections
@router.post("/sections", response_model=Section)
def create_section(section: Section, session: Session = Depends(get_session), admin: User = Depends(get_current_admin)):
    session.add(section)
    session.commit()
    session.refresh(section)
    return section

# --- Allocations ---

@router.post("/sections/{section_id}/assign-teacher/{teacher_id}")
def assign_teacher(
    section_id: int, 
    teacher_id: int, 
    session: Session = Depends(get_session), 
    admin: User = Depends(get_current_admin)
):
    section = session.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
        
    teacher = session.get(User, teacher_id)
    if not teacher or teacher.role != Role.teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    section.teacher_id = teacher_id
    session.add(section)
    session.commit()
    return {"message": f"Assigned {teacher.full_name} to {section.name}"}
