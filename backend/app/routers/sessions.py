from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, Session as SessionModel
from app.schemas import SessionCreate, SessionUpdate, SessionResponse
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=SessionResponse)
async def create_session(
    session: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = SessionModel(
        user_id=current_user.id,
        **session.model_dump()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=List[SessionResponse])
async def get_sessions(
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SessionModel).filter(SessionModel.user_id == current_user.id)
    
    if start_date:
        query = query.filter(SessionModel.start_time >= start_date)
    if end_date:
        query = query.filter(SessionModel.start_time <= end_date)
    
    return query.order_by(SessionModel.start_time.desc()).limit(limit).all()

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int,
    session_update: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    update_data = session_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}")
async def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Session deleted successfully"}

