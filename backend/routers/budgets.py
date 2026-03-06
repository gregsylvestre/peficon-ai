"""Router: Budgets — orçamentos por categoria/mês"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import get_db
from schemas import BudgetCreate, BudgetOut, BudgetBulkUpdate

router = APIRouter()


@router.get("", response_model=List[BudgetOut])
async def list_budgets(month: int = None, year: int = None, db=Depends(get_db)):
    filters, params = [], []
    if month:
        filters.append("month=?"); params.append(month)
    if year:
        filters.append("year=?"); params.append(year)
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    cursor = await db.execute(f"SELECT * FROM budgets {where}", params)
    rows = await cursor.fetchall()
    return [BudgetOut(**dict(r)) for r in rows]


@router.post("/bulk", status_code=200)
async def upsert_budgets_bulk(payload: BudgetBulkUpdate, db=Depends(get_db)):
    """Atualiza todos os orçamentos do mês de uma vez."""
    for cat_id, amount in payload.budgets.items():
        await db.execute(
            """INSERT INTO budgets (category_id, amount, month, year)
               VALUES (?,?,?,?)
               ON CONFLICT(category_id, month, year) DO UPDATE SET amount=excluded.amount""",
            (cat_id, float(amount), payload.month, payload.year)
        )
    await db.commit()
    return {"updated": len(payload.budgets)}


@router.put("/{budget_id}", response_model=BudgetOut)
async def update_budget(budget_id: int, budget: BudgetCreate, db=Depends(get_db)):
    await db.execute(
        "UPDATE budgets SET amount=? WHERE id=?", (budget.amount, budget_id)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM budgets WHERE id=?", (budget_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Orçamento não encontrado")
    return BudgetOut(**dict(data))
