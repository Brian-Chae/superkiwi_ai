from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    time_blocks = relationship("TimeBlock", back_populates="user", cascade="all, delete-orphan")
    biometric_data = relationship("BiometricData", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class TimeBlock(Base):
    __tablename__ = "time_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # 'deepwork', 'break', 'meeting'
    start = Column(DateTime(timezone=True), nullable=False)
    end = Column(DateTime(timezone=True), nullable=False)
    title = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)  # Array of strings
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="time_blocks")

class BiometricData(Base):
    __tablename__ = "biometric_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Face Detection
    face_detected = Column(Boolean, nullable=False)
    gaze_stability = Column(Float, nullable=True)  # 0-1
    blink_rate = Column(Float, nullable=True)  # blinks per minute
    eye_aspect_ratio = Column(Float, nullable=True)  # EAR value
    
    # Focus Score
    focus_score = Column(Float, nullable=False)  # 0-1
    
    # Optional: rPPG data
    heart_rate = Column(Float, nullable=True)  # BPM
    hrv_sdnn = Column(Float, nullable=True)
    hrv_rmssd = Column(Float, nullable=True)
    hrv_pnn50 = Column(Float, nullable=True)
    
    # Raw data (optional)
    raw_data = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="biometric_data")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Session metrics
    duration_minutes = Column(Float, nullable=True)
    avg_focus_score = Column(Float, nullable=True)
    max_focus_score = Column(Float, nullable=True)
    min_focus_score = Column(Float, nullable=True)
    
    # Session type
    session_type = Column(String, nullable=False, default="deepwork")  # 'deepwork', 'break', etc.
    
    # Summary data
    summary = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sessions")

