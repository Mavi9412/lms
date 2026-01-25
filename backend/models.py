from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum

class Role(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

# --- Academic Hierarchy ---

class Department(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True) # e.g. "Computer Science"
    code: str = Field(index=True, unique=True) # e.g. "CS"
    
    programs: List["Program"] = Relationship(back_populates="department")
    courses: List["Course"] = Relationship(back_populates="department")

class Program(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str # e.g. "BS Computer Science"
    code: str # e.g. "BSCS"
    department_id: int = Field(foreign_key="department.id")
    
    department: Department = Relationship(back_populates="programs")
    students: List["User"] = Relationship(back_populates="program")

class Semester(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str # e.g. "Spring 2026"
    is_active: bool = Field(default=False)
    
    sections: List["Section"] = Relationship(back_populates="semester")

class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    code: str = Field(unique=True) # e.g. "CS-101"
    credit_hours: int = Field(default=3)
    department_id: int = Field(foreign_key="department.id")
    
    department: Department = Relationship(back_populates="courses")
    sections: List["Section"] = Relationship(back_populates="course")
    assignments: List["Assignment"] = Relationship(back_populates="course")

class CourseCreate(SQLModel):
    title: str
    code: str
    credit_hours: int = 3
    department_id: int

class Section(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str # e.g. "Section A"
    course_id: int = Field(foreign_key="course.id")
    semester_id: int = Field(foreign_key="semester.id")
    teacher_id: Optional[int] = Field(default=None, foreign_key="user.id")
    schedule: Optional[str] = None # e.g. "Mon/Wed 10:00 - 11:30"
    
    course: Course = Relationship(back_populates="sections")
    semester: Semester = Relationship(back_populates="sections")
    teacher: Optional["User"] = Relationship(back_populates="teaching_sections")
    enrollments: List["Enrollment"] = Relationship(back_populates="section")

# --- Users & Enrollments ---

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    role: Role = Field(default=Role.student)
    is_active: bool = True
    
    # New Fields
    program_id: Optional[int] = Field(default=None, foreign_key="program.id") # For Students

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    
    program: Optional[Program] = Relationship(back_populates="students")
    
    # Relationships
    teaching_sections: List[Section] = Relationship(back_populates="teacher")
    enrollments: List["Enrollment"] = Relationship(back_populates="student")
    submissions: List["Submission"] = Relationship(back_populates="student")

class UserCreate(UserBase):
    password: str
    program_id: Optional[int] = None

class Enrollment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id")
    section_id: int = Field(foreign_key="section.id")
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    grade: Optional[str] = None # e.g. "A", "B+" (Final grade placeholder)
    
    student: User = Relationship(back_populates="enrollments")
    section: Section = Relationship(back_populates="enrollments")

# --- Assignments & Submissions ---

class Assignment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    due_date: datetime
    max_points: int = 100
    course_id: int = Field(foreign_key="course.id")
    
    course: Course = Relationship(back_populates="assignments")
    submissions: List["Submission"] = Relationship(back_populates="assignment")

class AssignmentCreate(SQLModel):
    title: str
    description: str
    due_date: datetime
    max_points: int = 100
    course_id: int

class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(foreign_key="assignment.id")
    student_id: int = Field(foreign_key="user.id")
    content: str # Taking text or link for simplicity
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    grade: Optional[float] = None
    feedback: Optional[str] = None
    
    assignment: Assignment = Relationship(back_populates="submissions")
    student: User = Relationship(back_populates="submissions")

class SubmissionCreate(SQLModel):
    content: str

class GradeSubmission(SQLModel):
    grade: float
    feedback: Optional[str] = None


# --- Admin & Policies ---

class AttendancePolicy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    min_percentage: float = 75.0
    late_tolerance_minutes: int = 15
    is_active: bool = True

class GradingScale(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    grade_letter: str # e.g. "A"
    min_percentage: float # e.g. 90.0
    gpa_point: float # e.g. 4.0

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    action: str # e.g. "GRADE_CHANGE"
    performed_by: int = Field(foreign_key="user.id")
    target_id: Optional[int] = None # ID of the object changed
    details: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
