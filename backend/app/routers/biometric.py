from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, BiometricData
from app.schemas import BiometricDataCreate, BiometricDataResponse
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=BiometricDataResponse)
async def create_biometric_data(
    data: BiometricDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_data = BiometricData(
        user_id=current_user.id,
        **data.model_dump()
    )
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@router.post("/batch", response_model=List[BiometricDataResponse])
async def create_biometric_data_batch(
    data_list: List[BiometricDataCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_data_list = [
        BiometricData(user_id=current_user.id, **data.model_dump())
        for data in data_list
    ]
    db.add_all(db_data_list)
    db.commit()
    for db_data in db_data_list:
        db.refresh(db_data)
    return db_data_list

@router.get("/", response_model=List[BiometricDataResponse])
async def get_biometric_data(
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(BiometricData).filter(BiometricData.user_id == current_user.id)
    
    if start_date:
        query = query.filter(BiometricData.timestamp >= start_date)
    if end_date:
        query = query.filter(BiometricData.timestamp <= end_date)
    
    return query.order_by(BiometricData.timestamp.desc()).limit(limit).all()

@router.get("/latest", response_model=BiometricDataResponse)
async def get_latest_biometric_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = db.query(BiometricData).filter(
        BiometricData.user_id == current_user.id
    ).order_by(BiometricData.timestamp.desc()).first()
    
    if not data:
        raise HTTPException(status_code=404, detail="No biometric data found")
    return data

