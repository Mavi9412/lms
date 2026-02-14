from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from database import get_session
from models import User, Role, Section, Enrollment, Assignment, Submission, Course
from auth import get_current_user
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(
    prefix="/teacher",
    tags=["teacher"],
)

def get_current_teacher(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is a teacher"""
    if current_user.role != Role.teacher:
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user


@router.get("/dashboard")
def get_teacher_dashboard(
    session: Session = Depends(get_session),
    teacher: User = Depends(get_current_teacher)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard data for teacher including:
    - Assigned sections/courses
    - Total enrolled students
    - Pending grading tasks
    - Upcoming classes (placeholder for now)
    """
    
    # Get all sections assigned to this teacher
    sections_query = select(Section).where(Section.teacher_id == teacher.id)
    sections = session.exec(sections_query).all()
    
    # Build assigned sections data with course info and enrollment counts
    assigned_sections = []
    total_students = 0
    
    for section in sections:
        # Get course details
        course = session.get(Course, section.course_id)
        
        # Count enrollments in this section
        enrollment_count = session.exec(
            select(func.count(Enrollment.id)).where(Enrollment.section_id == section.id)
        ).one()
        
        total_students += enrollment_count
        
        assigned_sections.append({
            "id": section.id,
            "name": section.name,
            "course": {
                "id": course.id if course else None,
                "title": course.title if course else "Unknown",
                "code": course.code if course else "N/A",
                "credit_hours": course.credit_hours if course else 0
            },
            "semester": section.semester if section.semester else "Current",
            "enrolled_count": enrollment_count,
            "capacity": section.capacity
        })
    
    # Get pending grading tasks
    # Find all assignments in teacher's sections
    section_ids = [s.id for s in sections]
    
    pending_grading = []
    if section_ids:
        # Get assignments for these sections
        assignments_query = select(Assignment).where(Assignment.section_id.in_(section_ids))
        assignments = session.exec(assignments_query).all()
        
        for assignment in assignments:
            # Count ungraded submissions
            ungraded_count = session.exec(
                select(func.count(Submission.id))
                .where(Submission.assignment_id == assignment.id)
                .where(Submission.grade == None)
            ).one()
            
            if ungraded_count > 0:
                # Get section and course info
                section = session.get(Section, assignment.section_id)
                course = session.get(Course, section.course_id) if section else None
                
                pending_grading.append({
                    "assignment_id": assignment.id,
                    "assignment_title": assignment.title,
                    "section_id": assignment.section_id,
                    "section_name": section.name if section else "Unknown",
                    "course_code": course.code if course else "N/A",
                    "course_title": course.title if course else "Unknown",
                    "pending_count": ungraded_count,
                    "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
                    "total_submissions": session.exec(
                        select(func.count(Submission.id))
                        .where(Submission.assignment_id == assignment.id)
                    ).one()
                })
    
    # Upcoming classes - placeholder for now (no class schedule model exists yet)
    upcoming_classes = []
    # Future: Add class schedule functionality here
    
    return {
        "assigned_sections": assigned_sections,
        "total_students": total_students,
        "pending_grading": pending_grading,
        "upcoming_classes": upcoming_classes,
        "stats": {
            "total_courses": len(assigned_sections),
            "total_students": total_students,
            "pending_tasks": len(pending_grading),
            "total_assignments": len(assignments) if section_ids else 0
        }
    }


@router.get("/sections")
def get_teacher_sections(
    session: Session = Depends(get_session),
    teacher: User = Depends(get_current_teacher)
) -> List[Dict[str, Any]]:
    """Get all sections assigned to the teacher"""
    sections_query = select(Section).where(Section.teacher_id == teacher.id)
    sections = session.exec(sections_query).all()
    
    result = []
    for section in sections:
        course = session.get(Course, section.course_id)
        enrollment_count = session.exec(
            select(func.count(Enrollment.id)).where(Enrollment.section_id == section.id)
        ).one()
        
        result.append({
            "id": section.id,
            "name": section.name,
            "course_id": section.course_id,
            "course_title": course.title if course else "Unknown",
            "course_code": course.code if course else "N/A",
            "course_description": course.description if course else None,
            "credit_hours": course.credit_hours if course else 0,
            "semester": section.semester,
            "enrolled_count": enrollment_count,
            "capacity": section.capacity
        })
    
    return result


@router.get("/sections/{section_id}")
def get_section_details(
    section_id: int,
    session: Session = Depends(get_session),
    teacher: User = Depends(get_current_teacher)
) -> Dict[str, Any]:
    """Get detailed information about a specific section (teacher must own it)"""
    # Get section and verify it belongs to this teacher
    section = session.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if section.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="You can only view your own sections")
    
    # Get course details
    course = session.get(Course, section.course_id)
    
    # Count enrollments
    enrollment_count = session.exec(
        select(func.count(Enrollment.id)).where(Enrollment.section_id == section.id)
    ).one()
    
    return {
        "id": section.id,
        "name": section.name,
        "semester": section.semester,
        "capacity": section.capacity,
        "enrolled_count": enrollment_count,
        "course": {
            "id": course.id if course else None,
            "title": course.title if course else "Unknown",
            "code": course.code if course else "N/A",
            "description": course.description if course else None,
            "credit_hours": course.credit_hours if course else 0
        }
    }


@router.get("/sections/{section_id}/students")
def get_section_students(
    section_id: int,
    session: Session = Depends(get_session),
    teacher: User = Depends(get_current_teacher)
) -> List[Dict[str, Any]]:
    """Get list of enrolled students in a section (teacher must own it)"""
    # Get section and verify it belongs to this teacher
    section = session.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if section.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="You can only view students in your own sections")
    
    # Get all enrollments for this section
    enrollments_query = select(Enrollment).where(Enrollment.section_id == section_id)
    enrollments = session.exec(enrollments_query).all()
    
    students = []
    for enrollment in enrollments:
        student = session.get(User, enrollment.student_id)
        if student:
            students.append({
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email,
                "enrollment_date": enrollment.created_at.isoformat() if enrollment.created_at else None
            })
    
    return students
