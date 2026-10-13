from typing import List, Dict, Tuple, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import (
    User, Role, Course, Section, Enrollment, Assignment, Submission,
    GradingScale, AuditLog, Quiz, Question, QuizAttempt,
    Attendance, AttendanceStatus, AttendancePolicy,
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
    grades: dict  # assignment_id -> grade (or None); quizzes keyed as "quiz_<id>"
    total_points: float
    max_points: float
    percentage: float
    attendance_percentage: Optional[float] = None


class GradebookResponse(BaseModel):
    course_id: int
    course_title: str
    assignments: List[dict]  # List of {id, title, max_points}
    quizzes: List[dict]  # List of {id, title, max_points}
    students: List[StudentGrade]


@router.get("/course/{course_id}", response_model=GradebookResponse)
def get_course_gradebook(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get gradebook for a course showing all students and their grades.
    Includes assignments and quizzes (best attempt per quiz).
    Teacher and Admin only.
    """
    course = _authorize_gradebook_access(course_id, current_user, session)

    assignments, quizzes, grades_by_student, totals, percentages = _compute_scores(
        session, course_id
    )

    assignment_list = [
        {"id": a.id, "title": a.title, "max_points": a.max_points}
        for a in assignments
    ]
    quiz_list = [
        {"id": q.id, "title": q.title, "max_points": qmax}
        for q, qmax in quizzes
    ]

    students_data = []
    for student_id, grades_dict in grades_by_student.items():
        student = session.get(User, student_id)
        if not student:
            continue
        students_data.append(StudentGrade(
            student_id=student.id,
            student_name=student.full_name,
            student_email=student.email,
            grades=grades_dict,
            total_points=totals[student_id],
            max_points=sum(a.max_points for a in assignments)
            + sum(qmax for _, qmax in quizzes),
            percentage=percentages[student_id],
            attendance_percentage=_attendance_percentage(session, student.id, course_id),
        ))

    return GradebookResponse(
        course_id=course.id,
        course_title=course.title,
        assignments=assignment_list,
        quizzes=quiz_list,
        students=students_data
    )


def _quiz_max_points(session: Session, quiz: Quiz) -> float:
    """Total points of a quiz = sum of its questions' points."""
    questions = session.exec(select(Question).where(Question.quiz_id == quiz.id)).all()
    return sum(q.points for q in questions)


def _best_quiz_attempt(
    session: Session, quiz_id: int, student_id: int
) -> Optional[QuizAttempt]:
    """Best submitted attempt by percentage (None when no graded attempt)."""
    attempts = session.exec(
        select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == student_id,
            QuizAttempt.submitted_at.is_not(None),
        )
    ).all()
    graded = [a for a in attempts if a.percentage is not None]
    if not graded:
        return None
    return max(graded, key=lambda a: a.percentage or 0)


def _compute_scores(
    session: Session, course_id: int
) -> Tuple[List[Assignment], List[Tuple[Quiz, float]], Dict[int, dict], Dict[int, float], Dict[int, float]]:
    """
    Shared scoring logic for the gradebook and final-grade publishing.

    Returns (assignments, [(quiz, max_points)], grades_by_student, totals, percentages).
    Quiz grades use each student's best attempt, normalized to the quiz's total points.
    Quiz entries in grades_by_student are keyed as "quiz_<id>".
    """
    assignments = session.exec(
        select(Assignment).where(Assignment.course_id == course_id).order_by(Assignment.due_date)
    ).all()
    quizzes = session.exec(
        select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.created_at)
    ).all()
    quiz_max = {q.id: _quiz_max_points(session, q) for q in quizzes}

    enrollments = session.exec(
        select(Enrollment).join(Section).where(Section.course_id == course_id)
    ).all()
    student_ids = list(set(e.student_id for e in enrollments))

    grades_by_student: Dict[int, dict] = {}
    totals: Dict[int, float] = {}
    percentages: Dict[int, float] = {}

    for student_id in student_ids:
        submissions = session.exec(
            select(Submission)
            .join(Assignment)
            .where(
                Submission.student_id == student_id,
                Assignment.course_id == course_id,
            )
        ).all()

        grades_dict: dict = {}
        total_points = 0.0
        max_points = 0.0

        for assignment in assignments:
            submission = next(
                (s for s in submissions if s.assignment_id == assignment.id), None
            )
            if submission and submission.grade is not None:
                grades_dict[assignment.id] = submission.grade
                total_points += submission.grade
            else:
                grades_dict[assignment.id] = None
            max_points += assignment.max_points

        for quiz in quizzes:
            key = f"quiz_{quiz.id}"
            qmax = quiz_max[quiz.id]
            best = _best_quiz_attempt(session, quiz.id, student_id)
            if best is not None and qmax > 0:
                quiz_grade = round((best.percentage or 0) / 100 * qmax, 2)
                grades_dict[key] = quiz_grade
                total_points += quiz_grade
            else:
                grades_dict[key] = None
            max_points += qmax

        percentage = (total_points / max_points * 100) if max_points > 0 else 0
        grades_by_student[student_id] = grades_dict
        totals[student_id] = total_points
        percentages[student_id] = round(percentage, 2)

    return list(assignments), [(q, quiz_max[q.id]) for q in quizzes], grades_by_student, totals, percentages


def _attendance_percentage(session: Session, student_id: int, course_id: int) -> Optional[float]:
    """Attendance % for a student across all sections of a course. None if no records."""
    section_ids = session.exec(
        select(Section.id).where(Section.course_id == course_id)
    ).all()
    if not section_ids:
        return None
    records = session.exec(
        select(Attendance).where(
            Attendance.student_id == student_id,
            Attendance.section_id.in_(section_ids),
        )
    ).all()
    if not records:
        return None
    present = sum(1 for r in records if r.status == AttendanceStatus.present)
    late = sum(1 for r in records if r.status == AttendanceStatus.late)
    return round((present + late * 0.5) / len(records) * 100, 2)


def _authorize_gradebook_access(
    course_id: int, current_user: User, session: Session
) -> Course:
    """Shared auth for gradebook endpoints. Returns the course."""
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

    return course


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
    Compute final letter grades from the gradebook (assignments + quizzes)
    and write them to each enrollment in this course's sections.
    Teacher (of this course) and Admin only. Re-publishing overwrites
    previous letters.
    """
    course = _authorize_gradebook_access(course_id, current_user, session)

    assignments, quizzes, _, _, percentages = _compute_scores(session, course_id)
    if not assignments and not quizzes:
        raise HTTPException(status_code=400, detail="No assignments or quizzes in this course yet")

    enrollments = session.exec(
        select(Enrollment).join(Section).where(Section.course_id == course_id)
    ).all()

    scales = session.exec(select(GradingScale)).all()

    policy = session.exec(
        select(AttendancePolicy).where(AttendancePolicy.is_active == True)
    ).first()
    min_attendance = policy.min_percentage if policy else None

    published: Dict[int, str] = {}
    warnings: list = []
    for enrollment in enrollments:
        percentage = percentages.get(enrollment.student_id, 0)
        letter = _percentage_to_letter(percentage, list(scales))
        enrollment.grade = letter
        session.add(enrollment)
        published[enrollment.student_id] = letter
        att = _attendance_percentage(session, enrollment.student_id, course_id)
        if min_attendance is not None and att is not None and att < min_attendance:
            student = session.get(User, enrollment.student_id)
            warnings.append({
                "student_id": enrollment.student_id,
                "student_name": student.full_name if student else "Unknown",
                "attendance_percentage": att,
                "required": min_attendance,
                "message": f"Below minimum attendance ({min_attendance}%)",
            })

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
        "attendance_warnings": warnings,
        "grades": published,
    }
