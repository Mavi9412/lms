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


# --- Update Attendance Record ---
@router.patch("/{attendance_id}")
def update_attendance(
    attendance_id: int,
    status: AttendanceStatus,
    current_user: User = Depends(get_current_teacher),
    session: Session = Depends(get_session)
):
    """Update an attendance record (teacher must own the section)"""
    # Get attendance record
    attendance = session.get(Attendance, attendance_id)
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Get section and verify teacher owns it
    section = session.get(Section, attendance.section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if section.teacher_id != current_user.id and current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="You can only edit attendance for your own sections")
    
    # Update status
    attendance.status = status
    session.add(attendance)
    session.commit()
    session.refresh(attendance)
    
    return {
        "id": attendance.id,
        "student_id": attendance.student_id,
        "status": attendance.status.value,
        "date": attendance.date.isoformat(),
        "message": "Attendance updated successfully"
    }


# --- Get Attendance Report ---
@router.get("/reports/{section_id}")
def get_attendance_report(
    section_id: int,
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(get_current_teacher),
    session: Session = Depends(get_session)
):
    """Get comprehensive attendance report for a section"""
    # Verify section exists and teacher owns it
    section = session.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if section.teacher_id != current_user.id and current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="You can only view reports for your own sections")
    
    # Get all enrolled students
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.section_id == section_id)
    ).all()
    
    # Build query for attendance records
    attendance_query = select(Attendance).where(Attendance.section_id == section_id)
    
    # Apply date filters if provided
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            attendance_query = attendance_query.where(Attendance.date >= start_dt)
        except:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            attendance_query = attendance_query.where(Attendance.date <= end_dt)
        except:
            pass
    
    all_records = session.exec(attendance_query).all()
    
    # Get unique dates to count total classes
    unique_dates = set(record.date.date() for record in all_records)
    total_classes = len(unique_dates)
    
    # Build report for each student
    students_report = []
    total_present = 0
    total_absent = 0
    total_late = 0
    
    for enrollment in enrollments:
        student = session.get(User, enrollment.student_id)
        if not student:
            continue
        
        # Get this student's attendance records
        student_records = [r for r in all_records if r.student_id == student.id]
        
        present_count = sum(1 for r in student_records if r.status == AttendanceStatus.present)
        absent_count = sum(1 for r in student_records if r.status == AttendanceStatus.absent)
        late_count = sum(1 for r in student_records if r.status == AttendanceStatus.late)
        
        # Calculate percentage (present + late as attended)
        attended = present_count + late_count
        percentage = (attended / total_classes * 100) if total_classes > 0 else 0
        
        total_present += present_count
        total_absent += absent_count
        total_late += late_count
        
        students_report.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "student_email": student.email,
            "total_classes": total_classes,
            "present": present_count,
            "absent": absent_count,
            "late": late_count,
            "attendance_percentage": round(percentage, 2)
        })
    
    # Calculate overall statistics
    total_student_classes = len(enrollments) * total_classes
    avg_attendance = 0
    if total_student_classes > 0:
        avg_attendance = ((total_present + total_late) / total_student_classes * 100)
    
    from models import Course
    course = session.get(Course, section.course_id)
    
    return {
        "section_info": {
            "id": section.id,
            "name": section.name,
            "course_title": course.title if course else "Unknown",
            "course_code": course.code if course else "Unknown",
            "semester": section.semester
        },
        "date_range": {
            "start": start_date,
            "end": end_date,
            "total_classes": total_classes
        },
        "students": students_report,
        "overall_stats": {
            "total_students": len(enrollments),
            "total_classes": total_classes,
            "total_present": total_present,
            "total_absent": total_absent,
            "total_late": total_late,
            "average_attendance": round(avg_attendance, 2)
        }
    }
