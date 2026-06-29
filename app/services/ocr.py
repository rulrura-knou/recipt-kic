import base64
import json
import httpx
from datetime import date
from app.config import settings
from app.models.expense import Expense, ReceiptItem


IE_API_URL = "https://api.upstage.ai/v1/information-extraction"

RECEIPT_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "receipt_schema",
        "schema": {
            "type": "object",
            "properties": {
                "store_name": {
                    "type": "string",
                    "description": "가게 이름",
                },
                "date": {
                    "type": "string",
                    "description": "영수증 날짜 (YYYY-MM-DD 형식)",
                },
                "total_amount": {
                    "type": "number",
                    "description": "총 결제 금액 (숫자만, 통화 기호 제외)",
                },
                "items": {
                    "type": "array",
                    "description": "구매 품목 목록",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "품목명"},
                            "price": {"type": "number", "description": "품목 가격 (숫자만)"},
                        },
                        "required": ["name", "price"],
                    },
                },
                "category": {
                    "type": "string",
                    "description": "지출 분류: 식비, 교통, 생활용품, 의료, 문화, 기타 중 하나",
                },
            },
            "required": ["store_name", "date", "total_amount", "items", "category"],
        },
    },
}


def _to_data_url(image_bytes: bytes, content_type: str) -> str:
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{content_type};base64,{b64}"


async def call_ie_api(image_bytes: bytes, content_type: str) -> dict:
    headers = {
        "Authorization": f"Bearer {settings.upstage_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "information-extract",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": _to_data_url(image_bytes, content_type)},
                    }
                ],
            }
        ],
        "response_format": RECEIPT_SCHEMA,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(IE_API_URL, headers=headers, json=payload)
        response.raise_for_status()

    return response.json()


def _parse_ie_response(ie_result: dict) -> dict:
    raw_content = ie_result["choices"][0]["message"]["content"]
    return json.loads(raw_content)


async def ie_to_expense(image_bytes: bytes, content_type: str, image_url: str) -> Expense:
    ie_result = await call_ie_api(image_bytes, content_type)
    raw_content = ie_result["choices"][0]["message"]["content"]
    fields = json.loads(raw_content)

    receipt_date = date.today()
    if fields.get("date"):
        try:
            receipt_date = date.fromisoformat(fields["date"])
        except ValueError:
            pass

    return Expense(
        date=receipt_date,
        store_name=fields.get("store_name", "미확인 가맹점"),
        total_amount=int(fields.get("total_amount", 0)),
        items=[ReceiptItem(name=i["name"], price=int(i["price"])) for i in fields.get("items", [])],
        category=fields.get("category", "기타"),
        raw_ie_response=raw_content,
        image_url=image_url,
    )
