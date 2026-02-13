# Batch Management Endpoints - Insert after Programs section

# Batches
@router.get("/batches", response_model=List[Batch])
def get_all_batches(
    program_id: Optional[int] = None,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Get all batches, optionally filtered by program"""
    from sqlmodel import select
    query = select(Batch)
    if program_id:
        query = query.where(Batch.program_id == program_id)
    batches = session.exec(query).all()
    return batches

@router.get("/batches/{batch_id}", response_model=Batch)
def get_batch(
    batch_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Get single batch details"""
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@router.post("/batches", response_model=Batch)
def create_batch(
    batch_data: BatchCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Create a new batch"""
    batch = Batch(**batch_data.model_dump())
    session.add(batch)
    session.commit()
    session.refresh(batch)
    
    # Audit Log
    log = AuditLog(
        action="CREATE_BATCH",
        performed_by=admin.id,
        target_id=batch.id,
        details=f"Created batch {batch.name}"
    )
    session.add(log)
    session.commit()
    
    return batch

@router.patch("/batches/{batch_id}", response_model=Batch)
def update_batch(
    batch_id: int,
    batch_data: BatchUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Update batch details"""
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Update fields
    update_data = batch_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(batch, key, value)
    
    session.add(batch)
    session.commit()
    session.refresh(batch)
    
    # Audit Log
    log = AuditLog(
        action="UPDATE_BATCH",
        performed_by=admin.id,
        target_id=batch_id,
        details=f"Updated batch {batch.name}"
    )
    session.add(log)
    session.commit()
    
    return batch

@router.patch("/batches/{batch_id}/toggle-active")
def toggle_batch_active(
    batch_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Toggle batch active/inactive status"""
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch.is_active = not batch.is_active
    session.add(batch)
    session.commit()
    
    # Audit Log
    action = "ACTIVATE_BATCH" if batch.is_active else "DEACTIVATE_BATCH"
    log = AuditLog(
        action=action,
        performed_by=admin.id,
        target_id=batch_id,
        details=f"{'Activated' if batch.is_active else 'Deactivated'} batch {batch.name}"
    )
    session.add(log)
    session.commit()
    
    return {"message": f"Batch {'activated' if batch.is_active else 'deactivated'}", "is_active": batch.is_active}

@router.delete("/batches/{batch_id}")
def delete_batch(
    batch_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Delete a batch"""
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Check if batch has students
    if batch.students:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete batch: {len(batch.students)} students are assigned to this batch"
        )
    
    name = batch.name
    session.delete(batch)
    session.commit()
    
    # Audit Log
    log = AuditLog(
        action="DELETE_BATCH",
        performed_by=admin.id,
        target_id=batch_id,
        details=f"Deleted batch {name}"
    )
    session.add(log)
    session.commit()
    
    return {"message": "Deleted"}

@router.get("/batches/{batch_id}/students", response_model=List[User])
def get_batch_students(
    batch_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin)
):
    """Get all students in a batch"""
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch.students
