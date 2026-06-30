# receipt_kic — 영수증 지출관리 앱

영수증 사진을 올리면 Upstage Document AI IE API로 내용을 자동 추출하고, 지출을 관리하는 웹 앱.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | FastAPI (Python) |
| 프론트엔드 | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 |
| DB | Neon PostgreSQL (psycopg2-binary) |
| 이미지 저장 | Vercel Blob (Public 스토어: receipt-kic-blob) |
| OCR | Upstage Document AI IE API |
| 배포 | Vercel (monorepo: 프론트 정적 + Python 서버리스) |

## 저장소 / 배포 정보

- **GitHub**: `https://github.com/rulrura-knou/recipt-kic.git` (branch: `master`)
- **Vercel 프로젝트**: `receipt-kic` (팀: `rulrura-s-projects`)
- **프로덕션 URL**: `https://receipt-kic.vercel.app`
- **Vercel 배포 명령**: `vercel deploy --prod --yes`

## 프로젝트 구조

```
receipt_kic/
├── api/
│   └── index.py          # Vercel 서버리스 진입점 (라우터에 /api prefix 추가)
├── app/
│   ├── config.py         # pydantic-settings 환경변수
│   ├── main.py           # 로컬 개발 진입점 (StaticFiles 마운트 포함)
│   ├── models/
│   │   └── expense.py    # Pydantic 모델
│   ├── routers/
│   │   ├── expenses.py   # CRUD + summary + 이미지 프록시
│   │   └── receipts.py   # 영수증 업로드 + Blob 저장
│   └── services/
│       ├── ocr.py        # Upstage IE API 호출
│       └── storage.py    # PostgreSQL CRUD (psycopg2)
├── frontend/
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ExpenseDetailPage.tsx
│   │   │   └── UploadPage.tsx
│   │   └── types/expense.ts
│   └── vite.config.ts
├── vercel.json
└── requirements.txt
```

## 환경변수

### 필수 (로컬 `.env` / Vercel Environment Variables 모두 설정)

| 변수 | 설명 |
|------|------|
| `UPSTAGE_API_KEY` | Upstage Document AI API 키 |
| `DATABASE_URL` | Neon PostgreSQL 연결 문자열 (pooled, `?sslmode=require`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 스토어 토큰 (Vercel이 자동 주입) |

### 자동 주입 (Vercel Blob 스토어 연결 시)

| 변수 | 설명 |
|------|------|
| `BLOB_STORE_ID` | Blob 스토어 ID |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Webhook 서명 검증 키 |

### 로컬 전용

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `UPLOAD_DIR` | `uploads` | 로컬 이미지 임시 저장 폴더 |

> Vercel 환경변수 동기화: `vercel env pull .env.local`

## 로컬 개발

```bash
# 백엔드 (루트에서)
pip install -r requirements.txt
uvicorn app.main:app --reload

# 프론트엔드 (frontend/ 에서)
npm install
npm run dev
```

- 프론트엔드: `http://localhost:5173`
- 백엔드: `http://localhost:8000`
- Vite 프록시: `/api/*` → `http://localhost:8000/*` (prefix 제거)
- 로컬에서 `BLOB_READ_WRITE_TOKEN` 없으면 `uploads/` 폴더에 파일 저장 (폴백)

## API 엔드포인트

### 로컬 (prefix 없음) / Vercel (prefix `/api`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/expenses/summary` | 전체 + 이번달 요약, 카테고리별 집계 |
| GET | `/expenses` | 지출 목록 (`from_date`, `to_date`, `category` 필터) |
| GET | `/expenses/{id}` | 지출 상세 |
| GET | `/expenses/{id}/image` | 영수증 이미지 프록시 (Blob 인증 후 반환) |
| POST | `/expenses` | 지출 직접 생성 |
| PUT | `/expenses/{id}` | 지출 수정 |
| DELETE | `/expenses/{id}` | 지출 삭제 |
| POST | `/receipts/upload` | 영수증 업로드 → OCR → 저장 |
| GET | `/health` | 헬스 체크 |

> `GET /expenses/summary`는 반드시 `GET /expenses/{id}` 앞에 등록 (FastAPI 라우트 충돌 방지)

## 라우팅 구조 (Dev vs Prod)

| 환경 | `/api/*` 처리 |
|------|--------------|
| 로컬 | Vite 프록시가 `/api` prefix 제거 후 FastAPI로 전달 → FastAPI prefix 없음 |
| Vercel | `vercel.json` rewrite로 `api/index.py` 호출 → FastAPI prefix `/api` 추가 |

→ `app/main.py` (로컬): 라우터 prefix 없음  
→ `api/index.py` (Vercel): `app.include_router(..., prefix="/api")`

## 이미지 업로드 흐름

```
브라우저 → POST /api/receipts/upload
  → Vercel Blob PUT (x-access: public, receipt-kic-blob 스토어)
  → Blob URL을 image_url 필드에 저장 (DB)

브라우저 → GET /api/expenses/{id}/image
  → FastAPI가 expense.image_url 조회
  → Blob URL이면: httpx로 다운로드 후 프록시 반환
  → 로컬 경로면: 파일시스템에서 직접 읽기
```

> 이미지는 Vercel Blob Public 스토어에 저장되지만, 프론트엔드는 항상 `/api/expenses/{id}/image` 경로를 사용 (직접 Blob URL 노출 안 함)

## DB 스키마

```sql
CREATE TABLE expenses (
    id               TEXT        PRIMARY KEY,
    date             DATE        NOT NULL,
    store_name       TEXT        NOT NULL,
    total_amount     INTEGER     NOT NULL,
    items            JSONB       NOT NULL DEFAULT '[]',
    category         TEXT        NOT NULL DEFAULT '',
    raw_ie_response  TEXT        NOT NULL DEFAULT '',
    image_url        TEXT        NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL
);
```

- `init_db()` 가 앱 시작 시 자동 실행 (`CREATE TABLE IF NOT EXISTS`)
- 구 컬럼명 `image_path` → `image_url` 마이그레이션 SQL 포함 (DO $$ IF EXISTS $$)

## Vercel 배포 설정

```json
// vercel.json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index" },
    { "source": "/:path*",     "destination": "/index.html" }
  ]
}
```

- Python 런타임은 자동 감지 (명시적 `runtime` 지정 불필요 — 지정 시 오류 발생)
- SPA fallback: `/:path*` → `index.html`

## 카테고리

`식비`, `교통`, `생활용품`, `의료`, `문화`, `기타`

Upstage IE API가 영수증 내용을 보고 자동 분류.

## 주요 의존성

```
fastapi>=0.115.6
uvicorn[standard]>=0.32.1
httpx>=0.28.1              # Blob 업로드 / Upstage API 호출
psycopg2-binary>=2.9.10   # Neon PostgreSQL
pydantic>=2.11.0
pydantic-settings>=2.7.0
python-multipart>=0.0.20
```
