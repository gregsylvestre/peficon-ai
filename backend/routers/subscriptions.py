"""Router: Subscriptions — assinaturas recorrentes"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import get_db
from schemas import SubscriptionCreate, SubscriptionOut

router = APIRouter()


def enrich_sub(row: dict) -> SubscriptionOut:
    amount = row["amount"] or 0
    cycle = row.get("billing_cycle", "monthly")
    annual = amount * 12 if cycle == "monthly" else amount * 4 if cycle == "quarterly" else amount
    return SubscriptionOut(**row, annual_cost=round(annual, 2))


@router.get("", response_model=List[SubscriptionOut])
async def list_subscriptions(status: str = None, db=Depends(get_db)):
    where = "WHERE status=?" if status else ""
    params = (status,) if status else ()
    cursor = await db.execute(
        f"SELECT * FROM subscriptions {where} ORDER BY amount DESC", params
    )
    rows = await cursor.fetchall()
    return [enrich_sub(dict(r)) for r in rows]


@router.post("", response_model=SubscriptionOut, status_code=201)
async def create_subscription(sub: SubscriptionCreate, db=Depends(get_db)):
    cursor = await db.execute(
        """INSERT INTO subscriptions (name, category_id, amount, billing_cycle,
           billing_day, start_date, end_date, url, notes)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (sub.name, sub.category_id, sub.amount, sub.billing_cycle,
         sub.billing_day, sub.start_date, sub.end_date, sub.url, sub.notes)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM subscriptions WHERE id=?", (cursor.lastrowid,))
    return enrich_sub(dict(await row.fetchone()))


@router.put("/{sub_id}/cancel")
async def cancel_subscription(sub_id: int, db=Depends(get_db)):
    await db.execute("UPDATE subscriptions SET status='cancelled' WHERE id=?", (sub_id,))
    await db.commit()
    return {"cancelled": sub_id}


@router.delete("/{sub_id}")
async def delete_subscription(sub_id: int, db=Depends(get_db)):
    await db.execute("DELETE FROM subscriptions WHERE id=?", (sub_id,))
    await db.commit()
    return {"deleted": sub_id}


@router.get("/summary")
async def subscriptions_summary(db=Depends(get_db)):
    cursor = await db.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status='active' AND billing_cycle='monthly' THEN amount ELSE 0 END) as monthly_total,
            SUM(CASE WHEN status='active' AND billing_cycle='monthly' THEN amount*12 ELSE 0 END) as annual_total
        FROM subscriptions
    """)
    row = await cursor.fetchone()
    return dict(row)
