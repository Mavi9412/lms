"""Shared authorization helpers.

Course ownership rule: a teacher may manage a course's content (lessons,
materials, assignments, quizzes, rubrics, announcements, grades) only if
they teach at least one section of that course. Admins bypass the check.
"""
from fastapi import HTTPException
from sqlmodel import Session, select

from models import Role, Section, User


def teacher_teaches_course(session: Session, teacher_id: int, course_id: int) -> bool:
    """True if the teacher is assigned to any section of the course."""
    return (
        session.exec(
            select(Section).where(
                Section.course_id == course_id,
                Section.teacher_id == teacher_id,
            )
        ).first()
        is not None
    )


def require_course_access(
    session: Session, user: User, course_id: int, action: str = "perform this action"
) -> None:
    """Raise 403 unless the user is an admin or teaches the course."""
    if user.role == Role.admin:
        return
    if user.role != Role.teacher or not teacher_teaches_course(session, user.id, course_id):
        raise HTTPException(
            status_code=403,
            detail=f"Not authorized to {action} for this course",
        )
