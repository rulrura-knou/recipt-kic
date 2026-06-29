from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.config import settings
from app.models.expense import Expense
from app.services import storage
from app.services.ocr import ie_to_expense

router = APIRouter(prefix="/receipts", tags=["receipts"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


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

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    save_path = upload_dir / file.filename
    save_path.write_bytes(image_bytes)

    expense = await ie_to_expense(image_bytes, file.content_type, str(save_path))
    return storage.create(expense)
