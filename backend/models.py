from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from enum import Enum

class Role(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    role: Role = Field(default=Role.student)
    is_active: bool = True

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str

class UserCreate(UserBase):
    password: str

class CourseBase(SQLModel):
    title: str = Field(index=True)
    description: str

class Course(CourseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CourseCreate(CourseBase):
    pass
