# SuperKiwi Time OS

Time Canvas 기반 시간 관리 및 생체신호 측정 데스크탑 애플리케이션 MVP

## 프로젝트 구조

```
superkiwi_ai/
├── frontend/          # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── TimeCanvas/    # Time Canvas UI 컴포넌트
│   │   │   ├── BiometricAgent/ # 생체신호 측정 Agent
│   │   │   ├── Timer/          # Deep Work Timer
│   │   │   └── AIAssistant/    # AI 추천 엔진 UI
│   │   ├── lib/
│   │   │   ├── time/          # 시간 관련 유틸리티
│   │   │   ├── biometric/     # 생체신호 측정 로직
│   │   │   ├── agent/         # 활동 모니터링
│   │   │   └── ai/            # AI 추천 엔진
│   │   └── state/             # Zustand 상태 관리
│   └── package.json
├── backend/           # FastAPI 백엔드
│   ├── app/
│   │   ├── models.py      # 데이터베이스 모델
│   │   ├── schemas.py     # Pydantic 스키마
│   │   ├── database.py    # DB 연결
│   │   └── routers/       # API 라우터
│   ├── main.py
│   └── requirements.txt
├── docker-compose.yml  # PostgreSQL Docker 설정
└── package.json       # 루트 패키지 설정
```

## 주요 기능

### 1. Time Canvas
- 24시간 타임라인 표시
- 블록 타입: Deep Work, Break, Meeting
- Drag & Drop으로 블록 이동 및 크기 조정
- 블록 생성/삭제/편집
- 현재 시간 Now-line 표시
- 블록에 메모/태그 추가

### 2. 생체신호 측정 Agent
- MediaPipe FaceLandmarker 기반 얼굴 감지
- 시선 안정성 측정 (Gaze Stability)
- 깜빡임 감지 (EAR 알고리즘)
- Focus Score 계산 (Face 0.4 + Gaze 0.4 + Blink 0.2)
- 1분 단위 평균 집중도 계산

### 3. Deep Work Timer
- 타이머 시작/일시중지/중단
- Focus Score 실시간 모니터링
- 세션 종료 시 Time Canvas에 자동 블록 생성
- Session Report 생성

### 4. Background Agent
- 브라우저 탭 전환 감지 (Page Visibility API)
- 키보드/마우스 활동량 추적
- Idle time 계산

### 5. AI 추천 엔진 (규칙 기반)
- Focus < 0.3 for 5min → 휴식 제안
- Session > 25min && Focus > 0.7 → Deep Work 연장 제안
- IdleTime > 10min → 작업 복귀 제안

## 기술 스택

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS
- Zustand (상태 관리)
- Framer Motion (애니메이션)
- MediaPipe (@mediapipe/tasks-vision)

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT 인증

## 시작하기

### 1. PostgreSQL Docker 실행

```bash
docker-compose up -d
```

### 2. 백엔드 설정

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# .env 파일 생성
cp .env.example .env
# .env 파일에서 DATABASE_URL과 SECRET_KEY 설정

# 백엔드 실행
uvicorn main:app --reload --port 8000
```

### 3. 프론트엔드 실행

```bash
cd frontend
yarn install
yarn dev
```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### Time Blocks
- `GET /api/timeblocks` - 블록 목록 조회
- `POST /api/timeblocks` - 블록 생성
- `PUT /api/timeblocks/{id}` - 블록 수정
- `DELETE /api/timeblocks/{id}` - 블록 삭제

### Biometric Data
- `POST /api/biometric` - 생체신호 데이터 저장
- `POST /api/biometric/batch` - 배치 저장
- `GET /api/biometric` - 데이터 조회
- `GET /api/biometric/latest` - 최신 데이터

### Sessions
- `GET /api/sessions` - 세션 목록 조회
- `POST /api/sessions` - 세션 생성
- `PUT /api/sessions/{id}` - 세션 수정
- `DELETE /api/sessions/{id}` - 세션 삭제

## 개발 상태

✅ 완료된 기능:
- Time Canvas 기본 UI 및 기능
- 생체신호 측정 Agent (MediaPipe 통합)
- Deep Work Timer
- Background Agent (브라우저 레벨)
- AI 추천 엔진 (규칙 기반)
- 백엔드 API 구조

⏳ 진행 중:
- 프론트엔드와 백엔드 API 연동

## 참고

- 기존 생체신호 측정 코드: https://github.com/IT-ALL-Service/media-pipe-prototype
- MediaPipe 문서: https://developers.google.com/mediapipe
