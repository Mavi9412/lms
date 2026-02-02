from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import (
    User, Role, Section, Enrollment, Attendance, AttendanceStatus, 
    AttendanceCreate, AttendanceMarkRequest
)
from auth import get_current_user

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"],
)

# Teacher Dependency
def get_current_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized - Teachers only")
    return current_user


# Response models
class StudentInfo(BaseModel):
    id: int
    full_name: str
    email: str

class AttendanceRecordResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    date: str
    status: str
    marked_by: int

class SectionInfo(BaseModel):
    id: int
    name: str
    course_title: str
    course_code: str


# --- Get Teacher's Sections ---
@router.get("/my-sections", response_model=List[SectionInfo])
def get_teacher_sections(
    current_user: User = Depends(get_current_teacher),
    session: Session = Depends(get_session)
):
    """Get all sections assigned to the current teacher"""
    sections = session.exec(
        select(Section).where(Section.teacher_id == current_user.id)
    ).all()
    
    result = []
    for section in sections:
        result.append(SectionInfo(
            id=section.id,
            name=section.name,
            course_title=section.course.title,
            course_code=section.course.code
        ))
    return result


# --- Get Students in Section ---
@router.get("/sections/{section_id}/students", response_model=List[StudentInfo])
def get_section_students(
    section_id: int,
    current_user: User = Depends(get_current_teacher),
    session: Session = Depends(get_session)
):
    """Get all students enrolled in a section"""
    section = session.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Verify teacher owns this section (unless admin)
    if current_user.role != Role.admin and section.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this section")
    
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.section_id == section_id)
    ).all()
    
    students = []
    for enrollment in enrollments:
        student = session.get(User, enrollment.student_id)
        if student:
            students.append(StudentInfo(
                id=student.id,
                full_name=student.full_name,
                email=student.email
            ))
    return students


# --- Mark Attendance ---
@router.post("/sections/{section_id}/mark")
def mark_attendance(
    section_id: int,
    request: AttendanceMarkRequest,
    current_user: User = Depends(get_current_teacher),
    session: Session = Depends(get_session)
):
    """Mark attendance for students in a section"""
    section = session.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Verify teacher owns this section (unless admin)
    if current_user.role != Role.admin and section.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this section")
    
    # Parse date
    try:
        attendance_date = datetime.fromisoformat(request.date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Delete existing attendance for this date/section (to allow updates)
    existing = session.exec(
        select(Attendance)
        .where(Attendance.section_id == section_id)
        .where(Attendance.date == attendance_date)
    ).all()
    for record in existing:
        session.delete(record)
    
    # Create new attendance records
    created = []
    for record in request.records:
        attendance = Attendance(
            section_id=section_id,
            student_id=record.student_id,
            date=attendance_date,
            status=record.status,
            marked_by=current_user.id
        )
        session.add(attendance)
        created.append(attendance)
    
    session.commit()
    
    return {"message": f"Attendance marked for {len(created)} students", "count": len(created)}


# --- Get Attendance Records ---
@router.get("/sections/{section_id}/records", response_model=List[AttendanceRecordResponse])
def get_attendance_records(
    section_id: int,
    date: str = None,
    current_user: User = Depends(get_current_teacher),
    session: Session = Depends(get_session)
):
    """Get attendance records for a section, optionally filtered by date"""
    section = session.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Verify teacher owns this section (unless admin)
    if current_user.role != Role.admin and section.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this section")
    
    query = select(Attendance).where(Attendance.section_id == section_id)
    
    if date:
        try:
            filter_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            query = query.where(Attendance.date == filter_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    records = session.exec(query.order_by(Attendance.date.desc())).all()
    
    result = []
    for record in records:
        student = session.get(User, record.student_id)
        result.append(AttendanceRecordResponse(
            id=record.id,
            student_id=record.student_id,
            student_name=student.full_name if student else "Unknown",
            date=record.date.isoformat(),
            status=record.status.value,
            marked_by=record.marked_by
        ))
    return result


# --- Get Student Attendance Summary ---
@router.get("/students/{student_id}/summary")
def get_student_attendance(
    student_id: int,
    section_id: int = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get attendance summary for a student"""
    # Students can view their own, teachers/admins can view any
    if current_user.role == Role.student and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = select(Attendance).where(Attendance.student_id == student_id)
    if section_id:
        query = query.where(Attendance.section_id == section_id)
    
    records = session.exec(query).all()
    
    total = len(records)
    present = sum(1 for r in records if r.status == AttendanceStatus.present)
    absent = sum(1 for r in records if r.status == AttendanceStatus.absent)
    late = sum(1 for r in records if r.status == AttendanceStatus.late)
    
    percentage = (present + late * 0.5) / total * 100 if total > 0 else 0
    
    return {
        "total_classes": total,
        "present": present,
        "absent": absent,
        "late": late,
        "attendance_percentage": round(percentage, 2)
    }


# --- Get Student's Enrolled Sections ---
@router.get("/my-enrollments")
def get_student_enrollments(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all sections the current student is enrolled in"""
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.student_id == current_user.id)
    ).all()
    
    result = []
    for enrollment in enrollments:
        section = session.get(Section, enrollment.section_id)
        if section:
            result.append({
                "id": section.id,
                "name": section.name,
                "course_title": section.course.title,
                "course_code": section.course.code
            })
    return result


# --- Get Student's Attendance Records ---
@router.get("/my-records")
def get_my_attendance_records(
    section_id: int = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get attendance records for the current student"""
    query = select(Attendance).where(Attendance.student_id == current_user.id)
    if section_id:
        query = query.where(Attendance.section_id == section_id)
    
    records = session.exec(query.order_by(Attendance.date.desc())).all()
    
    result = []
    for record in records:
        section = session.get(Section, record.section_id)
        result.append({
            "id": record.id,
            "date": record.date.isoformat(),
            "status": record.status.value,
            "section_name": section.name if section else "Unknown",
            "course_title": section.course.title if section else "Unknown",
            "course_code": section.course.code if section else "Unknown"
        })
    return result

