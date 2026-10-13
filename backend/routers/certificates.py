"""Course completion certificates with public verification."""
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import User, Role, Certificate, Lesson, LessonProgress, Enrollment, Section, Course
from auth import get_current_user
from permissions import require_course_access

router = APIRouter(
    prefix="/certificates",
    tags=["certificates"],
)


def _gen_code(session: Session) -> str:
    for _ in range(10):
        code = secrets.token_urlsafe(9).replace("-", "").replace("_", "")[:10].upper()
        if not session.exec(select(Certificate).where(Certificate.verification_code == code)).first():
            return code
    raise HTTPException(status_code=500, detail="Could not generate verification code")


def _progress_pct(session: Session, student_id: int, course_id: int) -> float:
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id)).all()
    if not lessons:
        return 100.0
    done = session.exec(
        select(LessonProgress).where(
            LessonProgress.student_id == student_id,
            LessonProgress.lesson_id.in_([l.id for l in lessons]),
        )
    ).all()
    return len(done) / len(lessons) * 100


@router.post("/issue")
def issue_certificate(
    data: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Issue a certificate. Body: {student_id, course_id}. Requires 100% lesson progress."""
    student_id = data.get("student_id")
    course_id = data.get("course_id")
    require_course_access(session, current_user, course_id, "issue certificates for this course")

    student = session.get(User, student_id)
    if not student or student.role != Role.student:
        raise HTTPException(status_code=404, detail="Student not found")
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrolled = session.exec(
        select(Enrollment).join(Section).where(
            Enrollment.student_id == student_id, Section.course_id == course_id
        )
    ).first()
    if not enrolled:
        raise HTTPException(status_code=400, detail="Student is not enrolled in this course")

    existing = session.exec(
        select(Certificate).where(
            Certificate.student_id == student_id, Certificate.course_id == course_id
        )
    ).first()
    if existing:
        return {"ok": True, "already_issued": True, "verification_code": existing.verification_code}

    pct = _progress_pct(session, student_id, course_id)
    if pct < 100:
        raise HTTPException(
            status_code=400,
            detail=f"Student has completed {pct:.0f}% of lessons — 100% required for a certificate",
        )

    cert = Certificate(
        student_id=student_id,
        course_id=course_id,
        verification_code=_gen_code(session),
        grade=enrolled.grade,
        issued_by=current_user.id,
    )
    session.add(cert)
    session.commit()
    session.refresh(cert)
    return {
        "ok": True,
        "verification_code": cert.verification_code,
        "student_name": student.full_name,
        "course_title": course.title,
        "grade": cert.grade,
        "issued_at": cert.issued_at.isoformat(),
    }


@router.get("/my")
def my_certificates(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Student's own certificates."""
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Only students have certificates")
    certs = session.exec(
        select(Certificate).where(Certificate.student_id == current_user.id)
    ).all()
    result = []
    for c in certs:
        course = session.get(Course, c.course_id)
        result.append({
            "verification_code": c.verification_code,
            "course_title": course.title if course else "Unknown",
            "grade": c.grade,
            "issued_at": c.issued_at.isoformat(),
        })
    return result


@router.get("/course/{course_id}")
def course_certificates(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Teacher/admin: all certificates issued for a course."""
    require_course_access(session, current_user, course_id, "view certificates for this course")
    certs = session.exec(select(Certificate).where(Certificate.course_id == course_id)).all()
    result = []
    for c in certs:
        student = session.get(User, c.student_id)
        result.append({
            "verification_code": c.verification_code,
            "student_name": student.full_name if student else "Unknown",
            "grade": c.grade,
            "issued_at": c.issued_at.isoformat(),
        })
    return result


@router.get("/verify/{code}")
def verify_certificate(code: str, session: Session = Depends(get_session)):
    """Public certificate verification — no login required."""
    cert = session.exec(
        select(Certificate).where(Certificate.verification_code == code.upper())
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    student = session.get(User, cert.student_id)
    course = session.get(Course, cert.course_id)
    return {
        "valid": True,
        "verification_code": cert.verification_code,
        "student_name": student.full_name if student else "Unknown",
        "course_title": course.title if course else "Unknown",
        "grade": cert.grade,
        "issued_at": cert.issued_at.isoformat(),
    }
