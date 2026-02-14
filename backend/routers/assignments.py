from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from database import get_session
from models import Assignment, AssignmentCreate, Submission, SubmissionCreate, GradeSubmission, User, Role, Course
from auth import get_current_user
from datetime import datetime

router = APIRouter(
    prefix="/assignments",
    tags=["assignments"],
)

# --- Assignments ---

@router.post("/", response_model=Assignment)
def create_assignment(
    assignment: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
    
    # Verify course ownership
    course = session.get(Course, assignment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # In Phase 1 we use teacher_id on Section, but effectively if you are a teacher we might allow creating assignments for minimal friction now
    # Ideally check if teacher teaches any section of this course.
    
    db_assignment = Assignment.model_validate(assignment)
    session.add(db_assignment)
    session.commit()
    session.refresh(db_assignment)
    return db_assignment

@router.get("/course/{course_id}", response_model=List[Assignment])
def get_course_assignments(
    course_id: int,
    session: Session = Depends(get_session)
):
    assignments = session.exec(select(Assignment).where(Assignment.course_id == course_id)).all()
    return assignments

@router.get("/{assignment_id}", response_model=Assignment)
def get_assignment(
    assignment_id: int,
    session: Session = Depends(get_session)
):
    assignment = session.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

# --- Submissions ---

@router.post("/{assignment_id}/submit", response_model=Submission)
async def submit_assignment(
    assignment_id: int,
    content: str = "",
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
        
    assignment = session.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if existing submission
    existing = session.exec(
        select(Submission)
        .where(Submission.assignment_id == assignment_id)
        .where(Submission.student_id == current_user.id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")
    
    file_path = None
    
    # Handle file upload if provided
    if file and file.filename:
        import os
        import shutil
        from datetime import datetime
        
        upload_dir = "uploads/assignments"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = int(datetime.utcnow().timestamp())
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{assignment_id}_{current_user.id}_{timestamp}{file_extension}"
        file_path = f"{upload_dir}/{unique_filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    # Create submission
    db_submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        content=content if content else "",
        file_path=file_path
    )
    session.add(db_submission)
    session.commit()
    session.refresh(db_submission)
    return db_submission

@router.get("/{assignment_id}/submissions")
def get_submissions(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    submissions = session.exec(
        select(Submission).where(Submission.assignment_id == assignment_id)
    ).all()
    
    # Include student details in response
    result = []
    for submission in submissions:
        student = session.get(User, submission.student_id)
        result.append({
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "student_id": submission.student_id,
            "content": submission.content,
            "file_path": submission.file_path,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "grade": submission.grade,
            "feedback": submission.feedback,
            "student": {
                "id": student.id if student else None,
                "full_name": student.full_name if student else "Unknown",
                "email": student.email if student else ""
            } if student else None
        })
    
    return result

@router.post("/submissions/{submission_id}/grade", response_model=Submission)
def grade_submission(
    submission_id: int,
    grade_data: GradeSubmission,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    submission.grade = grade_data.grade
    submission.feedback = grade_data.feedback
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return submission


@router.get("/my-submissions", response_model=List[Submission])
def get_my_submissions(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    submissions = session.exec(select(Submission).where(Submission.student_id == current_user.id)).all()
    return submissions

@router.get("/{assignment_id}/my-submission")
def get_my_submission_for_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's submission for a specific assignment"""
    submission = session.exec(
        select(Submission)
        .where(Submission.assignment_id == assignment_id)
        .where(Submission.student_id == current_user.id)
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="No submission found")
    
    return submission
