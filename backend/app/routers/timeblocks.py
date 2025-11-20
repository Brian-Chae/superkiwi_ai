from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, TimeBlock
from app.schemas import TimeBlockCreate, TimeBlockUpdate, TimeBlockResponse
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=TimeBlockResponse)
async def create_timeblock(
    timeblock: TimeBlockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_timeblock = TimeBlock(
        user_id=current_user.id,
        **timeblock.model_dump()
    )
    db.add(db_timeblock)
    db.commit()
    db.refresh(db_timeblock)
    return db_timeblock

@router.get("/", response_model=List[TimeBlockResponse])
async def get_timeblocks(
    start_date: datetime = None,
    end_date: datetime = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TimeBlock).filter(TimeBlock.user_id == current_user.id)
    
    if start_date:
        query = query.filter(TimeBlock.start >= start_date)
    if end_date:
        query = query.filter(TimeBlock.end <= end_date)
    
    return query.order_by(TimeBlock.start).all()

@router.get("/{timeblock_id}", response_model=TimeBlockResponse)
async def get_timeblock(
    timeblock_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    timeblock = db.query(TimeBlock).filter(
        TimeBlock.id == timeblock_id,
        TimeBlock.user_id == current_user.id
    ).first()
    if not timeblock:
        raise HTTPException(status_code=404, detail="TimeBlock not found")
    return timeblock

@router.put("/{timeblock_id}", response_model=TimeBlockResponse)
async def update_timeblock(
    timeblock_id: int,
    timeblock_update: TimeBlockUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    timeblock = db.query(TimeBlock).filter(
        TimeBlock.id == timeblock_id,
        TimeBlock.user_id == current_user.id
    ).first()
    if not timeblock:
        raise HTTPException(status_code=404, detail="TimeBlock not found")
    
    update_data = timeblock_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(timeblock, field, value)
    
    db.commit()
    db.refresh(timeblock)
    return timeblock

@router.delete("/{timeblock_id}")
async def delete_timeblock(
    timeblock_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    timeblock = db.query(TimeBlock).filter(
        TimeBlock.id == timeblock_id,
        TimeBlock.user_id == current_user.id
    ).first()
    if not timeblock:
        raise HTTPException(status_code=404, detail="TimeBlock not found")
    
    db.delete(timeblock)
    db.commit()
    return {"message": "TimeBlock deleted successfully"}

