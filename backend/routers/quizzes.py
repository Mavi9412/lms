from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import (
    User, Role, Course, Quiz, Question, QuizAttempt, Answer,
    QuizCreate, QuestionCreate, QuizSubmission, QuestionType,
    NotificationType, utcnow, ensure_aware
)
from auth import get_current_user
from permissions import require_course_access, require_enrollment, enrolled_student_ids
from routers.notifications import create_notification
from datetime import datetime
import json

router = APIRouter(
    prefix="/quizzes",
    tags=["quizzes"],
)


# --- Quiz CRUD ---

@router.post("/", response_model=Quiz)
def create_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new quiz (course teacher/Admin only)"""
    require_course_access(session, current_user, quiz_data.course_id, "create quizzes for this course")
    
    # Create quiz
    quiz = Quiz(
        course_id=quiz_data.course_id,
        title=quiz_data.title,
        description=quiz_data.description,
        time_limit=quiz_data.time_limit,
        max_attempts=quiz_data.max_attempts,
        passing_score=quiz_data.passing_score,
        available_from=ensure_aware(datetime.fromisoformat(quiz_data.available_from)) if quiz_data.available_from else None,
        available_until=ensure_aware(datetime.fromisoformat(quiz_data.available_until)) if quiz_data.available_until else None,
        created_by=current_user.id
    )
    session.add(quiz)
    session.commit()
    session.refresh(quiz)
    
    # Create questions
    for q_data in quiz_data.questions:
        question = Question(
            quiz_id=quiz.id,
            question_type=q_data.question_type,
            question_text=q_data.question_text,
            points=q_data.points,
            order=q_data.order,
            options=json.dumps(q_data.options) if q_data.options else None,
            correct_answer=q_data.correct_answer
        )
        session.add(question)
    
    session.commit()
    session.refresh(quiz)

    for sid in enrolled_student_ids(session, quiz.course_id):
        create_notification(
            session, sid, NotificationType.quiz_created,
            f"New quiz: {quiz.title}",
            f"'{quiz.title}' is now available.",
            link=f"/courses/{quiz.course_id}",
        )

    session.refresh(quiz)
    return quiz


@router.get("/course/{course_id}")
def get_course_quizzes(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all quizzes for a course"""
    quizzes = session.exec(
        select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.created_at.desc())
    ).all()
    
    return quizzes


@router.get("/{quiz_id}")
def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get quiz details with questions"""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get questions
    questions = session.exec(
        select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order)
    ).all()
    
    # For students, don't include correct answers
    if current_user.role == Role.student:
        questions_data = []
        for q in questions:
            q_dict = q.model_dump()
            q_dict.pop('correct_answer', None)
            if q.options:
                q_dict['options'] = json.loads(q.options)
            questions_data.append(q_dict)
        
        return {
            **quiz.model_dump(),
            "questions": questions_data
        }
    
    # For teachers/admins, include everything
    questions_data = []
    for q in questions:
        q_dict = q.model_dump()
        if q.options:
            q_dict['options'] = json.loads(q.options)
        questions_data.append(q_dict)
    
    return {
        **quiz.model_dump(),
        "questions": questions_data
    }


@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a quiz (course teacher/Admin only)"""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    require_course_access(session, current_user, quiz.course_id, "delete quizzes for this course")
    
    session.delete(quiz)
    session.commit()
    
    return {"message": "Quiz deleted successfully"}


# --- Quiz Taking ---

@router.post("/{quiz_id}/start")
def start_quiz_attempt(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Start a new quiz attempt (Student only)"""
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students can take quizzes")
    
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    require_enrollment(session, current_user.id, quiz.course_id)

    # Check availability
    now = utcnow()
    if quiz.available_from and now < ensure_aware(quiz.available_from):
        raise HTTPException(status_code=400, detail="Quiz not yet available")
    if quiz.available_until and now > ensure_aware(quiz.available_until):
        raise HTTPException(status_code=400, detail="Quiz no longer available")
    
    # Resume: if the student has an unfinished attempt (e.g. lost connection),
    # hand it back instead of burning a new attempt
    in_progress = session.exec(
        select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.submitted_at == None,  # noqa: E711
        )
    ).first()
    if in_progress:
        return in_progress

    # Check max attempts (only submitted attempts count)
    existing_attempts = session.exec(
        select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.submitted_at != None,  # noqa: E711
        )
    ).all()

    if len(existing_attempts) >= quiz.max_attempts:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum attempts ({quiz.max_attempts}) reached"
        )

    # Create new attempt
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
        attempt_number=len(existing_attempts) + 1
    )
    session.add(attempt)
    session.commit()
    session.refresh(attempt)
    
    return attempt


@router.post("/{quiz_id}/submit/{attempt_id}")
def submit_quiz(
    quiz_id: int,
    attempt_id: int,
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Submit quiz answers and get auto-graded results"""
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students can submit quizzes")
    
    # Get attempt
    attempt = session.get(QuizAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your attempt")
    
    if attempt.submitted_at:
        raise HTTPException(status_code=400, detail="Quiz already submitted")
    
    # Get quiz and questions
    quiz = session.get(Quiz, quiz_id)
    questions = session.exec(
        select(Question).where(Question.quiz_id == quiz_id)
    ).all()
    
    # Auto-grade
    total_score = 0.0
    max_score = 0.0
    
    for question in questions:
        max_score += question.points
        
        # Get student's answer
        answer_text = submission.answers.get(str(question.id), "")
        
        # Check correctness
        is_correct = False
        points_earned = 0.0
        
        if question.question_type == QuestionType.short_answer:
            # Manual grading: stored ungraded; teacher grades later
            is_correct = None
            points_earned = None
            attempt.needs_grading = True
        else:
            if question.question_type == QuestionType.true_false:
                is_correct = (question.correct_answer is not None
                              and answer_text.lower() == question.correct_answer.lower())
            elif question.question_type == QuestionType.mcq:
                is_correct = answer_text == question.correct_answer

            if is_correct:
                points_earned = question.points
                total_score += points_earned

        # Save answer
        answer = Answer(
            attempt_id=attempt_id,
            question_id=question.id,
            answer_text=answer_text,
            is_correct=is_correct,
            points_earned=points_earned
        )
        session.add(answer)
    
    # Update attempt
    attempt.submitted_at = utcnow()
    attempt.score = total_score
    attempt.max_score = max_score
    attempt.percentage = (total_score / max_score * 100) if max_score > 0 else 0
    
    session.add(attempt)
    session.commit()
    session.refresh(attempt)

    create_notification(
        session, current_user.id, NotificationType.quiz_graded,
        f"Quiz submitted: {quiz.title}",
        f"You scored {attempt.score}/{attempt.max_score} on '{quiz.title}'."
        + (" Some answers need manual grading." if attempt.needs_grading else ""),
        link=f"/courses/{quiz.course_id}",
    )

    return {
        "attempt_id": attempt.id,
        "score": attempt.score,
        "max_score": attempt.max_score,
        "percentage": attempt.percentage,
        "needs_grading": attempt.needs_grading,
        "passed": attempt.percentage >= quiz.passing_score if quiz.passing_score else None
    }


@router.get("/{quiz_id}/attempts")
def get_quiz_attempts(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all attempts for a quiz (student sees own, teacher sees all)"""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if current_user.role in [Role.teacher, Role.admin]:
        require_course_access(session, current_user, quiz.course_id, "view attempts for this course")

    if current_user.role == Role.student:
        # Student sees only their attempts
        attempts = session.exec(
            select(QuizAttempt).where(
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.student_id == current_user.id
            ).order_by(QuizAttempt.started_at.desc())
        ).all()
    else:
        # Teacher/Admin sees all attempts
        attempts = session.exec(
            select(QuizAttempt).where(
                QuizAttempt.quiz_id == quiz_id
            ).order_by(QuizAttempt.started_at.desc())
        ).all()
    
    return attempts


@router.get("/attempt/{attempt_id}/results")
def get_attempt_results(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get detailed results for a specific attempt"""
    attempt = session.get(QuizAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Authorization check
    if current_user.role == Role.student and attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get answers with questions
    answers = session.exec(
        select(Answer).where(Answer.attempt_id == attempt_id)
    ).all()
    
    results = []
    for answer in answers:
        question = session.get(Question, answer.question_id)
        result = {
            "question_id": question.id,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "points": question.points,
            "student_answer": answer.answer_text,
            "correct_answer": question.correct_answer,
            "is_correct": answer.is_correct,
            "points_earned": answer.points_earned
        }
        
        if question.options:
            result["options"] = json.loads(question.options)
        
        results.append(result)
    
    return {
        "attempt": attempt,
        "results": results
    }


# --- Manual grading for short-answer questions ---

@router.get("/{quiz_id}/needs-grading")
def attempts_needing_grading(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Attempts with short answers awaiting manual grading (course teacher/admin)."""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    require_course_access(session, current_user, quiz.course_id, "grade quizzes for this course")
    attempts = session.exec(
        select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.needs_grading == True,  # noqa: E711
        )
    ).all()
    result = []
    for attempt in attempts:
        student = session.get(User, attempt.student_id)
        answers = session.exec(
            select(Answer).where(
                Answer.attempt_id == attempt.id,
                Answer.points_earned == None,  # noqa: E711
            )
        ).all()
        result.append({
            "attempt_id": attempt.id,
            "student_id": attempt.student_id,
            "student_name": student.full_name if student else "Unknown",
            "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            "ungraded_answers": [
                {
                    "answer_id": a.id,
                    "question_id": a.question_id,
                    "question_text": (session.get(Question, a.question_id).question_text
                                      if session.get(Question, a.question_id) else ""),
                    "answer_text": a.answer_text,
                    "max_points": (session.get(Question, a.question_id).points
                                   if session.get(Question, a.question_id) else 0),
                }
                for a in answers
            ],
        })
    return result


@router.post("/attempts/{attempt_id}/grade-answer")
def grade_short_answer(
    attempt_id: int,
    grade_data: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Manually grade one short-answer response. Body: {question_id, points_earned}."""
    attempt = session.get(QuizAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    quiz = session.get(Quiz, attempt.quiz_id)
    require_course_access(session, current_user, quiz.course_id if quiz else 0, "grade quizzes for this course")

    question_id = grade_data.get("question_id")
    points = grade_data.get("points_earned")
    answer = session.exec(
        select(Answer).where(Answer.attempt_id == attempt_id, Answer.question_id == question_id)
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    question = session.get(Question, question_id)
    max_pts = question.points if question else 0
    if points is None or points < 0 or points > max_pts:
        raise HTTPException(status_code=400, detail=f"Points must be between 0 and {max_pts}")

    answer.points_earned = float(points)
    answer.is_correct = float(points) >= max_pts
    session.add(answer)

    # Recompute attempt totals from all graded answers
    answers = session.exec(select(Answer).where(Answer.attempt_id == attempt_id)).all()
    attempt.score = sum(a.points_earned or 0 for a in answers)
    attempt.percentage = (attempt.score / attempt.max_score * 100) if attempt.max_score else 0
    attempt.needs_grading = any(a.points_earned is None for a in answers)
    session.add(attempt)
    session.commit()
    session.refresh(attempt)

    create_notification(
        session, attempt.student_id, NotificationType.quiz_graded,
        f"Quiz graded: {quiz.title if quiz else ''}",
        f"Your quiz has been fully graded: {attempt.score}/{attempt.max_score}.",
        link=f"/courses/{quiz.course_id if quiz else ''}",
    )
    return {
        "attempt_id": attempt.id,
        "score": attempt.score,
        "max_score": attempt.max_score,
        "percentage": attempt.percentage,
        "needs_grading": attempt.needs_grading,
    }
