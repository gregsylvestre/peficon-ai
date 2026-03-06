"""Router: Expenses — CRUD de despesas"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database import get_db
from schemas import ExpenseCreate, ExpenseOut

router = APIRouter()


@router.get("", response_model=List[ExpenseOut])
async def list_expenses(
    month: Optional[int] = None,
    year: Optional[int] = None,
    category_id: Optional[str] = None,
    type: Optional[str] = None,
    db=Depends(get_db)
):
    filters, params = [], []
    if month and year:
        from datetime import datetime
        month_str = f"{year}-{month:02d}"
        filters.append("strftime('%Y-%m', expense_date) = ?")
        params.append(month_str)
    if category_id:
        filters.append("category_id = ?")
        params.append(category_id)
    if type:
        filters.append("type = ?")
        params.append(type)

    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    cursor = await db.execute(
        f"SELECT * FROM expenses {where} ORDER BY expense_date DESC, id DESC",
        params
    )
    rows = await cursor.fetchall()
    return [ExpenseOut(**dict(r)) for r in rows]


@router.post("", response_model=ExpenseOut, status_code=201)
async def create_expense(expense: ExpenseCreate, db=Depends(get_db)):
    cursor = await db.execute(
        """INSERT INTO expenses (description, amount, category_id, expense_date, type, notes)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (expense.description, expense.amount, expense.category_id,
         expense.expense_date, expense.type, expense.notes)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM expenses WHERE id=?", (cursor.lastrowid,))
    return ExpenseOut(**dict(await row.fetchone()))


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(expense_id: int, db=Depends(get_db)):
    row = await db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Despesa não encontrada")
    return ExpenseOut(**dict(data))


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(expense_id: int, expense: ExpenseCreate, db=Depends(get_db)):
    await db.execute(
        """UPDATE expenses SET description=?, amount=?, category_id=?,
           expense_date=?, type=?, notes=? WHERE id=?""",
        (expense.description, expense.amount, expense.category_id,
         expense.expense_date, expense.type, expense.notes, expense_id)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Despesa não encontrada")
    return ExpenseOut(**dict(data))


@router.delete("/{expense_id}")
async def delete_expense(expense_id: int, db=Depends(get_db)):
    await db.execute("DELETE FROM expenses WHERE id=?", (expense_id,))
    await db.commit()
    return {"deleted": expense_id}
