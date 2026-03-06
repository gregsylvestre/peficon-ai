# fintech.ai 💰
### Sistema de Controle Financeiro Pessoal com IA

> Backend Python (FastAPI) + Frontend React/Mobile · Dark/Light mode · IA embarcada (Claude)

---

## 📁 Estrutura do Projeto

```
fintechai/
├── backend/
│   ├── main.py              ← Servidor FastAPI principal
│   ├── database.py          ← SQLite async + seed de dados
│   ├── schemas.py           ← Modelos Pydantic (validação)
│   ├── requirements.txt     ← Dependências Python
│   ├── .env.example         ← Variáveis de ambiente
│   └── routers/
│       ├── dashboard.py     ← Resumo financeiro do mês
│       ├── expenses.py      ← CRUD de despesas
│       ├── budgets.py       ← Orçamentos por categoria
│       ├── loans.py         ← Empréstimos + amortização
│       ├── subscriptions.py ← Assinaturas recorrentes
│       ├── income.py        ← Renda mensal
│       └── ai_advisor.py    ← Chat IA + insights automáticos
└── frontend/
    └── financeiro.jsx       ← App React completo (mobile-first)
```

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Python 3.10+
- Node.js 18+ (para o frontend)
- Chave da API Anthropic ([anthropic.com](https://console.anthropic.com))

### 1. Backend Python

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua ANTHROPIC_API_KEY

# Rodar o servidor
python main.py
# Servidor em: http://localhost:8000
# Docs automáticos: http://localhost:8000/docs
```

### 2. Frontend React

```bash
# Opção A: Vite (recomendado)
npm create vite@latest frontend -- --template react
cd frontend
npm install
# Copie o financeiro.jsx para src/App.jsx
npm run dev
# App em: http://localhost:5173

# Opção B: Create React App
npx create-react-app frontend
cd frontend
# Substitua src/App.js pelo financeiro.jsx
npm start
```

### 3. Acesso Mobile
```bash
# No servidor, rode com host externo:
uvicorn main:app --host 0.0.0.0 --port 8000

# No frontend (Vite):
npm run dev -- --host

# Acesse pelo IP da sua rede:
# http://192.168.x.x:5173
```

---

## 📡 API Endpoints

### Dashboard
```
GET  /api/dashboard?month=3&year=2026
```

### Despesas
```
GET    /api/expenses?month=3&year=2026&category_id=alimentacao
POST   /api/expenses          ← { description, amount, category_id, expense_date, type }
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}
```

### Empréstimos
```
GET    /api/loans
GET    /api/loans/{id}
GET    /api/loans/{id}/schedule    ← Tabela de amortização completa
POST   /api/loans                  ← Cadastro completo
PUT    /api/loans/{id}             ← Atualização parcial
POST   /api/loans/{id}/pay-installment  ← Marca parcela paga
DELETE /api/loans/{id}
GET    /api/loans/summary          ← Resumo geral
```

#### Payload para criar empréstimo:
```json
{
  "institution": "Banco do Brasil",
  "description": "Empréstimo Pessoal",
  "total_amount": 15000,
  "monthly_payment": 650,
  "interest_rate": 1.99,
  "start_date": "2025-01-10",
  "end_date": "2027-01-10",
  "total_installments": 24,
  "paid_installments": 0,
  "loan_type": "personal",
  "notes": "Usado para reforma"
}
```

### Assinaturas
```
GET    /api/subscriptions
POST   /api/subscriptions
PUT    /api/subscriptions/{id}/cancel
DELETE /api/subscriptions/{id}
GET    /api/subscriptions/summary
```

### IA Conselheira
```
POST /api/ai/chat     ← { messages: [{role, content}], month, year }
GET  /api/ai/insights ← Insights automáticos sem interação
```

### Orçamentos
```
GET  /api/budgets?month=3&year=2026
POST /api/budgets/bulk  ← Atualiza todos de uma vez
PUT  /api/budgets/{id}
```

---

## 🗄️ Banco de Dados

O sistema usa **SQLite** por padrão (arquivo `fintechai.db`).

### Para usar PostgreSQL em produção:
```bash
pip install asyncpg

# Em database.py, substitua:
# aiosqlite → asyncpg
# DB_PATH → DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

### Tabelas criadas automaticamente:
| Tabela | Descrição |
|--------|-----------|
| `income` | Renda mensal |
| `categories` | Categorias de despesa |
| `budgets` | Orçamentos por categoria/mês |
| `expenses` | Despesas lançadas |
| `loans` | Empréstimos e financiamentos |
| `subscriptions` | Assinaturas recorrentes |
| `savings_goals` | Metas de poupança |

---

## 📲 Integração WhatsApp (Roadmap)

Para lançar despesas pelo WhatsApp, integre com:

### Opção 1: Twilio (mais simples)
```bash
pip install twilio flask

# webhook que recebe mensagens e chama /api/expenses
# Exemplo: "café 15" → descrição=café, amount=15
```

### Opção 2: WhatsApp Business API
- Meta Business Platform
- Webhook para mensagens recebidas
- Parser de linguagem natural com Claude

### Parser de mensagem sugerido:
```
"gastei 50 no supermercado" → alimentacao, R$50
"netflix 39.90" → assinaturas, R$39.90
"gasolina 180" → transporte, R$180
```

---

## 🤖 IA Embarcada (Claude)

O assistente **Finn** usa a API da Anthropic com contexto financeiro real:

- **Chat interativo** — responde perguntas personalizadas
- **Insights automáticos** — `GET /api/ai/insights`
- **Contexto injetado** — renda, gastos, empréstimos, assinaturas

### Personalizar o sistema:
Edite `SYSTEM_PROMPT` em `routers/ai_advisor.py`

---

## 🌐 Deploy em Produção

### Railway (recomendado)
```bash
# Instale Railway CLI
npm install -g @railway/cli

railway login
railway init
railway up
```

### Render
```yaml
# render.yaml
services:
  - type: web
    name: fintechai-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Variáveis necessárias em produção:
```
ANTHROPIC_API_KEY=sk-ant-...
DB_PATH=/data/fintechai.db
PORT=8000
```

---

## 🔒 Segurança (para versão multi-usuário)

Para adicionar autenticação, instale:
```bash
pip install python-jose[cryptography] passlib[bcrypt]
```

Implemente JWT com endpoints:
- `POST /auth/register`
- `POST /auth/login`
- Middleware de autenticação nos routers

---

## 📦 Dependências Backend

| Pacote | Versão | Uso |
|--------|--------|-----|
| fastapi | 0.115 | Framework web async |
| uvicorn | 0.32 | Servidor ASGI |
| aiosqlite | 0.20 | SQLite assíncrono |
| pydantic | 2.10 | Validação de dados |
| httpx | 0.28 | Chamadas HTTP async |
| python-dotenv | 1.0 | Variáveis de ambiente |

---

## 🎯 Funcionalidades

- [x] Dashboard com resumo financeiro
- [x] Lançamento rápido de despesas
- [x] Controle de orçamento por categoria
- [x] Gestão de empréstimos com amortização
- [x] Tabela de parcelas completa
- [x] Controle de assinaturas recorrentes
- [x] IA conselheira embarcada (Claude)
- [x] Dark/Light mode
- [x] API REST completa documentada
- [x] Mobile-first (PWA-ready)
- [ ] Integração WhatsApp (roadmap)
- [ ] Autenticação JWT (roadmap)
- [ ] Exportação PDF/Excel (roadmap)
- [ ] Notificações de vencimento (roadmap)
- [ ] Metas de poupança (roadmap)
