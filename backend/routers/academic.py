from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Program, Department, Section, Semester

router = APIRouter(
    prefix="/academic",
    tags=["academic"],
)

@router.get("/programs", response_model=List[Program])
def read_programs(session: Session = Depends(get_session)):
    programs = session.exec(select(Program)).all()
    return programs

@router.get("/departments", response_model=List[Department])
def read_departments(session: Session = Depends(get_session)):
    depts = session.exec(select(Department)).all()
    return depts

@router.get("/sections", response_model=List[Section])
def read_sections(session: Session = Depends(get_session)):
    sections = session.exec(select(Section)).all()
    return sections

@router.get("/semesters", response_model=List[Semester])
def read_semesters(session: Session = Depends(get_session)):
    semesters = session.exec(select(Semester)).all()
    return semesters
