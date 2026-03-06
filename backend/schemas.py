"""
Schemas Pydantic — validação de entrada e saída
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class ExpenseType(str, Enum):
    fixed = "fixed"
    variable = "variable"
    subscription = "subscription"
    loan = "loan"

class LoanType(str, Enum):
    personal = "personal"
    vehicle = "vehicle"
    mortgage = "mortgage"
    student = "student"
    credit_card = "credit_card"
    consignado = "consignado"
    other = "other"

class LoanStatus(str, Enum):
    active = "active"
    paid = "paid"
    renegotiated = "renegotiated"
    defaulted = "defaulted"

class BillingCycle(str, Enum):
    monthly = "monthly"
    annual = "annual"
    quarterly = "quarterly"
    weekly = "weekly"


# ─── Income ───────────────────────────────────────────────────────────────────

class IncomeCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2100)
    is_recurring: bool = True

class IncomeOut(IncomeCreate):
    id: int
    created_at: str


# ─── Budget ───────────────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    category_id: str
    amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)

class BudgetOut(BudgetCreate):
    id: int

class BudgetBulkUpdate(BaseModel):
    month: int
    year: int
    budgets: dict  # { category_id: amount }


# ─── Expense ──────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    category_id: str
    expense_date: str  # ISO date string
    type: ExpenseType = ExpenseType.variable
    notes: Optional[str] = None

class ExpenseOut(ExpenseCreate):
    id: int
    created_at: str


# ─── Loan ─────────────────────────────────────────────────────────────────────

class LoanCreate(BaseModel):
    institution: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=200)
    total_amount: float = Field(..., gt=0)
    monthly_payment: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)  # % ao mês
    start_date: str
    end_date: str
    total_installments: int = Field(..., gt=0)
    paid_installments: int = Field(0, ge=0)
    loan_type: LoanType = LoanType.personal
    notes: Optional[str] = None

class LoanUpdate(BaseModel):
    institution: Optional[str] = None
    description: Optional[str] = None
    monthly_payment: Optional[float] = None
    paid_installments: Optional[int] = None
    status: Optional[LoanStatus] = None
    notes: Optional[str] = None

class LoanOut(LoanCreate):
    id: int
    amount_paid: float
    status: str
    created_at: str
    # Calculados
    remaining_amount: float = 0
    remaining_installments: int = 0
    progress_pct: float = 0
    total_interest: float = 0


# ─── Subscription ─────────────────────────────────────────────────────────────

class SubscriptionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category_id: str
    amount: float = Field(..., gt=0)
    billing_cycle: BillingCycle = BillingCycle.monthly
    billing_day: int = Field(..., ge=1, le=31)
    start_date: str
    end_date: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None

class SubscriptionOut(SubscriptionCreate):
    id: int
    status: str
    created_at: str
    annual_cost: float = 0


# ─── AI ───────────────────────────────────────────────────────────────────────

class AIMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class AIChatRequest(BaseModel):
    messages: List[AIMessage]
    month: Optional[int] = None
    year: Optional[int] = None

class AIChatResponse(BaseModel):
    reply: str
    tokens_used: Optional[int] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class CategorySpending(BaseModel):
    category_id: str
    label: str
    icon: str
    color: str
    spent: float
    budget: float
    percentage: float
    over_budget: bool

class DashboardSummary(BaseModel):
    month: int
    year: int
    total_income: float
    total_expenses: float
    total_loans_monthly: float
    total_subscriptions_monthly: float
    balance: float
    savings_rate: float
    categories: List[CategorySpending]
    recent_expenses: List[ExpenseOut]
    active_loans_count: int
    active_subscriptions_count: int
