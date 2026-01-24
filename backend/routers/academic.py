from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Program

router = APIRouter(
    prefix="/academic",
    tags=["academic"],
)

@router.get("/programs", response_model=List[Program])
def read_programs(session: Session = Depends(get_session)):
    programs = session.exec(select(Program)).all()
    return programs
