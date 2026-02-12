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
    description: Optional[str] = None
    code: str = Field(unique=True) # e.g. "CS-101"
    credit_hours: int = Field(default=3)
    department_id: int = Field(foreign_key="department.id")
    
    department: Department = Relationship(back_populates="courses")
    sections: List["Section"] = Relationship(back_populates="course")
    assignments: List["Assignment"] = Relationship(back_populates="course")
    lessons: List["Lesson"] = Relationship(back_populates="course")
    materials: List["CourseMaterial"] = Relationship(back_populates="course")
    quizzes: List["Quiz"] = Relationship(back_populates="course")

class CourseMaterial(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    course_id: int = Field(foreign_key="course.id")
    
    course: Course = Relationship(back_populates="materials")

class Lesson(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    order: int = 0
    course_id: int = Field(foreign_key="course.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    course: Course = Relationship(back_populates="lessons")

class LessonCreate(SQLModel):
    title: str
    content: str
    order: int = 0
    course_id: int

class CourseCreate(SQLModel):
    title: str
    description: Optional[str] = None
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
    content: str # Text content or link
    file_path: Optional[str] = None # File upload path
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

class PasswordResetToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Attendance ---

class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"

class Attendance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    section_id: int = Field(foreign_key="section.id")
    student_id: int = Field(foreign_key="user.id")
    date: datetime
    status: AttendanceStatus = Field(default=AttendanceStatus.present)
    marked_by: int = Field(foreign_key="user.id")  # Teacher who marked
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AttendanceCreate(SQLModel):
    student_id: int
    status: AttendanceStatus = AttendanceStatus.present

class AttendanceMarkRequest(SQLModel):
    date: str  # ISO format date string
    records: List[AttendanceCreate]

# --- Quiz System ---

class QuestionType(str, Enum):
    mcq = "mcq"
    true_false = "true_false"

class Quiz(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    title: str
    description: Optional[str] = None
    time_limit: Optional[int] = None  # in minutes, None = no limit
    max_attempts: int = Field(default=1)
    passing_score: Optional[float] = None  # percentage
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    course: Course = Relationship(back_populates="quizzes")
    questions: List["Question"] = Relationship(back_populates="quiz", cascade_delete=True)
    attempts: List["QuizAttempt"] = Relationship(back_populates="quiz", cascade_delete=True)

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    quiz_id: int = Field(foreign_key="quiz.id", ondelete="CASCADE")
    question_type: QuestionType
    question_text: str
    points: float = Field(default=1.0)
    order: int = Field(default=0)
    
    # For MCQ and True/False
    options: Optional[str] = None  # JSON string of options array
    correct_answer: str  # For MCQ: option index or text, For T/F: "true" or "false"
    
    quiz: Quiz = Relationship(back_populates="questions")
    answers: List["Answer"] = Relationship(back_populates="question", cascade_delete=True)

class QuizAttempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    quiz_id: int = Field(foreign_key="quiz.id", ondelete="CASCADE")
    student_id: int = Field(foreign_key="user.id")
    attempt_number: int = Field(default=1)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None  # calculated score
    max_score: Optional[float] = None
    percentage: Optional[float] = None
    
    quiz: Quiz = Relationship(back_populates="attempts")
    student: User = Relationship()
    answers: List["Answer"] = Relationship(back_populates="attempt", cascade_delete=True)

class Answer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    attempt_id: int = Field(foreign_key="quizattempt.id", ondelete="CASCADE")
    question_id: int = Field(foreign_key="question.id", ondelete="CASCADE")
    answer_text: str  # Student's answer
    is_correct: Optional[bool] = None
    points_earned: Optional[float] = None
    
    attempt: QuizAttempt = Relationship(back_populates="answers")
    question: Question = Relationship(back_populates="answers")

# Pydantic models for API
class QuestionCreate(SQLModel):
    question_type: QuestionType
    question_text: str
    points: float = 1.0
    order: int = 0
    options: Optional[List[str]] = None
    correct_answer: str

class QuizCreate(SQLModel):
    course_id: int
    title: str
    description: Optional[str] = None
    time_limit: Optional[int] = None
    max_attempts: int = 1
    passing_score: Optional[float] = None
    available_from: Optional[str] = None
    available_until: Optional[str] = None
    questions: List[QuestionCreate] = []

class QuizSubmission(SQLModel):
    answers: dict  # question_id -> answer_text

# --- Rubric System ---

class Rubric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    course_id: Optional[int] = Field(default=None, foreign_key="course.id")
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    criteria: List["RubricCriterion"] = Relationship(back_populates="rubric", cascade_delete=True)

class RubricCriterion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rubric_id: int = Field(foreign_key="rubric.id", ondelete="CASCADE")
    name: str
    description: Optional[str] = None
    max_points: float
    order: int = Field(default=0)
    
    rubric: Rubric = Relationship(back_populates="criteria")

class RubricCriterionCreate(SQLModel):
    name: str
    description: Optional[str] = None
    max_points: float
    order: int = 0

class RubricCreate(SQLModel):
    title: str
    description: Optional[str] = None
    course_id: Optional[int] = None
    criteria: List[RubricCriterionCreate] = []

# --- Announcements ---

class Announcement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    title: str
    content: str  # Can be HTML
    created_by: int = Field(foreign_key="user.id")
    is_pinned: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    course: Course = Relationship()
    creator: User = Relationship()

class AnnouncementCreate(SQLModel):
    course_id: int
    title: str
    content: str
    is_pinned: bool = False

# --- Notifications ---

class NotificationType(str, Enum):
    assignment_created = "assignment_created"
    quiz_created = "quiz_created"
    assignment_graded = "assignment_graded"
    quiz_graded = "quiz_graded"
    announcement_posted = "announcement_posted"
    discussion_reply = "discussion_reply"

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    notification_type: NotificationType
    title: str
    content: str
    link: Optional[str] = None  # URL to navigate to
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: User = Relationship()

class NotificationCreate(SQLModel):
    user_id: int
    notification_type: NotificationType
    title: str
    content: str
    link: Optional[str] = None

# --- Discussion Forums ---

class DiscussionThread(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    title: str
    content: str
    created_by: int = Field(foreign_key="user.id")
    is_pinned: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    course: Course = Relationship()
    creator: User = Relationship()
    replies: List["ThreadReply"] = Relationship(back_populates="thread", cascade_delete=True)

class ThreadReply(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    thread_id: int = Field(foreign_key="discussionthread.id", ondelete="CASCADE")
    content: str
    created_by: int = Field(foreign_key="user.id")
    upvotes: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    thread: DiscussionThread = Relationship(back_populates="replies")
    creator: User = Relationship()

class DiscussionThreadCreate(SQLModel):
    course_id: int
    title: str
    content: str

class ThreadReplyCreate(SQLModel):
    thread_id: int
    content: str

