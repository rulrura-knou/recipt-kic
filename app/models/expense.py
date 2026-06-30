from datetime import date as _date, datetime
from typing import Annotated, Optional
from pydantic import BaseModel, BeforeValidator, Field
import uuid

# _date alias prevents the field name 'date' from shadowing the datetime.date type
# in Pydantic v2's annotation re-evaluation pass.

def _to_int(v: object) -> int:
    if isinstance(v, float):
        return int(v)
    return int(v)  # type: ignore[arg-type]

def _coerce_date(v: object) -> object:
    if v == '' or v is None:
        return None
    return v

IntField = Annotated[int, BeforeValidator(_to_int)]
OptionalDate = Annotated[Optional[_date], BeforeValidator(_coerce_date)]


class CategorySummary(BaseModel):
    category: str
    count: int
    amount: int


class ThisMonth(BaseModel):
    year: int
    month: int


class ExpenseSummary(BaseModel):
    total_count: int
    total_amount: int
    this_month_count: int
    this_month_amount: int
    this_month: ThisMonth
    by_category: list[CategorySummary]


class ReceiptItem(BaseModel):
    name: str
    price: IntField
    quantity: IntField = 1


class ExpenseCreate(BaseModel):
    date: _date
    store_name: str
    total_amount: IntField
    items: list[ReceiptItem] = []
    category: str = ""


class ExpenseUpdate(BaseModel):
    date: OptionalDate = None
    store_name: Optional[str] = None
    total_amount: Optional[IntField] = None
    items: Optional[list[ReceiptItem]] = None
    category: Optional[str] = None


class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: _date
    store_name: str
    total_amount: IntField
    items: list[ReceiptItem] = []
    category: str = ""
    raw_ie_response: str = ""
    image_url: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
