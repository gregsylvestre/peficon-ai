"""Router: Income — renda mensal"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import get_db
from schemas import IncomeCreate, IncomeOut

router = APIRouter()


@router.get("", response_model=List[IncomeOut])
async def list_income(month: int = None, year: int = None, db=Depends(get_db)):
    filters, params = [], []
    if month:
        filters.append("month=?"); params.append(month)
    if year:
        filters.append("year=?"); params.append(year)
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    cursor = await db.execute(f"SELECT * FROM income {where} ORDER BY year DESC, month DESC", params)
    rows = await cursor.fetchall()
    return [IncomeOut(**dict(r)) for r in rows]


@router.post("", response_model=IncomeOut, status_code=201)
async def create_income(income: IncomeCreate, db=Depends(get_db)):
    cursor = await db.execute(
        "INSERT INTO income (description, amount, month, year, is_recurring) VALUES (?,?,?,?,?)",
        (income.description, income.amount, income.month, income.year, int(income.is_recurring))
    )
    await db.commit()
    row = await db.execute("SELECT * FROM income WHERE id=?", (cursor.lastrowid,))
    return IncomeOut(**dict(await row.fetchone()))


@router.put("/{income_id}", response_model=IncomeOut)
async def update_income(income_id: int, income: IncomeCreate, db=Depends(get_db)):
    await db.execute(
        "UPDATE income SET description=?, amount=?, month=?, year=?, is_recurring=? WHERE id=?",
        (income.description, income.amount, income.month, income.year, int(income.is_recurring), income_id)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM income WHERE id=?", (income_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Renda não encontrada")
    return IncomeOut(**dict(data))


@router.delete("/{income_id}")
async def delete_income(income_id: int, db=Depends(get_db)):
    await db.execute("DELETE FROM income WHERE id=?", (income_id,))
    await db.commit()
    return {"deleted": income_id}
