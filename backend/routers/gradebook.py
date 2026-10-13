from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import (
    User, Role, Course, Section, Enrollment, Assignment, Submission,
    GradingScale, AuditLog,
)
from auth import get_current_user

router = APIRouter(
    prefix="/gradebook",
    tags=["gradebook"],
)


# Response models
class StudentGrade(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    grades: dict  # assignment_id -> grade (or None)
    total_points: float
    max_points: float
    percentage: float


class GradebookResponse(BaseModel):
    course_id: int
    course_title: str
    assignments: List[dict]  # List of {id, title, max_points}
    students: List[StudentGrade]


@router.get("/course/{course_id}", response_model=GradebookResponse)
def get_course_gradebook(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get gradebook for a course showing all students and their grades
    Teacher and Admin only
    """
    # Check authorization
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get course
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # For teachers, verify they teach this course (check Section A as we do elsewhere)
    if current_user.role == Role.teacher:
        section = session.exec(
            select(Section).where(
                Section.course_id == course_id,
                Section.teacher_id == current_user.id
            )
        ).first()
        
        if not section:
            raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Get all assignments for this course
    assignments = session.exec(
        select(Assignment).where(Assignment.course_id == course_id).order_by(Assignment.due_date)
    ).all()
    
    assignment_list = [
        {"id": a.id, "title": a.title, "max_points": a.max_points}
        for a in assignments
    ]
    
    # Get all enrolled students (from all sections of this course)
    enrollments = session.exec(
        select(Enrollment)
        .join(Section)
        .where(Section.course_id == course_id)
    ).all()
    
    # Get unique students
    student_ids = list(set([e.student_id for e in enrollments]))
    students_data = []
    
    for student_id in student_ids:
        student = session.get(User, student_id)
        if not student:
            continue
        
        # Get all submissions for this student in this course
        submissions = session.exec(
            select(Submission)
            .join(Assignment)
            .where(
                Submission.student_id == student_id,
                Assignment.course_id == course_id
            )
        ).all()
        
        # Create grades dict
        grades_dict = {}
        total_points = 0.0
        max_points = 0.0
        
        for assignment in assignments:
            submission = next(
                (s for s in submissions if s.assignment_id == assignment.id),
                None
            )
            
            if submission and submission.grade is not None:
                grades_dict[assignment.id] = submission.grade
                total_points += submission.grade
            else:
                grades_dict[assignment.id] = None
            
            max_points += assignment.max_points
        
        percentage = (total_points / max_points * 100) if max_points > 0 else 0
        
        students_data.append(StudentGrade(
            student_id=student.id,
            student_name=student.full_name,
            student_email=student.email,
            grades=grades_dict,
            total_points=total_points,
            max_points=max_points,
            percentage=round(percentage, 2)
        ))
    
    return GradebookResponse(
        course_id=course.id,
        course_title=course.title,
        assignments=assignment_list,
        students=students_data
    )


def _percentage_to_letter(percentage: float, scales: List[GradingScale]) -> str:
    """Map a percentage to a letter grade using the admin-defined scale,
    falling back to a standard scale when none is configured."""
    ordered = sorted(scales, key=lambda s: s.min_percentage, reverse=True)
    for scale in ordered:
        if percentage >= scale.min_percentage:
            return scale.grade_letter
    if not ordered:
        if percentage >= 90:
            return "A"
        if percentage >= 85:
            return "B+"
        if percentage >= 80:
            return "B"
        if percentage >= 75:
            return "C+"
        if percentage >= 70:
            return "C"
        if percentage >= 60:
            return "D"
        return "F"
    return ordered[-1].grade_letter


@router.post("/course/{course_id}/publish")
def publish_final_grades(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Compute final letter grades from the gradebook and write them to each
    enrollment in this course's sections. Teacher (of this course) and Admin
    only. Re-publishing overwrites previous letters.
    """
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")

    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == Role.teacher:
        teaches = session.exec(
            select(Section).where(
                Section.course_id == course_id,
                Section.teacher_id == current_user.id,
            )
        ).first()
        if not teaches:
            raise HTTPException(status_code=403, detail="Not authorized for this course")

    assignments = session.exec(
        select(Assignment).where(Assignment.course_id == course_id)
    ).all()
    if not assignments:
        raise HTTPException(status_code=400, detail="No assignments in this course yet")

    enrollments = session.exec(
        select(Enrollment).join(Section).where(Section.course_id == course_id)
    ).all()

    scales = session.exec(select(GradingScale)).all()

    published: Dict[int, str] = {}
    for enrollment in enrollments:
        submissions = session.exec(
            select(Submission)
            .join(Assignment)
            .where(
                Submission.student_id == enrollment.student_id,
                Assignment.course_id == course_id,
            )
        ).all()

        total_points = 0.0
        max_points = 0.0
        for assignment in assignments:
            submission = next(
                (s for s in submissions if s.assignment_id == assignment.id), None
            )
            if submission and submission.grade is not None:
                total_points += submission.grade
            max_points += assignment.max_points

        percentage = (total_points / max_points * 100) if max_points > 0 else 0
        letter = _percentage_to_letter(percentage, list(scales))
        enrollment.grade = letter
        session.add(enrollment)
        published[enrollment.student_id] = letter

    session.add(
        AuditLog(
            action="FINAL_GRADE_PUBLISH",
            performed_by=current_user.id,
            target_id=course_id,
            details=f"Published final grades for course '{course.title}' ({len(published)} students)",
        )
    )
    session.commit()

    return {
        "course_id": course_id,
        "published": len(published),
        "grades": published,
    }
