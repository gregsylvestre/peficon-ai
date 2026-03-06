"""Router: AI Advisor — conselheira financeira com Claude"""

from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from schemas import AIChatRequest, AIChatResponse
import httpx
import os
from datetime import datetime

router = APIRouter()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-20250514"


async def build_financial_context(month: int, year: int, db) -> str:
    """Monta contexto financeiro real para o prompt da IA."""
    month_str = f"{year}-{month:02d}"

    # Renda
    r = await db.execute(
        "SELECT COALESCE(SUM(amount),0) as t FROM income WHERE month=? AND year=?", (month, year)
    )
    income = (await r.fetchone())["t"] or 0
    if income == 0:
        r2 = await db.execute("SELECT COALESCE(SUM(amount),0) as t FROM income WHERE is_recurring=1")
        income = (await r2.fetchone())["t"] or 0

    # Despesas
    r = await db.execute(
        "SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE strftime('%Y-%m',expense_date)=?",
        (month_str,)
    )
    total_exp = (await r.fetchone())["t"] or 0

    # Por categoria
    cats = await db.execute("""
        SELECT c.label, COALESCE(SUM(e.amount),0) as spent, COALESCE(b.amount,0) as budget
        FROM categories c
        LEFT JOIN expenses e ON e.category_id=c.id AND strftime('%Y-%m',e.expense_date)=?
        LEFT JOIN budgets b ON b.category_id=c.id AND b.month=? AND b.year=?
        GROUP BY c.id HAVING spent > 0 OR budget > 0
    """, (month_str, month, year))
    cat_rows = await cats.fetchall()

    # Empréstimos
    loans = await db.execute(
        "SELECT institution, monthly_payment, total_installments, paid_installments, total_amount FROM loans WHERE status='active'"
    )
    loan_rows = await loans.fetchall()

    # Assinaturas
    subs = await db.execute(
        "SELECT name, amount FROM subscriptions WHERE status='active'"
    )
    sub_rows = await subs.fetchall()

    balance = income - total_exp
    savings_rate = (balance / income * 100) if income > 0 else 0

    ctx = f"""=== DADOS FINANCEIROS DO USUÁRIO — {month:02d}/{year} ===

RENDA MENSAL: R$ {income:,.2f}
TOTAL GASTO: R$ {total_exp:,.2f}
SALDO: R$ {balance:,.2f}
TAXA DE POUPANÇA: {savings_rate:.1f}%

GASTOS POR CATEGORIA:
"""
    for r in cat_rows:
        over = " ⚠️ ACIMA DO ORÇAMENTO" if r["spent"] > r["budget"] > 0 else ""
        ctx += f"  • {r['label']}: R$ {r['spent']:,.2f} / orçamento R$ {r['budget']:,.2f}{over}\n"

    if loan_rows:
        ctx += "\nEMPRÉSTIMOS ATIVOS:\n"
        for l in loan_rows:
            remaining = l["total_installments"] - l["paid_installments"]
            ctx += f"  • {l['institution']}: R$ {l['monthly_payment']:,.2f}/mês | {remaining} parcelas restantes | total R$ {l['total_amount']:,.2f}\n"

    if sub_rows:
        ctx += "\nASSINATURAS:\n"
        total_subs = sum(s["amount"] for s in sub_rows)
        ctx += f"  Total mensal: R$ {total_subs:,.2f}\n"
        for s in sub_rows:
            ctx += f"  • {s['name']}: R$ {s['amount']:,.2f}\n"

    return ctx


SYSTEM_PROMPT = """Você é um assistente financeiro pessoal inteligente, empático e prático chamado "Finn".

Você tem acesso aos dados financeiros reais do usuário e deve:
1. Dar conselhos PERSONALIZADOS baseados nos dados reais
2. Identificar padrões de gastos preocupantes
3. Sugerir estratégias práticas e alcançáveis
4. Motivar o usuário sem ser condescendente
5. Usar emojis com moderação para tornar as respostas mais amigáveis
6. Ser direto e objetivo (máximo 200 palavras por resposta)
7. Citar números reais dos dados quando relevante
8. Falar SEMPRE em português brasileiro

Você NÃO deve:
- Dar conselhos médicos ou jurídicos
- Prometer resultados garantidos
- Ser alarmista sem motivo
- Repetir as mesmas dicas genéricas
"""


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest, db=Depends(get_db)):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "ANTHROPIC_API_KEY não configurada")

    now = datetime.now()
    month = request.month or now.month
    year = request.year or now.year

    financial_ctx = await build_financial_context(month, year, db)

    # Monta mensagens com contexto injetado na primeira mensagem do usuário
    messages = []
    for i, msg in enumerate(request.messages):
        if i == 0 and msg.role == "user":
            content = f"{financial_ctx}\n\nPergunta do usuário: {msg.content}"
        else:
            content = msg.content
        messages.append({"role": msg.role, "content": content})

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": CLAUDE_MODEL,
                "max_tokens": 512,
                "system": SYSTEM_PROMPT,
                "messages": messages,
            }
        )

    if resp.status_code != 200:
        raise HTTPException(502, f"Erro na API Anthropic: {resp.text}")

    data = resp.json()
    reply = data["content"][0]["text"]
    tokens = data.get("usage", {}).get("output_tokens")

    return AIChatResponse(reply=reply, tokens_used=tokens)


@router.get("/insights")
async def get_insights(month: int = None, year: int = None, db=Depends(get_db)):
    """Gera insights automáticos sem interação do usuário."""
    if not ANTHROPIC_API_KEY:
        return {"insights": ["Configure ANTHROPIC_API_KEY para insights automáticos."]}

    now = datetime.now()
    month = month or now.month
    year = year or now.year
    ctx = await build_financial_context(month, year, db)

    prompt = f"""{ctx}

Com base nos dados acima, gere exatamente 3 insights financeiros curtos e práticos.
Responda APENAS com JSON no formato:
{{"insights": ["insight1", "insight2", "insight3"]}}
Cada insight deve ter no máximo 80 caracteres."""

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": CLAUDE_MODEL,
                "max_tokens": 256,
                "messages": [{"role": "user", "content": prompt}]
            }
        )

    if resp.status_code != 200:
        return {"insights": ["Não foi possível gerar insights no momento."]}

    import json
    try:
        text = resp.json()["content"][0]["text"]
        data = json.loads(text)
        return data
    except Exception:
        return {"insights": ["Erro ao processar insights automáticos."]}
