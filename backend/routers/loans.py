"""Router: Loans — Empréstimos com cálculo de amortização"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import get_db
from schemas import LoanCreate, LoanUpdate, LoanOut

router = APIRouter()


def enrich_loan(row: dict) -> LoanOut:
    """Adiciona campos calculados ao empréstimo."""
    total = row["total_amount"] or 0
    paid_inst = row["paid_installments"] or 0
    total_inst = row["total_installments"] or 1
    monthly = row["monthly_payment"] or 0
    rate = (row["interest_rate"] or 0) / 100  # % a.m. para decimal

    amount_paid = paid_inst * monthly
    remaining_inst = total_inst - paid_inst
    remaining_amount = max(0, total - amount_paid)
    progress_pct = round((paid_inst / total_inst) * 100, 1)

    # Juros totais (Price simples)
    total_paid_at_end = monthly * total_inst
    total_interest = max(0, total_paid_at_end - total)

    return LoanOut(
        **row,
        amount_paid=amount_paid,
        remaining_amount=remaining_amount,
        remaining_installments=remaining_inst,
        progress_pct=progress_pct,
        total_interest=total_interest,
    )


@router.get("", response_model=List[LoanOut])
async def list_loans(status: str = None, db=Depends(get_db)):
    where = "WHERE status=?" if status else ""
    params = (status,) if status else ()
    cursor = await db.execute(
        f"SELECT * FROM loans {where} ORDER BY created_at DESC", params
    )
    rows = await cursor.fetchall()
    return [enrich_loan(dict(r)) for r in rows]


@router.post("", response_model=LoanOut, status_code=201)
async def create_loan(loan: LoanCreate, db=Depends(get_db)):
    cursor = await db.execute(
        """INSERT INTO loans (institution, description, total_amount, monthly_payment,
           interest_rate, start_date, end_date, total_installments, paid_installments,
           loan_type, notes)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (loan.institution, loan.description, loan.total_amount, loan.monthly_payment,
         loan.interest_rate, loan.start_date, loan.end_date, loan.total_installments,
         loan.paid_installments, loan.loan_type, loan.notes)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM loans WHERE id=?", (cursor.lastrowid,))
    return enrich_loan(dict(await row.fetchone()))


@router.get("/summary")
async def loans_summary(db=Depends(get_db)):
    """Resumo geral dos empréstimos."""
    cursor = await db.execute("""
        SELECT
            COUNT(*) as total_loans,
            SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status='active' THEN monthly_payment ELSE 0 END) as monthly_commitment,
            SUM(CASE WHEN status='active' THEN (total_installments - paid_installments) * monthly_payment ELSE 0 END) as total_remaining,
            SUM(total_amount) as total_borrowed
        FROM loans
    """)
    row = await cursor.fetchone()
    return dict(row)


@router.get("/{loan_id}", response_model=LoanOut)
async def get_loan(loan_id: int, db=Depends(get_db)):
    row = await db.execute("SELECT * FROM loans WHERE id=?", (loan_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Empréstimo não encontrado")
    return enrich_loan(dict(data))


@router.get("/{loan_id}/schedule")
async def loan_schedule(loan_id: int, db=Depends(get_db)):
    """Tabela de amortização (Price simplificado)."""
    row = await db.execute("SELECT * FROM loans WHERE id=?", (loan_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Empréstimo não encontrado")

    loan = dict(data)
    monthly = loan["monthly_payment"]
    rate = (loan["interest_rate"] or 0) / 100
    total_inst = loan["total_installments"]
    paid_inst = loan["paid_installments"]

    # Saldo devedor inicial estimado pelo que falta pagar (Price)
    if rate > 0:
        balance = monthly * (1 - (1 + rate) ** -total_inst) / rate
    else:
        balance = monthly * total_inst

    schedule = []
    from datetime import datetime, timedelta
    import calendar

    start = datetime.strptime(loan["start_date"], "%Y-%m-%d")

    for i in range(total_inst):
        interest = balance * rate
        principal = monthly - interest
        balance = max(0, balance - principal)

        # Mês da parcela
        month_offset = i
        year_offset = (start.month - 1 + month_offset) // 12
        month_num = (start.month - 1 + month_offset) % 12 + 1
        inst_date = start.replace(year=start.year + year_offset, month=month_num)

        schedule.append({
            "installment": i + 1,
            "date": inst_date.strftime("%Y-%m-%d"),
            "payment": round(monthly, 2),
            "principal": round(principal, 2),
            "interest": round(interest, 2),
            "balance": round(balance, 2),
            "paid": i < paid_inst,
        })

    return {"loan_id": loan_id, "schedule": schedule}


@router.put("/{loan_id}", response_model=LoanOut)
async def update_loan(loan_id: int, loan: LoanUpdate, db=Depends(get_db)):
    fields, params = [], []
    if loan.institution is not None:
        fields.append("institution=?"); params.append(loan.institution)
    if loan.description is not None:
        fields.append("description=?"); params.append(loan.description)
    if loan.monthly_payment is not None:
        fields.append("monthly_payment=?"); params.append(loan.monthly_payment)
    if loan.paid_installments is not None:
        fields.append("paid_installments=?"); params.append(loan.paid_installments)
    if loan.status is not None:
        fields.append("status=?"); params.append(loan.status)
    if loan.notes is not None:
        fields.append("notes=?"); params.append(loan.notes)

    if fields:
        params.append(loan_id)
        await db.execute(
            f"UPDATE loans SET {', '.join(fields)} WHERE id=?", params
        )
        await db.commit()

    row = await db.execute("SELECT * FROM loans WHERE id=?", (loan_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Empréstimo não encontrado")
    return enrich_loan(dict(data))


@router.post("/{loan_id}/pay-installment", response_model=LoanOut)
async def pay_installment(loan_id: int, db=Depends(get_db)):
    """Marca próxima parcela como paga."""
    row = await db.execute("SELECT * FROM loans WHERE id=?", (loan_id,))
    data = await row.fetchone()
    if not data:
        raise HTTPException(404, "Empréstimo não encontrado")
    loan = dict(data)
    if loan["paid_installments"] >= loan["total_installments"]:
        raise HTTPException(400, "Todas as parcelas já foram pagas")

    new_paid = loan["paid_installments"] + 1
    status = "paid" if new_paid >= loan["total_installments"] else "active"

    await db.execute(
        "UPDATE loans SET paid_installments=?, status=? WHERE id=?",
        (new_paid, status, loan_id)
    )
    await db.commit()
    row = await db.execute("SELECT * FROM loans WHERE id=?", (loan_id,))
    return enrich_loan(dict(await row.fetchone()))


@router.delete("/{loan_id}")
async def delete_loan(loan_id: int, db=Depends(get_db)):
    await db.execute("DELETE FROM loans WHERE id=?", (loan_id,))
    await db.commit()
    return {"deleted": loan_id}
