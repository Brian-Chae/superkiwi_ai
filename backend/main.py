from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, timeblocks, biometric, sessions

# 데이터베이스 테이블 생성
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="SuperKiwi Time OS API",
    description="Time Canvas and Biometric Data Management API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(timeblocks.router, prefix="/api/timeblocks", tags=["timeblocks"])
app.include_router(biometric.router, prefix="/api/biometric", tags=["biometric"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])

@app.get("/")
async def root():
    return {"message": "SuperKiwi Time OS API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

