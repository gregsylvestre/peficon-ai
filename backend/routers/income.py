"""Router: Income — receitas com CRUD completo"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from database import get_db

router = APIRouter()


class IncomeCreate(BaseModel):
    description: str
    amount: float
    category_id: str = "salario"
    date: str
    recurrent: bool = False
    notes: Optional[str] = None

class IncomeOut(IncomeCreate):
    id: int
    created_at: str


@router.get("", response_model=List[IncomeOut])
async def list_incomes(month: Optional[int]=None, year: Optional[int]=None, db=Depends(get_db)):
    filters, params = [], []
    if month and year:
        filters.append("strftime('%Y-%m', date) = ?")
        params.append(f"{year}-{month:02d}")
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    cur = await db.execute(f"SELECT * FROM incomes {where} ORDER BY date DESC, id DESC", params)
    rows = await cur.fetchall()
    return [IncomeOut(**dict(r)) for r in rows]


@router.post("", response_model=IncomeOut, status_code=201)
async def create_income(income: IncomeCreate, db=Depends(get_db)):
    cur = await db.execute(
        "INSERT INTO incomes (description, amount, category_id, date, recurrent, notes) VALUES (?,?,?,?,?,?)",
        (income.description, income.amount, income.category_id, income.date, int(income.recurrent), income.notes)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM incomes WHERE id=?", (cur.lastrowid,))
    return IncomeOut(**dict(await row.fetchone()))


@router.get("/summary")
async def incomes_summary(month: Optional[int]=None, year: Optional[int]=None, db=Depends(get_db)):
    filters, params = [], []
    if month and year:
        filters.append("strftime('%Y-%m', date) = ?")
        params.append(f"{year}-{month:02d}")
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    cur = await db.execute(f"""
        SELECT COUNT(*) as total_count,
            COALESCE(SUM(amount),0) as total_amount,
            COALESCE(SUM(CASE WHEN recurrent=1 THEN amount ELSE 0 END),0) as recurrent_amount,
            COALESCE(SUM(CASE WHEN recurrent=0 THEN amount ELSE 0 END),0) as one_time_amount
        FROM incomes {where}""", params)
    return dict(await cur.fetchone())


@router.get("/{income_id}", response_model=IncomeOut)
async def get_income(income_id: int, db=Depends(get_db)):
    row = await db.execute("SELECT * FROM incomes WHERE id=?", (income_id,))
    data = await row.fetchone()
    if not data: raise HTTPException(404, "Receita não encontrada")
    return IncomeOut(**dict(data))


@router.put("/{income_id}", response_model=IncomeOut)
async def update_income(income_id: int, income: IncomeCreate, db=Depends(get_db)):
    check = await db.execute("SELECT id FROM incomes WHERE id=?", (income_id,))
    if not await check.fetchone(): raise HTTPException(404, "Receita não encontrada")
    await db.execute(
        "UPDATE incomes SET description=?,amount=?,category_id=?,date=?,recurrent=?,notes=? WHERE id=?",
        (income.description, income.amount, income.category_id, income.date, int(income.recurrent), income.notes, income_id)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM incomes WHERE id=?", (income_id,))
    return IncomeOut(**dict(await row.fetchone()))


@router.delete("/{income_id}")
async def delete_income(income_id: int, db=Depends(get_db)):
    check = await db.execute("SELECT id FROM incomes WHERE id=?", (income_id,))
    if not await check.fetchone(): raise HTTPException(404, "Receita não encontrada")
    await db.execute("DELETE FROM incomes WHERE id=?", (income_id,))
    await db.commit()
    return {"deleted": income_id}
