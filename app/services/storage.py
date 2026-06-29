import json
import psycopg2
import psycopg2.extras
from datetime import date, datetime
from app.config import settings
from app.models.expense import Expense

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS expenses (
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
"""

MIGRATE_COLUMN_SQL = """
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'image_path'
    ) THEN
        ALTER TABLE expenses RENAME COLUMN image_path TO image_url;
    END IF;
END $$;
"""


def _conn():
    conn = psycopg2.connect(settings.database_url)
    return conn


def init_db() -> None:
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(CREATE_TABLE_SQL)
            cur.execute(MIGRATE_COLUMN_SQL)


def _row_to_expense(row: dict) -> Expense:
    row["items"] = row["items"] if isinstance(row["items"], list) else json.loads(row["items"])
    return Expense(**row)


def get_all() -> list[Expense]:
    with _conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM expenses ORDER BY date DESC, created_at DESC")
            return [_row_to_expense(dict(r)) for r in cur.fetchall()]


def get_filtered(
    from_date: date | None = None,
    to_date: date | None = None,
    category: str | None = None,
) -> list[Expense]:
    conditions = []
    params: list = []

    if from_date:
        conditions.append("date >= %s")
        params.append(from_date)
    if to_date:
        conditions.append("date <= %s")
        params.append(to_date)
    if category:
        conditions.append("category = %s")
        params.append(category)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    sql = f"SELECT * FROM expenses {where} ORDER BY date DESC, created_at DESC"

    with _conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [_row_to_expense(dict(r)) for r in cur.fetchall()]


def get_by_id(expense_id: str) -> Expense | None:
    with _conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
            row = cur.fetchone()
            return _row_to_expense(dict(row)) if row else None


def create(expense: Expense) -> Expense:
    data = expense.model_dump()
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO expenses
                    (id, date, store_name, total_amount, items, category,
                     raw_ie_response, image_url, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    data["id"],
                    data["date"],
                    data["store_name"],
                    data["total_amount"],
                    json.dumps(data["items"], default=str, ensure_ascii=False),
                    data["category"],
                    data["raw_ie_response"],
                    data["image_url"],
                    data["created_at"],
                    data["updated_at"],
                ),
            )
    return expense


def update(expense_id: str, updated: Expense) -> Expense | None:
    data = updated.model_dump()
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE expenses SET
                    date = %s, store_name = %s, total_amount = %s,
                    items = %s, category = %s, raw_ie_response = %s,
                    image_url = %s, updated_at = %s
                WHERE id = %s
                """,
                (
                    data["date"],
                    data["store_name"],
                    data["total_amount"],
                    json.dumps(data["items"], default=str, ensure_ascii=False),
                    data["category"],
                    data["raw_ie_response"],
                    data["image_url"],
                    data["updated_at"],
                    expense_id,
                ),
            )
            return updated if cur.rowcount > 0 else None


def delete(expense_id: str) -> bool:
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            return cur.rowcount > 0
