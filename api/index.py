import sys
import os

# app/ 패키지를 찾을 수 있도록 프로젝트 루트를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import expenses, receipts
from app.services.storage import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="영수증 지출관리 API",
    description="영수증 OCR 기반 지출 관리 서비스",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vercel 도메인 확정 후 구체적인 URL로 교체 예정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel은 /api/* 경로를 그대로 전달하므로 /api prefix를 추가해서 맞춤
# expenses.router 자체 prefix /expenses → 최종 /api/expenses
# receipts.router 자체 prefix /receipts → 최종 /api/receipts
app.include_router(expenses.router, prefix="/api")
app.include_router(receipts.router, prefix="/api")


@app.get("/api/health", tags=["system"])
def health_check():
    return {"status": "ok"}
