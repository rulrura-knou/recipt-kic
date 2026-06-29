import uuid
from pathlib import Path
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.config import settings
from app.models.expense import Expense
from app.services import storage
from app.services.ocr import ie_to_expense

router = APIRouter(prefix="/receipts", tags=["receipts"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _upload_to_blob(image_bytes: bytes, filename: str, content_type: str) -> str:
    headers = {
        "Authorization": f"Bearer {settings.blob_read_write_token}",
        "Content-Type": content_type,
        "x-api-version": "7",
        "x-access": "public",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.put(
            f"https://blob.vercel-storage.com/receipts/{filename}",
            content=image_bytes,
            headers=headers,
        )
        res.raise_for_status()
    return res.json()["url"]


async def _save_image(image_bytes: bytes, filename: str, content_type: str) -> str:
    if settings.blob_read_write_token:
        return await _upload_to_blob(image_bytes, filename, content_type)
    # 로컬 개발: uploads/ 폴더에 저장
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(image_bytes)
    return f"/api/uploads/{filename}"


@router.post("/upload", response_model=Expense, status_code=201)
async def upload_receipt(file: UploadFile = File(...)):
    if not settings.upstage_api_key:
        raise HTTPException(
            status_code=503,
            detail={"code": "OCR_SERVICE_UNAVAILABLE", "message": "UPSTAGE_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요."},
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_FILE_TYPE", "message": "jpg, png, webp 이미지만 업로드 가능합니다.", "received": file.content_type},
        )

    image_bytes = await file.read()
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"

    image_url = await _save_image(image_bytes, filename, file.content_type)
    expense = await ie_to_expense(image_bytes, file.content_type, image_url)
    return storage.create(expense)
