from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from app.config import settings
from app.models.expense import (
    CategorySummary, Expense, ExpenseCreate, ExpenseUpdate, ExpenseSummary, ThisMonth,
)
from app.services import storage

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _not_found(expense_id: str):
    raise HTTPException(
        status_code=404,
        detail={"code": "NOT_FOUND", "message": "해당 지출 항목을 찾을 수 없습니다.", "id": expense_id},
    )


@router.get("/summary", response_model=ExpenseSummary)
def get_summary():
    all_expenses = storage.get_all()
    now = datetime.now()

    this_month = [e for e in all_expenses if e.date.year == now.year and e.date.month == now.month]

    cat_map: dict[str, dict] = defaultdict(lambda: {"count": 0, "amount": 0})
    for e in all_expenses:
        cat_map[e.category]["count"] += 1
        cat_map[e.category]["amount"] += e.total_amount

    return ExpenseSummary(
        total_count=len(all_expenses),
        total_amount=sum(e.total_amount for e in all_expenses),
        this_month_count=len(this_month),
        this_month_amount=sum(e.total_amount for e in this_month),
        this_month=ThisMonth(year=now.year, month=now.month),
        by_category=[
            CategorySummary(category=cat, count=v["count"], amount=v["amount"])
            for cat, v in sorted(cat_map.items(), key=lambda x: x[1]["amount"], reverse=True)
        ],
    )


@router.get("", response_model=list[Expense])
def list_expenses(
    from_date: Optional[date] = Query(None, description="조회 시작일 (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="조회 종료일 (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="카테고리 필터 (식비·교통·생활용품·의료·문화·기타)"),
):
    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_DATE_RANGE", "message": "from_date가 to_date보다 늦을 수 없습니다."},
        )
    return storage.get_filtered(from_date=from_date, to_date=to_date, category=category)


@router.get("/{expense_id}/image")
async def get_expense_image(expense_id: str):
    expense = storage.get_by_id(expense_id)
    if not expense or not expense.image_url:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "이미지를 찾을 수 없습니다."})

    image_url = expense.image_url

    if image_url.startswith("http"):
        # Vercel Blob private — 토큰 인증 후 프록시
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.get(
                image_url,
                headers={"Authorization": f"Bearer {settings.blob_read_write_token}", "x-api-version": "7"},
            )
            if not res.is_success:
                raise HTTPException(status_code=404, detail={"code": "IMAGE_NOT_FOUND", "message": "이미지를 불러올 수 없습니다."})
        return Response(content=res.content, media_type=res.headers.get("content-type", "image/jpeg"))
    else:
        # 로컬 개발 — 파일시스템에서 직접 읽기
        filename = image_url.split("/")[-1]
        file_path = Path(settings.upload_dir) / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail={"code": "IMAGE_NOT_FOUND", "message": "이미지를 찾을 수 없습니다."})
        return Response(content=file_path.read_bytes(), media_type="image/jpeg")


@router.get("/{expense_id}", response_model=Expense)
def get_expense(expense_id: str):
    expense = storage.get_by_id(expense_id)
    if not expense:
        _not_found(expense_id)
    return expense


@router.post("", response_model=Expense, status_code=201)
def create_expense(body: ExpenseCreate):
    expense = Expense(**body.model_dump())
    return storage.create(expense)


@router.put("/{expense_id}", response_model=Expense)
def update_expense(expense_id: str, body: ExpenseUpdate):
    existing = storage.get_by_id(expense_id)
    if not existing:
        _not_found(expense_id)

    updated_data = existing.model_dump()
    for field, value in body.model_dump(exclude_none=True).items():
        updated_data[field] = value
    updated_data["updated_at"] = datetime.now()

    updated = Expense(**updated_data)
    storage.update(expense_id, updated)
    return updated


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: str):
    if not storage.delete(expense_id):
        _not_found(expense_id)
