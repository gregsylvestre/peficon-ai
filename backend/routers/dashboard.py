"""Router: Dashboard — resumo financeiro do mês"""

from fastapi import APIRouter, Depends
from datetime import datetime
from database import get_db
from schemas import DashboardSummary, CategorySpending, ExpenseOut

router = APIRouter()


@router.get("", response_model=DashboardSummary)
async def get_dashboard(
    month: int = None,
    year: int = None,
    db=Depends(get_db)
):
    now = datetime.now()
    month = month or now.month
    year = year or now.year

    # Renda do mês
    row = await db.execute(
        "SELECT COALESCE(SUM(amount),0) as total FROM income WHERE month=? AND year=?",
        (month, year)
    )
    income_row = await row.fetchone()
    total_income = income_row["total"] if income_row else 0

    # Se não há renda cadastrada para o mês, pega a renda recorrente mais recente
    if total_income == 0:
        row2 = await db.execute(
            "SELECT COALESCE(SUM(amount),0) as total FROM income WHERE is_recurring=1"
        )
        r2 = await row2.fetchone()
        total_income = r2["total"] if r2 else 0

    # Despesas do mês (por data)
    month_str = f"{year}-{month:02d}"
    row = await db.execute(
        """SELECT COALESCE(SUM(e.amount),0) as total FROM expenses e
           WHERE strftime('%Y-%m', e.expense_date) = ?""",
        (month_str,)
    )
    exp_row = await row.fetchone()
    total_expenses = exp_row["total"] if exp_row else 0

    # Parcelas de empréstimos ativos
    row = await db.execute(
        "SELECT COALESCE(SUM(monthly_payment),0) as total FROM loans WHERE status='active'"
    )
    loan_row = await row.fetchone()
    total_loans = loan_row["total"] if loan_row else 0

    # Assinaturas ativas
    row = await db.execute(
        "SELECT COALESCE(SUM(amount),0) as total FROM subscriptions WHERE status='active' AND billing_cycle='monthly'"
    )
    sub_row = await row.fetchone()
    total_subs = sub_row["total"] if sub_row else 0

    balance = total_income - total_expenses
    savings_rate = (balance / total_income * 100) if total_income > 0 else 0

    # Gastos por categoria
    cats_cursor = await db.execute("""
        SELECT c.id, c.label, c.icon, c.color,
               COALESCE(SUM(e.amount), 0) as spent,
               COALESCE(b.amount, 0) as budget
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id
            AND strftime('%Y-%m', e.expense_date) = ?
        LEFT JOIN budgets b ON b.category_id = c.id AND b.month=? AND b.year=?
        GROUP BY c.id
        ORDER BY spent DESC
    """, (month_str, month, year))
    cats_rows = await cats_cursor.fetchall()

    categories = []
    for r in cats_rows:
        budget = r["budget"] or 0
        spent = r["spent"] or 0
        pct = (spent / budget * 100) if budget > 0 else 0
        categories.append(CategorySpending(
            category_id=r["id"],
            label=r["label"],
            icon=r["icon"],
            color=r["color"],
            spent=spent,
            budget=budget,
            percentage=round(pct, 1),
            over_budget=spent > budget and budget > 0
        ))

    # Últimas 5 despesas
    rec_cursor = await db.execute("""
        SELECT * FROM expenses
        WHERE strftime('%Y-%m', expense_date) = ?
        ORDER BY expense_date DESC, id DESC
        LIMIT 5
    """, (month_str,))
    rec_rows = await rec_cursor.fetchall()
    recent = [ExpenseOut(**dict(r)) for r in rec_rows]

    # Contadores
    loan_count_cur = await db.execute("SELECT COUNT(*) as c FROM loans WHERE status='active'")
    loan_count = (await loan_count_cur.fetchone())["c"]

    sub_count_cur = await db.execute("SELECT COUNT(*) as c FROM subscriptions WHERE status='active'")
    sub_count = (await sub_count_cur.fetchone())["c"]

    return DashboardSummary(
        month=month,
        year=year,
        total_income=total_income,
        total_expenses=total_expenses,
        total_loans_monthly=total_loans,
        total_subscriptions_monthly=total_subs,
        balance=balance,
        savings_rate=round(savings_rate, 1),
        categories=categories,
        recent_expenses=recent,
        active_loans_count=loan_count,
        active_subscriptions_count=sub_count,
    )
