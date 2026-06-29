import json
from pathlib import Path
from datetime import date, datetime
from app.config import settings
from app.models.expense import Expense


def _load() -> list[dict]:
    path = Path(settings.data_file_path)
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _save(expenses: list[dict]) -> None:
    path = Path(settings.data_file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(expenses, ensure_ascii=False, indent=2, default=_json_default), encoding="utf-8")


def _json_default(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def get_all() -> list[Expense]:
    return [Expense(**e) for e in _load()]


def get_filtered(
    from_date: date | None = None,
    to_date: date | None = None,
    category: str | None = None,
) -> list[Expense]:
    expenses = [Expense(**e) for e in _load()]

    if from_date:
        expenses = [e for e in expenses if e.date >= from_date]
    if to_date:
        expenses = [e for e in expenses if e.date <= to_date]
    if category:
        expenses = [e for e in expenses if e.category == category]

    return sorted(expenses, key=lambda e: e.date, reverse=True)


def get_by_id(expense_id: str) -> Expense | None:
    for e in _load():
        if e["id"] == expense_id:
            return Expense(**e)
    return None


def create(expense: Expense) -> Expense:
    expenses = _load()
    expenses.append(expense.model_dump())
    _save(expenses)
    return expense


def update(expense_id: str, updated: Expense) -> Expense | None:
    expenses = _load()
    for i, e in enumerate(expenses):
        if e["id"] == expense_id:
            expenses[i] = updated.model_dump()
            _save(expenses)
            return updated
    return None


def delete(expense_id: str) -> bool:
    expenses = _load()
    filtered = [e for e in expenses if e["id"] != expense_id]
    if len(filtered) == len(expenses):
        return False
    _save(filtered)
    return True
