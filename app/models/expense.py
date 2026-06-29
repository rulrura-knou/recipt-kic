from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


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
    price: int
    quantity: int = 1


class ExpenseCreate(BaseModel):
    date: date
    store_name: str
    total_amount: int
    items: list[ReceiptItem] = []
    category: str = ""


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    store_name: Optional[str] = None
    total_amount: Optional[int] = None
    items: Optional[list[ReceiptItem]] = None
    category: Optional[str] = None


class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: date
    store_name: str
    total_amount: int
    items: list[ReceiptItem] = []
    category: str = ""
    raw_ie_response: str = ""
    image_url: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
