from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import User, Role, Course, Section, Enrollment, Assignment, Submission
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
