from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import User, Role, Rubric, RubricCriterion, RubricCreate, RubricCriterionCreate
from auth import get_current_user

router = APIRouter(
    prefix="/rubrics",
    tags=["rubrics"],
)


@router.post("/", response_model=Rubric)
def create_rubric(
    rubric_data: RubricCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new rubric (Teacher/Admin only)"""
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    rubric = Rubric(
        title=rubric_data.title,
        description=rubric_data.description,
        course_id=rubric_data.course_id,
        created_by=current_user.id
    )
    session.add(rubric)
    session.commit()
    session.refresh(rubric)
    
    # Add criteria
    for criterion_data in rubric_data.criteria:
        criterion = RubricCriterion(
            rubric_id=rubric.id,
            name=criterion_data.name,
            description=criterion_data.description,
            max_points=criterion_data.max_points,
            order=criterion_data.order
        )
        session.add(criterion)
    
    session.commit()
    session.refresh(rubric)
    
    return rubric


@router.get("/course/{course_id}")
def get_course_rubrics(
    course_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all rubrics for a course"""
    rubrics = session.exec(
        select(Rubric).where(
            (Rubric.course_id == course_id) | (Rubric.course_id == None)
        ).order_by(Rubric.created_at.desc())
    ).all()
    
    return rubrics


@router.get("/{rubric_id}")
def get_rubric(
    rubric_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get rubric details with criteria"""
    rubric = session.get(Rubric, rubric_id)
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    
    criteria = session.exec(
        select(RubricCriterion).where(
            RubricCriterion.rubric_id == rubric_id
        ).order_by(RubricCriterion.order)
    ).all()
    
    return {
        **rubric.model_dump(),
        "criteria": criteria
    }


@router.delete("/{rubric_id}")
def delete_rubric(
    rubric_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a rubric (Teacher/Admin only)"""
    if current_user.role not in [Role.teacher, Role.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    rubric = session.get(Rubric, rubric_id)
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    
    session.delete(rubric)
    session.commit()
    
    return {"message": "Rubric deleted successfully"}
