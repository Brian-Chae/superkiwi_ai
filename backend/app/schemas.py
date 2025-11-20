from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from typing import Any

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# TimeBlock Schemas
class TimeBlockBase(BaseModel):
    type: str  # 'deepwork', 'break', 'meeting'
    start: datetime
    end: datetime
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class TimeBlockCreate(TimeBlockBase):
    pass

class TimeBlockUpdate(BaseModel):
    type: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class TimeBlockResponse(TimeBlockBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# BiometricData Schemas
class BiometricDataBase(BaseModel):
    face_detected: bool
    gaze_stability: Optional[float] = None
    blink_rate: Optional[float] = None
    eye_aspect_ratio: Optional[float] = None
    focus_score: float
    heart_rate: Optional[float] = None
    hrv_sdnn: Optional[float] = None
    hrv_rmssd: Optional[float] = None
    hrv_pnn50: Optional[float] = None
    raw_data: Optional[dict[str, Any]] = None

class BiometricDataCreate(BiometricDataBase):
    pass

class BiometricDataResponse(BiometricDataBase):
    id: int
    user_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Session Schemas
class SessionBase(BaseModel):
    session_type: str = "deepwork"
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    avg_focus_score: Optional[float] = None
    max_focus_score: Optional[float] = None
    min_focus_score: Optional[float] = None
    summary: Optional[dict[str, Any]] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    avg_focus_score: Optional[float] = None
    max_focus_score: Optional[float] = None
    min_focus_score: Optional[float] = None
    summary: Optional[dict[str, Any]] = None

class SessionResponse(SessionBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

