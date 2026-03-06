"""
fintech.ai — Backend FastAPI
Sistema de Controle Financeiro Pessoal
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn

from database import init_db
from routers import expenses, budgets, loans, subscriptions, income, ai_advisor, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa o banco de dados na startup."""
    await init_db()
    yield


app = FastAPI(
    title="fintech.ai API",
    description="Sistema de Controle Financeiro Pessoal com IA",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Despesas"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Orçamentos"])
app.include_router(loans.router, prefix="/api/loans", tags=["Empréstimos"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Assinaturas"])
app.include_router(income.router, prefix="/api/income", tags=["Renda"])
app.include_router(ai_advisor.router, prefix="/api/ai", tags=["IA Conselheira"])


@app.get("/")
async def root():
    return {"message": "fintech.ai API v1.0", "status": "online"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
