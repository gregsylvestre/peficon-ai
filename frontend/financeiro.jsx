import { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── TEMAS ────────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#07080D", surf: "#0D0F18", card: "#12141F", border: "#1A1D2E",
    accent: "#4F8EF7", accentDim: "rgba(79,142,247,0.13)", accentGlow: "rgba(79,142,247,0.28)",
    green: "#10D07A", greenDim: "rgba(16,208,122,0.13)",
    red: "#F0556A", redDim: "rgba(240,85,106,0.13)",
    yellow: "#F6A832", yellowDim: "rgba(246,168,50,0.13)",
    purple: "#AC5CF7", purpleDim: "rgba(172,92,247,0.13)",
    teal: "#1CD7C4", tealDim: "rgba(28,215,196,0.12)",
    text: "#E8EAFF", sub: "#6E7899", muted: "#2C304A",
    grad: "linear-gradient(135deg,#4F8EF7 0%,#AC5CF7 100%)",
    gradG: "linear-gradient(135deg,#10D07A 0%,#1CD7C4 100%)",
    shadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  light: {
    bg: "#EEF1FA", surf: "#F8F9FF", card: "#FFFFFF", border: "#DDE2F5",
    accent: "#2D5CF5", accentDim: "rgba(45,92,245,0.09)", accentGlow: "rgba(45,92,245,0.22)",
    green: "#059669", greenDim: "rgba(5,150,105,0.09)",
    red: "#E02D45", redDim: "rgba(224,45,69,0.09)",
    yellow: "#D68910", yellowDim: "rgba(214,137,16,0.09)",
    purple: "#7C3AED", purpleDim: "rgba(124,58,237,0.09)",
    teal: "#0891B2", tealDim: "rgba(8,145,178,0.09)",
    text: "#0C1130", sub: "#5A6480", muted: "#C8CEDE",
    grad: "linear-gradient(135deg,#2D5CF5 0%,#7C3AED 100%)",
    gradG: "linear-gradient(135deg,#059669 0%,#0891B2 100%)",
    shadow: "0 8px 32px rgba(0,0,0,0.1)",
  }
};

// ─── DADOS ESTÁTICOS ──────────────────────────────────────────────────────────
const CATS = [
  { id: "moradia", label: "Moradia", icon: "🏠", color: "#4F8EF7" },
  { id: "alimentacao", label: "Alimentação", icon: "🍽️", color: "#10D07A" },
  { id: "transporte", label: "Transporte", icon: "🚗", color: "#F6A832" },
  { id: "saude", label: "Saúde", icon: "💊", color: "#F0556A" },
  { id: "lazer", label: "Lazer", icon: "🎮", color: "#AC5CF7" },
  { id: "assinaturas", label: "Assinaturas", icon: "📱", color: "#1CD7C4" },
  { id: "emprestimos", label: "Empréstimos", icon: "💳", color: "#F6A832" },
  { id: "educacao", label: "Educação", icon: "📚", color: "#10D07A" },
  { id: "outros", label: "Outros", icon: "📦", color: "#6E7899" },
];
const INC_CATS = [
  { id: "salario", label: "Salário", icon: "💼", color: "#10D07A" },
  { id: "freelance", label: "Freelance", icon: "💻", color: "#4F8EF7" },
  { id: "aluguel", label: "Aluguel", icon: "🏘️", color: "#F6A832" },
  { id: "investimento", label: "Investimento", icon: "📈", color: "#1CD7C4" },
  { id: "bonus", label: "Bônus", icon: "🎁", color: "#AC5CF7" },
  { id: "outros_r", label: "Outros", icon: "💰", color: "#6E7899" },
];
const LOAN_TYPES = [
  { id: "personal", label: "Pessoal", icon: "👤" },
  { id: "vehicle", label: "Veículo", icon: "🚗" },
  { id: "mortgage", label: "Imóvel", icon: "🏠" },
  { id: "consignado", label: "Consignado", icon: "📋" },
  { id: "credit_card", label: "Cartão", icon: "💳" },
  { id: "student", label: "Estudantil", icon: "📚" },
  { id: "other", label: "Outro", icon: "📦" },
];
const NAV = [
  { id: "dash", icon: "📊", label: "Dashboard" },
  { id: "income", icon: "💰", label: "Receitas" },
  { id: "expenses", icon: "💸", label: "Despesas" },
  { id: "budget", icon: "🎯", label: "Orçamento" },
  { id: "loans", icon: "💳", label: "Empréstimos" },
];
const PAGE_LABELS = { dash: "Dashboard", income: "Receitas", expenses: "Despesas", budget: "Orçamento", loans: "Empréstimos" };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";
const getCat = (id) => CATS.find(c => c.id === id) || CATS[CATS.length - 1];
const getICat = (id) => INC_CATS.find(c => c.id === id) || INC_CATS[INC_CATS.length - 1];
const getLT = (id) => LOAN_TYPES.find(t => t.id === id) || LOAN_TYPES[0];
const today = () => new Date().toISOString().split("T")[0];
const getDate = (item) => item.date || item.expense_date || "";

// ─── API ──────────────────────────────────────────────────────────────────────
const http = {
  get: async (p) => { const r = await fetch(API + p); if (!r.ok) throw new Error(`GET ${p} → ${r.status}`); return r.json(); },
  post: async (p, b) => { const r = await fetch(API + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); if (!r.ok) throw new Error(`POST ${p} → ${r.status}: ${await r.text()}`); return r.json(); },
  put: async (p, b) => { const r = await fetch(API + p, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); if (!r.ok) throw new Error(`PUT ${p} → ${r.status}: ${await r.text()}`); return r.json(); },
  del: async (p) => { const r = await fetch(API + p, { method: "DELETE" }); if (!r.ok) throw new Error(`DELETE ${p} → ${r.status}`); return r.json(); },
};
const api = {
  getExpenses: (m, y) => http.get(`/expenses?month=${m}&year=${y}`),
  createExpense: (d) => http.post("/expenses", d),
  updateExpense: (id, d) => http.put(`/expenses/${id}`, d),
  deleteExpense: (id) => http.del(`/expenses/${id}`),
  getIncomes: (m, y) => http.get(`/incomes?month=${m}&year=${y}`),
  createIncome: (d) => http.post("/incomes", d),
  updateIncome: (id, d) => http.put(`/incomes/${id}`, d),
  deleteIncome: (id) => http.del(`/incomes/${id}`),
  getLoans: () => http.get("/loans"),
  createLoan: (d) => http.post("/loans", d),
  updateLoan: (id, d) => http.put(`/loans/${id}`, d),
  deleteLoan: (id) => http.del(`/loans/${id}`),
  payInstallment: (id) => http.post(`/loans/${id}/pay-installment`, {}),
  getBudgets: (m, y) => http.get(`/budgets?month=${m}&year=${y}`),
  aiChat: (msgs) => http.post("/ai/chat", { messages: msgs, month: 3, year: 2026 }),
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const buildCSS = (c) => `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body,#root{height:100%;background:${c.bg};}
.app{display:flex;height:100vh;background:${c.bg};color:${c.text};font-family:'Instrument Sans',sans-serif;overflow:hidden;}
.sidebar{width:240px;flex-shrink:0;background:${c.surf};border-right:1px solid ${c.border};display:flex;flex-direction:column;padding:24px 0;}
.s-logo{padding:0 20px 28px;}
.s-logoname{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px;}
.s-logoemph{background:${c.grad};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.s-logosub{font-size:10px;color:${c.sub};font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:2px;}
.s-sec{font-size:9px;font-weight:800;color:${c.muted};text-transform:uppercase;letter-spacing:1.5px;padding:0 20px 8px;margin-top:16px;}
.s-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;font-size:13.5px;font-weight:600;color:${c.sub};transition:all .15s;border-left:3px solid transparent;margin:1px 0;}
.s-item:hover{background:${c.accentDim};color:${c.text};}
.s-item.on{background:${c.accentDim};color:${c.accent};border-left-color:${c.accent};}
.s-ico{font-size:17px;width:22px;text-align:center;}
.s-bottom{margin-top:auto;padding:16px 20px;border-top:1px solid ${c.border};}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1px solid ${c.border};background:${c.surf};flex-shrink:0;}
.topbar-title{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:700;letter-spacing:-.3px;}
.topbar-actions{display:flex;gap:10px;align-items:center;}
.content{flex:1;overflow-y:auto;padding:28px;}
.content::-webkit-scrollbar{width:6px;}
.content::-webkit-scrollbar-thumb{background:${c.border};border-radius:3px;}
@media(max-width:768px){
  .sidebar{display:none;}.app{flex-direction:column;}.main{height:100%;}
  .topbar{padding:12px 16px;}.content{padding:14px 14px 80px;}
  .bnav{display:grid!important;}.fab{display:flex!important;}.donly{display:none!important;}
}
@media(min-width:769px){.bnav{display:none;}.fab{display:none;}.monly{display:none!important;}}
.bnav{position:fixed;bottom:0;left:0;right:0;background:${c.surf};border-top:1px solid ${c.border};grid-template-columns:repeat(5,1fr);padding:7px 0 12px;z-index:100;}
.nb{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;background:none;border:none;color:${c.sub};font-family:'Instrument Sans',sans-serif;font-size:9px;font-weight:700;padding:4px;text-transform:uppercase;letter-spacing:.3px;}
.nb.on{color:${c.accent};}.nb-ico{font-size:19px;}
.fab{position:fixed;bottom:76px;right:16px;width:52px;height:52px;border-radius:50%;background:${c.grad};border:none;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 20px ${c.accentGlow};align-items:center;justify-content:center;z-index:99;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;}
.g21{display:grid;grid-template-columns:2fr 1fr;gap:18px;}
@media(max-width:1100px){.g4{grid-template-columns:repeat(2,1fr);}}
@media(max-width:768px){.g4,.g3,.g2,.g21{grid-template-columns:1fr 1fr;gap:10px;}}
@media(max-width:480px){.g3,.g21{grid-template-columns:1fr;}}
.card{background:${c.card};border:1px solid ${c.border};border-radius:16px;padding:18px;}
.kpi{background:${c.card};border:1px solid ${c.border};border-radius:16px;padding:18px 20px;}
.kpi-lbl{font-size:10px;font-weight:700;color:${c.sub};text-transform:uppercase;letter-spacing:.9px;margin-bottom:6px;}
.kpi-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:500;line-height:1;}
.kpi-sub{font-size:11px;color:${c.sub};margin-top:5px;}
.hero{background:${c.grad};border-radius:20px;padding:26px 28px;position:relative;overflow:hidden;margin-bottom:22px;}
.hero::before{content:'';position:absolute;top:-60px;right:-60px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.07);}
.hero::after{content:'';position:absolute;bottom:-40px;left:40px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.04);}
.hero-lbl{font-size:11px;font-weight:700;color:rgba(255,255,255,.65);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px;}
.hero-amt{font-family:'JetBrains Mono',monospace;font-size:44px;font-weight:500;color:#fff;letter-spacing:-2px;line-height:1;}
.hero-chips{display:flex;gap:14px;margin-top:18px;flex-wrap:wrap;}
.hchip{background:rgba(255,255,255,.18);backdrop-filter:blur(10px);border-radius:20px;padding:5px 13px;font-size:11px;color:#fff;font-weight:600;}
@media(max-width:768px){.hero-amt{font-size:28px;}.hero{padding:18px;}}
.shdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.stitle{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;}
.slink{font-size:12px;color:${c.accent};font-weight:600;cursor:pointer;background:none;border:none;font-family:'Instrument Sans',sans-serif;}
.twrap{background:${c.card};border:1px solid ${c.border};border-radius:16px;overflow:hidden;}
.tbl{width:100%;border-collapse:collapse;}
.tbl thead th{padding:11px 16px;font-size:10px;font-weight:800;color:${c.sub};text-transform:uppercase;letter-spacing:.9px;text-align:left;background:${c.surf};border-bottom:1px solid ${c.border};}
.tbl tbody tr{border-bottom:1px solid ${c.border};transition:background .15s;}
.tbl tbody tr:last-child{border-bottom:none;}
.tbl tbody tr:hover{background:${c.accentDim};}
.tbl td{padding:11px 16px;font-size:13px;vertical-align:middle;}
.tico{width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;}
.tname{font-weight:600;}.tmeta{font-size:11px;color:${c.sub};margin-top:1px;}
.tpos{font-family:'JetBrains Mono',monospace;font-weight:500;color:${c.green};}
.tneg{font-family:'JetBrains Mono',monospace;font-weight:500;color:${c.red};}
.tact{display:flex;gap:6px;opacity:0;transition:opacity .15s;}
.tbl tbody tr:hover .tact{opacity:1;}
@media(max-width:768px){.tact{opacity:1;}.hmob{display:none;}}
.tag{display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:3px 9px;font-size:10px;font-weight:800;letter-spacing:.2px;white-space:nowrap;}
.btn{border:none;border-radius:11px;padding:10px 18px;font-family:'Instrument Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;}
.btnp{background:${c.grad};color:#fff;box-shadow:0 2px 12px ${c.accentGlow};}
.btnp:hover{filter:brightness(1.1);transform:translateY(-1px);}
.btng{background:${c.gradG};color:#fff;}
.btngh{background:${c.accentDim};color:${c.accent};border:1px solid ${c.border};}
.btnd{background:${c.redDim};color:${c.red};border:1px solid ${c.red}44;}
.btnsm{padding:6px 12px;font-size:12px;border-radius:8px;}
.btnicon{width:32px;height:32px;padding:0;border-radius:8px;justify-content:center;font-size:15px;}
.ibtn{background:${c.card};border:1.5px solid ${c.border};color:${c.text};width:38px;height:38px;border-radius:12px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.ibtn:hover{border-color:${c.accent};}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(10px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;}
@media(max-width:768px){.ovl{align-items:flex-end;padding:0;}}
.modal{background:${c.surf};border:1px solid ${c.border};border-radius:22px;padding:28px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:${c.shadow};}
.modal::-webkit-scrollbar{width:0;}
@media(max-width:768px){.modal{border-radius:22px 22px 0 0;max-width:100%;max-height:93vh;padding:22px;}}
.mhdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
.mtitle{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;}
.fg{margin-bottom:14px;}
.fl{font-size:10px;color:${c.sub};font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;display:block;}
.fi{width:100%;background:${c.card};border:1.5px solid ${c.border};border-radius:12px;padding:11px 14px;color:${c.text};font-family:'Instrument Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;}
.fi:focus{border-color:${c.accent};}
select.fi option{background:${c.card};}
.firow{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.cchip{background:${c.card};border:1.5px solid ${c.border};border-radius:11px;padding:9px 5px;text-align:center;cursor:pointer;font-size:10px;font-weight:700;transition:all .2s;color:${c.sub};}
.cchip:hover{border-color:${c.accent};}
.cchip.on{border-color:${c.accent};background:${c.accentDim};color:${c.accent};}
.cchip.ing.on{border-color:${c.green};background:${c.greenDim};color:${c.green};}
.ltgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.ltchip{background:${c.card};border:1.5px solid ${c.border};border-radius:11px;padding:9px 4px;text-align:center;cursor:pointer;font-size:10px;font-weight:700;transition:all .2s;color:${c.sub};}
.ltchip.on{border-color:${c.yellow};background:${c.yellowDim};color:${c.yellow};}
.mfooter{display:flex;gap:10px;justify-content:flex-end;margin-top:22px;}
.brow{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.blbl{font-size:12px;font-weight:600;width:100px;flex-shrink:0;display:flex;align-items:center;gap:5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.btrack{flex:1;height:8px;background:${c.border};border-radius:4px;overflow:hidden;}
.bfill{height:100%;border-radius:4px;transition:width .9s cubic-bezier(.4,0,.2,1);}
.bval{font-family:'JetBrains Mono',monospace;font-size:11px;color:${c.sub};width:72px;text-align:right;flex-shrink:0;}
.lcard{background:${c.card};border:1px solid ${c.border};border-radius:16px;padding:18px 20px;cursor:pointer;transition:border-color .2s;margin-bottom:12px;}
.lcard:hover{border-color:${c.accent};}
.lpbar{height:8px;background:${c.border};border-radius:4px;overflow:hidden;margin:10px 0 6px;}
.lpfill{height:100%;border-radius:4px;background:${c.gradG};transition:width .8s;}
.lgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;}
.lstat{background:${c.bg};border-radius:10px;padding:10px;text-align:center;}
.lsval{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;}
.lslbl{font-size:9px;color:${c.sub};margin-top:2px;font-weight:700;text-transform:uppercase;}
.ai-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
.ai-msgs::-webkit-scrollbar{width:0;}
.amsg{max-width:86%;line-height:1.58;font-size:13.5px;}
.amsg.user{align-self:flex-end;background:${c.grad};color:#fff;border-radius:18px 18px 4px 18px;padding:11px 15px;}
.amsg.assistant{align-self:flex-start;background:${c.card};border:1px solid ${c.border};border-radius:18px 18px 18px 4px;padding:11px 15px;white-space:pre-wrap;}
.aidots{display:flex;gap:4px;padding:2px 0;}
.aidot{width:6px;height:6px;border-radius:50%;background:${c.sub};animation:bdot 1.2s infinite;}
.aidot:nth-child(2){animation-delay:.2s;}.aidot:nth-child(3){animation-delay:.4s;}
@keyframes bdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
.aiquick{display:flex;gap:7px;padding:8px 16px;overflow-x:auto;flex-shrink:0;}
.aiquick::-webkit-scrollbar{height:0;}
.aqchip{white-space:nowrap;background:${c.card};border:1px solid ${c.border};border-radius:20px;padding:5px 12px;font-size:11.5px;cursor:pointer;color:${c.text};font-weight:600;transition:all .2s;}
.aqchip:hover{border-color:${c.accent};}
.aiir{padding:12px 16px;border-top:1px solid ${c.border};display:flex;gap:9px;flex-shrink:0;}
.aiin{flex:1;background:${c.card};border:1.5px solid ${c.border};border-radius:12px;padding:11px 14px;color:${c.text};font-family:'Instrument Sans',sans-serif;font-size:13.5px;outline:none;}
.aiin:focus{border-color:${c.accent};}
.aisd{background:${c.grad};border:none;border-radius:12px;width:44px;height:44px;cursor:pointer;color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.divider{height:1px;background:${c.border};margin:14px 0;}
.irow{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid ${c.border};font-size:13px;}
.irow:last-child{border:none;}
.ik{color:${c.sub};}.iv{font-weight:700;font-family:'JetBrains Mono',monospace;}
.filters{display:flex;gap:8px;flex-wrap:wrap;}
.fchip{border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid ${c.border};color:${c.sub};background:${c.card};transition:all .2s;white-space:nowrap;}
.fchip.on{background:${c.accentDim};border-color:${c.accent};color:${c.accent};}
.empty{text-align:center;padding:48px 20px;color:${c.sub};}
.empty-ico{font-size:44px;margin-bottom:10px;}
.spin{display:inline-block;width:18px;height:18px;border:2px solid ${c.border};border-top-color:${c.accent};border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-scr{display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:14px;color:${c.sub};}
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);padding:10px 22px;border-radius:30px;font-size:13px;font-weight:700;z-index:1000;animation:slideUp .3s ease;box-shadow:0 4px 20px rgba(0,0,0,.3);pointer-events:none;}
.toast.ok{background:${c.green};color:#fff;}.toast.err{background:${c.red};color:#fff;}
@keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
.errbanner{background:${c.redDim};border:1px solid ${c.red}44;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:${c.red};display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
`;

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTES DE PÁGINA — definidos fora do App para evitar remount
// ═════════════════════════════════════════════════════════════════════════════

function Dashboard({ c, incomes, expenses, loans, budgets, totalIncome, totalExpense,
  balance, savingsRate, totalLoansM, spentByCat, apiError, loadAll,
  setTab, setAiOpen, openEditInc, openEditExp, getDate }) {
  return (
    <div>
      {apiError && <ErrorBanner c={c} msg={apiError} onRetry={loadAll} />}
      <div className="hero">
        <div className="hero-lbl">Saldo Disponível · Março 2026</div>
        <div className="hero-amt">{fmt(balance)}</div>
        <div className="hero-chips">
          <div className="hchip">💰 {fmt(totalIncome)} receitas</div>
          <div className="hchip">📉 {fmt(totalExpense)} gastos</div>
          <div className="hchip">📊 {fmtPct(savingsRate)} poupança</div>
          <div className="hchip">💳 {fmt(totalLoansM)}/mês crédito</div>
        </div>
      </div>
      <div className="g4">
        {[
          { lbl: "Total Receitas", val: fmt(totalIncome), color: c.green, ico: "💰", sub: `${incomes.length} lançamentos` },
          { lbl: "Total Despesas", val: fmt(totalExpense), color: totalExpense > totalIncome * .8 ? c.red : c.yellow, ico: "💸", sub: `${expenses.length} lançamentos` },
          { lbl: "Taxa de Poupança", val: fmtPct(savingsRate), color: savingsRate > 20 ? c.green : c.yellow, ico: "📈", sub: "da renda total" },
          { lbl: "Crédito/mês", val: fmt(totalLoansM), color: c.purple, ico: "💳", sub: `${loans.filter(l => l.status === "active").length} ativos` },
        ].map(k => (
          <div className="kpi" key={k.lbl}>
            <div className="kpi-lbl">{k.ico} {k.lbl}</div>
            <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="g21">
        <div className="card">
          <div className="shdr">
            <span className="stitle">Gastos por Categoria</span>
            <button className="slink" onClick={() => setTab("budget")}>Ver orçamento →</button>
          </div>
          {CATS.map(ct => {
            const spent = spentByCat[ct.id] || 0, budget = budgets[ct.id] || 0;
            if (!spent && !budget) return null;
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const over = spent > budget && budget > 0;
            return (
              <div className="brow" key={ct.id}>
                <div className="blbl"><span>{ct.icon}</span>{ct.label}</div>
                <div className="btrack"><div className="bfill" style={{ width: `${pct}%`, background: over ? c.red : ct.color }} /></div>
                <div className="bval">{fmt(spent)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ background: c.gradG }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Total Receitas</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 500, color: "#fff" }}>{fmt(totalIncome)}</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {incomes.slice(0, 3).map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.85)" }}>
                  <span>{getICat(i.category_id).icon} {i.description}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{fmt(i.amount)}</span>
                </div>
              ))}
              {incomes.length > 3 && <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 2 }}>+{incomes.length - 3} outros</div>}
            </div>
          </div>
          <div className="card" style={{ borderLeft: `3px solid ${c.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: c.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>🤖 Insight Finn</div>
            <div style={{ fontSize: 13, color: c.sub, lineHeight: 1.55 }}>
              {savingsRate > 30 ? `Excelente! Poupando ${fmtPct(savingsRate)} da renda. 🚀`
                : totalExpense > totalIncome * .85 ? `⚠️ Gastos em ${fmtPct((totalExpense / totalIncome) * 100)} da renda. Revise categorias!`
                  : `${fmt(balance)} disponíveis este mês. Considere investir parte. 💡`}
            </div>
            <button className="btn btngh btnsm" style={{ marginTop: 10 }} onClick={() => setAiOpen(true)}>Conversar com Finn →</button>
          </div>
        </div>
      </div>
      <div className="shdr" style={{ marginTop: 4 }}>
        <span className="stitle">Últimos Lançamentos</span>
        <button className="slink" onClick={loadAll}>↻ Atualizar</button>
      </div>
      <div className="twrap">
        <table className="tbl">
          <thead><tr><th>Descrição</th><th className="hmob">Categoria</th><th className="hmob">Data</th><th>Valor</th><th></th></tr></thead>
          <tbody>
            {[...incomes.map(i => ({ ...i, _t: "income" })), ...expenses.map(e => ({ ...e, _t: "expense" }))]
              .sort((a, b) => new Date(getDate(b)) - new Date(getDate(a))).slice(0, 8)
              .map(item => {
                const isInc = item._t === "income";
                const ct = isInc ? getICat(item.category_id) : getCat(item.category_id);
                return (
                  <tr key={item._t + item.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="tico" style={{ background: ct.color + "22" }}>{ct.icon}</div>
                      <div><div className="tname">{item.description}</div><div className="tmeta">{isInc ? "Receita" : "Despesa"} · {ct.label}</div></div>
                    </div></td>
                    <td className="hmob"><span className="tag" style={{ background: ct.color + "22", color: ct.color }}>{ct.icon} {ct.label}</span></td>
                    <td className="hmob" style={{ color: c.sub, fontSize: 12 }}>{fmtDate(getDate(item))}</td>
                    <td><span className={isInc ? "tpos" : "tneg"}>{isInc ? "+" : "-"}{fmt(item.amount)}</span></td>
                    <td><div className="tact">
                      <button className="btn btngh btnsm btnicon" onClick={() => isInc ? openEditInc(item) : openEditExp(item)}>✏️</button>
                    </div></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IncomePage({ c, incomes, filteredInc, incFilter, setIncFilter, totalIncome,
  apiError, loadAll, openAddInc, openEditInc, setConfirmDel }) {
  return (
    <div>
      {apiError && <ErrorBanner c={c} msg={apiError} onRetry={loadAll} />}
      <div className="g3" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="kpi-lbl">💰 Total Receitas</div><div className="kpi-val" style={{ color: c.green }}>{fmt(totalIncome)}</div><div className="kpi-sub">{incomes.length} lançamentos</div></div>
        <div className="kpi"><div className="kpi-lbl">🔁 Recorrentes</div><div className="kpi-val" style={{ color: c.teal }}>{fmt(incomes.filter(i => i.recurrent).reduce((s, i) => s + i.amount, 0))}</div><div className="kpi-sub">{incomes.filter(i => i.recurrent).length} fontes</div></div>
        <div className="kpi"><div className="kpi-lbl">⚡ Avulsos</div><div className="kpi-val" style={{ color: c.yellow }}>{fmt(incomes.filter(i => !i.recurrent).reduce((s, i) => s + i.amount, 0))}</div><div className="kpi-sub">{incomes.filter(i => !i.recurrent).length} lançamentos</div></div>
      </div>
      <div className="shdr">
        <span className="stitle">Todas as Receitas</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="filters">
            {["Todos", "Recorrentes", "Avulsos"].map(f => <div key={f} className={`fchip${incFilter === f ? " on" : ""}`} onClick={() => setIncFilter(f)}>{f}</div>)}
          </div>
          <button className="btn btng donly" onClick={openAddInc}>+ Nova Receita</button>
        </div>
      </div>
      <div className="twrap">
        <table className="tbl">
          <thead><tr><th>Descrição</th><th>Categoria</th><th className="hmob">Data</th><th className="hmob">Tipo</th><th>Valor</th><th></th></tr></thead>
          <tbody>
            {filteredInc.length === 0 && <tr><td colSpan={6}><div className="empty"><div className="empty-ico">💰</div><div>Nenhuma receita cadastrada</div></div></td></tr>}
            {filteredInc.map(item => {
              const ct = getICat(item.category_id);
              return (
                <tr key={item.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="tico" style={{ background: ct.color + "22" }}>{ct.icon}</div>
                    <div><div className="tname">{item.description}</div>{item.notes && <div className="tmeta">{item.notes}</div>}</div>
                  </div></td>
                  <td><span className="tag" style={{ background: ct.color + "22", color: ct.color }}>{ct.icon} {ct.label}</span></td>
                  <td className="hmob" style={{ color: c.sub, fontSize: 12 }}>{fmtDate(item.date)}</td>
                  <td className="hmob"><span className="tag" style={{ background: item.recurrent ? c.tealDim : c.yellowDim, color: item.recurrent ? c.teal : c.yellow }}>{item.recurrent ? "🔁 Recorrente" : "⚡ Avulso"}</span></td>
                  <td><span className="tpos">+{fmt(item.amount)}</span></td>
                  <td><div className="tact">
                    <button className="btn btngh btnsm btnicon" onClick={() => openEditInc(item)}>✏️</button>
                    <button className="btn btnd btnsm btnicon" onClick={() => setConfirmDel({ type: "income", id: item.id, label: item.description })}>🗑️</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpensesPage({ c, expenses, filteredExp, expFilter, setExpFilter, totalExpense,
  apiError, loadAll, openAddExp, openEditExp, setConfirmDel, getDate }) {
  return (
    <div>
      {apiError && <ErrorBanner c={c} msg={apiError} onRetry={loadAll} />}
      <div className="g4" style={{ marginBottom: 18 }}>
        {[
          { lbl: "Total Gasto", val: fmt(totalExpense), color: c.red, ico: "💸" },
          { lbl: "Fixas", val: fmt(expenses.filter(e => e.type === "fixed").reduce((s, e) => s + e.amount, 0)), color: c.yellow, ico: "📌" },
          { lbl: "Variáveis", val: fmt(expenses.filter(e => e.type === "variable").reduce((s, e) => s + e.amount, 0)), color: c.accent, ico: "📊" },
          { lbl: "Assinaturas", val: fmt(expenses.filter(e => e.type === "subscription").reduce((s, e) => s + e.amount, 0)), color: c.purple, ico: "🔁" },
        ].map(k => <div className="kpi" key={k.lbl}><div className="kpi-lbl">{k.ico} {k.lbl}</div><div className="kpi-val" style={{ color: k.color }}>{k.val}</div></div>)}
      </div>
      <div className="shdr">
        <span className="stitle">Todas as Despesas</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="filters">
            {["Todas", "Fixas", "Variáveis", "Assinaturas"].map(f => <div key={f} className={`fchip${expFilter === f ? " on" : ""}`} onClick={() => setExpFilter(f)}>{f}</div>)}
          </div>
          <button className="btn btnp donly" onClick={openAddExp}>+ Nova Despesa</button>
        </div>
      </div>
      <div className="twrap">
        <table className="tbl">
          <thead><tr><th>Descrição</th><th>Categoria</th><th className="hmob">Data</th><th className="hmob">Tipo</th><th>Valor</th><th></th></tr></thead>
          <tbody>
            {filteredExp.length === 0 && <tr><td colSpan={6}><div className="empty"><div className="empty-ico">💸</div><div>Nenhuma despesa</div></div></td></tr>}
            {filteredExp.map(item => {
              const ct = getCat(item.category_id);
              const typeMap = { fixed: ["📌 Fixa", c.yellow, c.yellowDim], variable: ["📊 Variável", c.accent, c.accentDim], subscription: ["🔁 Assinatura", c.purple, c.purpleDim] };
              const [tl, tc, tcd] = typeMap[item.type] || ["—", c.sub, c.muted];
              return (
                <tr key={item.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="tico" style={{ background: ct.color + "22" }}>{ct.icon}</div>
                    <div><div className="tname">{item.description}</div>{item.notes && <div className="tmeta">{item.notes}</div>}</div>
                  </div></td>
                  <td><span className="tag" style={{ background: ct.color + "22", color: ct.color }}>{ct.icon} {ct.label}</span></td>
                  <td className="hmob" style={{ color: c.sub, fontSize: 12 }}>{fmtDate(getDate(item))}</td>
                  <td className="hmob"><span className="tag" style={{ background: tcd, color: tc }}>{tl}</span></td>
                  <td><span className="tneg">-{fmt(item.amount)}</span></td>
                  <td><div className="tact">
                    <button className="btn btngh btnsm btnicon" onClick={() => openEditExp(item)}>✏️</button>
                    <button className="btn btnd btnsm btnicon" onClick={() => setConfirmDel({ type: "expense", id: item.id, label: item.description })}>🗑️</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BudgetPage({ c, budgets, spentByCat }) {
  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const overCount = CATS.filter(ct => (spentByCat[ct.id] || 0) > (budgets[ct.id] || 0) && budgets[ct.id] > 0).length;
  return (
    <div>
      <div className="g2" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="kpi-lbl">🎯 Orçamento Total</div><div className="kpi-val" style={{ color: c.accent }}>{fmt(totalBudget)}</div></div>
        <div className="kpi"><div className="kpi-lbl">⚠️ Categorias no Limite</div><div className="kpi-val" style={{ color: c.red }}>{overCount}</div><div className="kpi-sub">de {CATS.filter(ct => budgets[ct.id] > 0).length} com orçamento</div></div>
      </div>
      <div className="twrap">
        <table className="tbl">
          <thead><tr><th>Categoria</th><th>Gasto</th><th>Orçamento</th><th>Progresso</th><th>Status</th></tr></thead>
          <tbody>
            {CATS.map(ct => {
              const spent = spentByCat[ct.id] || 0, budget = budgets[ct.id] || 0;
              const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
              const over = spent > budget && budget > 0;
              return (
                <tr key={ct.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="tico" style={{ background: ct.color + "22" }}>{ct.icon}</div><div className="tname">{ct.label}</div></div></td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: over ? c.red : c.text }}>{fmt(spent)}</td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: c.sub }}>{fmt(budget)}</td>
                  <td style={{ minWidth: 140 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="btrack" style={{ flex: 1 }}><div className="bfill" style={{ width: `${pct}%`, background: over ? c.red : ct.color }} /></div>
                    <span style={{ fontSize: 11, color: c.sub, width: 34, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                  </div></td>
                  <td>{over
                    ? <span className="tag" style={{ background: c.redDim, color: c.red }}>⚠️ +{fmt(spent - budget)}</span>
                    : budget > 0 ? <span className="tag" style={{ background: c.greenDim, color: c.green }}>✓ {fmt(budget - spent)}</span>
                      : <span className="tag" style={{ background: c.muted + "44", color: c.sub }}>Sem limite</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoansPage({ c, loans, totalLoansM, apiError, loadAll, openAddLoan, openEditLoan, setConfirmDel, setLoanDetail }) {
  const active = loans.filter(l => l.status === "active");
  const paid = loans.filter(l => l.status === "paid");
  return (
    <div>
      {apiError && <ErrorBanner c={c} msg={apiError} onRetry={loadAll} />}
      <div className="g4" style={{ marginBottom: 18 }}>
        {[
          { lbl: "Comprometido/mês", val: fmt(totalLoansM), color: c.yellow, ico: "📅" },
          { lbl: "Total Restante", val: fmt(active.reduce((s, l) => s + (l.remaining_amount || 0), 0)), color: c.red, ico: "💰" },
          { lbl: "Ativos", val: String(active.length), color: c.accent, ico: "📋" },
          { lbl: "Quitados", val: String(paid.length), color: c.green, ico: "✅" },
        ].map(k => <div className="kpi" key={k.lbl}><div className="kpi-lbl">{k.ico} {k.lbl}</div><div className="kpi-val" style={{ color: k.color }}>{k.val}</div></div>)}
      </div>
      <div className="shdr"><span className="stitle">Ativos</span><button className="btn btnp donly" onClick={openAddLoan}>+ Novo</button></div>
      {active.length === 0 && <div className="empty"><div className="empty-ico">🎉</div><div>Nenhum empréstimo ativo!</div></div>}
      {active.map(loan => {
        const ltype = getLT(loan.loan_type);
        return (
          <div className="lcard" key={loan.id} onClick={() => setLoanDetail(loan)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.sub, textTransform: "uppercase", letterSpacing: "1px" }}>{ltype.icon} {ltype.label} · {loan.institution}</div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, fontWeight: 700, margin: "4px 0" }}>{loan.description}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span className="tag" style={{ background: c.greenDim, color: c.green }}>● Ativo</span>
                <button className="btn btngh btnsm btnicon" onClick={e => { e.stopPropagation(); openEditLoan(loan); }}>✏️</button>
                <button className="btn btnd btnsm btnicon" onClick={e => { e.stopPropagation(); setConfirmDel({ type: "loan", id: loan.id, label: loan.description }); }}>🗑️</button>
              </div>
            </div>
            <div className="lpbar"><div className="lpfill" style={{ width: `${loan.progress_pct || 0}%` }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.sub, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>
              <span>{loan.paid_installments}/{loan.total_installments} parcelas</span>
              <span style={{ color: c.green, fontWeight: 700 }}>{fmtPct(loan.progress_pct)}</span>
            </div>
            <div className="lgrid">
              {[{ v: fmt(loan.monthly_payment), l: "Parcela", color: c.yellow }, { v: fmt(loan.remaining_amount), l: "Restante", color: c.red }, { v: `${loan.interest_rate}%`, l: "Juros a.m.", color: c.sub }].map(s => (
                <div className="lstat" key={s.l}><div className="lsval" style={{ color: s.color }}>{s.v}</div><div className="lslbl">{s.l}</div></div>
              ))}
            </div>
          </div>
        );
      })}
      {paid.length > 0 && <>
        <div className="shdr" style={{ marginTop: 8 }}><span className="stitle">Quitados ✓</span></div>
        {paid.map(loan => (
          <div key={loan.id} style={{ opacity: .55 }} className="lcard" onClick={() => setLoanDetail(loan)}>
            <div style={{ fontSize: 10, color: c.sub, fontWeight: 700 }}>✓ {loan.institution} · {getLT(loan.loan_type).label}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 15, fontWeight: 700, margin: "3px 0" }}>{loan.description}</div>
            <div style={{ fontSize: 12, color: c.green, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{fmt(loan.total_amount)} quitado</div>
          </div>
        ))}
      </>}
    </div>
  );
}

function ErrorBanner({ c, msg, onRetry }) {
  return (
    <div className="errbanner">
      ⚠️ {msg}
      <button className="btn btngh btnsm" onClick={onRetry} style={{ marginLeft: "auto" }}>Tentar novamente</button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODAIS
// ═════════════════════════════════════════════════════════════════════════════

function ExpModal({ c, editingExp, expForm, setExpForm, onSave, onClose, saving }) {
  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr"><div className="mtitle">{editingExp ? "Editar Despesa" : "Nova Despesa"}</div><button className="ibtn" onClick={onClose}>✕</button></div>
        <div className="fg"><label className="fl">Descrição</label><input className="fi" placeholder="Ex: Almoço, Uber, Conta de luz..." value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="firow">
          <div className="fg"><label className="fl">Valor (R$)</label><input className="fi" type="number" placeholder="0,00" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Data</label><input className="fi" type="date" value={expForm.date || ""} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} /></div>
        </div>
        <div className="fg"><label className="fl">Tipo</label>
          <select className="fi" value={expForm.type} onChange={e => setExpForm(p => ({ ...p, type: e.target.value }))}>
            <option value="variable">📊 Variável</option><option value="fixed">📌 Fixa</option><option value="subscription">🔁 Assinatura</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Categoria</label>
          <div className="cgrid">{CATS.map(ct => <div key={ct.id} className={`cchip${expForm.category_id === ct.id ? " on" : ""}`} onClick={() => setExpForm(p => ({ ...p, category_id: ct.id }))}><div style={{ fontSize: 18 }}>{ct.icon}</div><div style={{ marginTop: 3 }}>{ct.label}</div></div>)}</div>
        </div>
        <div className="fg"><label className="fl">Observações</label><input className="fi" placeholder="Opcional..." value={expForm.notes || ""} onChange={e => setExpForm(p => ({ ...p, notes: e.target.value }))} /></div>
        <div className="mfooter">
          <button className="btn btngh" onClick={onClose}>Cancelar</button>
          <button className="btn btnp" onClick={onSave} disabled={saving}>{saving ? <span className="spin" /> : (editingExp ? "Salvar" : "Adicionar")}</button>
        </div>
      </div>
    </div>
  );
}

function IncModal({ c, editingInc, incForm, setIncForm, onSave, onClose, saving }) {
  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr"><div className="mtitle">{editingInc ? "Editar Receita" : "Nova Receita"}</div><button className="ibtn" onClick={onClose}>✕</button></div>
        <div className="fg"><label className="fl">Descrição</label><input className="fi" placeholder="Ex: Salário, Projeto, Dividendos..." value={incForm.description} onChange={e => setIncForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="firow">
          <div className="fg"><label className="fl">Valor (R$)</label><input className="fi" type="number" placeholder="0,00" value={incForm.amount} onChange={e => setIncForm(p => ({ ...p, amount: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Data</label><input className="fi" type="date" value={incForm.date || ""} onChange={e => setIncForm(p => ({ ...p, date: e.target.value }))} /></div>
        </div>
        <div className="fg"><label className="fl">Tipo</label>
          <select className="fi" value={incForm.recurrent ? "true" : "false"} onChange={e => setIncForm(p => ({ ...p, recurrent: e.target.value === "true" }))}>
            <option value="false">⚡ Avulso (único)</option><option value="true">🔁 Recorrente (mensal)</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Categoria</label>
          <div className="cgrid">{INC_CATS.map(ct => <div key={ct.id} className={`cchip ing${incForm.category_id === ct.id ? " on" : ""}`} onClick={() => setIncForm(p => ({ ...p, category_id: ct.id }))}><div style={{ fontSize: 18 }}>{ct.icon}</div><div style={{ marginTop: 3 }}>{ct.label}</div></div>)}</div>
        </div>
        <div className="fg"><label className="fl">Observações</label><input className="fi" placeholder="Opcional..." value={incForm.notes || ""} onChange={e => setIncForm(p => ({ ...p, notes: e.target.value }))} /></div>
        <div className="mfooter">
          <button className="btn btngh" onClick={onClose}>Cancelar</button>
          <button className="btn btng" onClick={onSave} disabled={saving}>{saving ? <span className="spin" /> : (editingInc ? "Salvar" : "Adicionar")}</button>
        </div>
      </div>
    </div>
  );
}

function LoanModal({ c, editingLoan, loanForm, setLoanForm, onSave, onClose, saving }) {
  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr"><div className="mtitle">{editingLoan ? "Editar Empréstimo" : "Novo Empréstimo"}</div><button className="ibtn" onClick={onClose}>✕</button></div>
        <div className="fg"><label className="fl">Tipo de Crédito</label>
          <div className="ltgrid">{LOAN_TYPES.map(lt => <div key={lt.id} className={`ltchip${loanForm.loan_type === lt.id ? " on" : ""}`} onClick={() => setLoanForm(p => ({ ...p, loan_type: lt.id }))}><div style={{ fontSize: 18, marginBottom: 3 }}>{lt.icon}</div><div>{lt.label}</div></div>)}</div>
        </div>
        <div className="firow">
          <div className="fg"><label className="fl">Instituição</label><input className="fi" placeholder="Banco do Brasil, Nubank..." value={loanForm.institution} onChange={e => setLoanForm(p => ({ ...p, institution: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Descrição</label><input className="fi" placeholder="Empréstimo Pessoal..." value={loanForm.description} onChange={e => setLoanForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
        <div className="firow">
          <div className="fg"><label className="fl">Valor Total (R$)</label><input className="fi" type="number" placeholder="15000" value={loanForm.total_amount} onChange={e => setLoanForm(p => ({ ...p, total_amount: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Parcela (R$)</label><input className="fi" type="number" placeholder="650" value={loanForm.monthly_payment} onChange={e => setLoanForm(p => ({ ...p, monthly_payment: e.target.value }))} /></div>
        </div>
        <div className="firow">
          <div className="fg"><label className="fl">Nº Parcelas</label><input className="fi" type="number" placeholder="24" value={loanForm.total_installments} onChange={e => setLoanForm(p => ({ ...p, total_installments: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Já Pagas</label><input className="fi" type="number" placeholder="0" value={loanForm.paid_installments} onChange={e => setLoanForm(p => ({ ...p, paid_installments: e.target.value }))} /></div>
        </div>
        <div className="firow">
          <div className="fg"><label className="fl">Juros (% a.m.)</label><input className="fi" type="number" step="0.01" placeholder="1.99" value={loanForm.interest_rate} onChange={e => setLoanForm(p => ({ ...p, interest_rate: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Data de Início</label><input className="fi" type="date" value={loanForm.start_date || ""} onChange={e => setLoanForm(p => ({ ...p, start_date: e.target.value }))} /></div>
        </div>
        <div className="fg"><label className="fl">Observações</label><input className="fi" placeholder="Opcional..." value={loanForm.notes || ""} onChange={e => setLoanForm(p => ({ ...p, notes: e.target.value }))} /></div>
        <div className="mfooter">
          <button className="btn btngh" onClick={onClose}>Cancelar</button>
          <button className="btn btnp" onClick={onSave} disabled={saving}>{saving ? <span className="spin" /> : (editingLoan ? "Salvar" : "Cadastrar")}</button>
        </div>
      </div>
    </div>
  );
}

function LoanDetailModal({ c, loan, onClose, onEdit, onDelete, onPay }) {
  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr"><div className="mtitle">{getLT(loan.loan_type).icon} {loan.institution}</div><button className="ibtn" onClick={onClose}>✕</button></div>
        <div style={{ background: c.card, borderRadius: 14, border: `1px solid ${c.border}`, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: c.sub, marginBottom: 4 }}>{loan.description}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 500 }}>{fmt(loan.total_amount)}</div>
          <div style={{ marginTop: 6 }}><span className="tag" style={{ background: c.greenDim, color: c.green }}>● {loan.status === "paid" ? "Quitado" : "Ativo"}</span></div>
        </div>
        <div className="lpbar" style={{ height: 11 }}><div className="lpfill" style={{ width: `${loan.progress_pct || 0}%` }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: c.sub, marginBottom: 14 }}>
          <span>{loan.paid_installments} pagas</span>
          <span style={{ color: c.green, fontWeight: 700 }}>{fmtPct(loan.progress_pct)}</span>
          <span>{loan.remaining_installments} restantes</span>
        </div>
        <div className="divider" />
        {[
          ["Parcela mensal", fmt(loan.monthly_payment), c.yellow],
          ["Taxa de juros", `${loan.interest_rate}% a.m.`, null],
          ["Valor pago", fmt(loan.amount_paid), c.green],
          ["Valor restante", fmt(loan.remaining_amount), c.red],
          ["Juros totais", fmt(loan.total_interest), null],
          ["Data início", fmtDate(loan.start_date), null],
        ].map(([k, v, col]) => (
          <div className="irow" key={k}><span className="ik">{k}</span><span className="iv" style={col ? { color: col } : {}}>{v}</span></div>
        ))}
        <div className="mfooter" style={{ flexWrap: "wrap" }}>
          {loan.status === "active" && loan.paid_installments < loan.total_installments && <button className="btn btng" onClick={onPay}>✓ Pagar Parcela</button>}
          <button className="btn btngh" onClick={onEdit}>✏️ Editar</button>
          <button className="btn btnd" onClick={onDelete}>🗑️ Excluir</button>
          <button className="btn btngh" style={{ marginLeft: "auto" }} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ c, confirmDel, onConfirm, onClose }) {
  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400, textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>🗑️</div>
        <div className="mtitle" style={{ justifyContent: "center", marginBottom: 10 }}>Confirmar Exclusão</div>
        <div style={{ fontSize: 14, color: c.sub, marginBottom: 22 }}>
          Excluir <strong style={{ color: c.text }}>"{confirmDel.label}"</strong>?<br />Esta ação não pode ser desfeita.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btngh" onClick={onClose}>Cancelar</button>
          <button className="btn btnd" onClick={onConfirm}>Sim, excluir</button>
        </div>
      </div>
    </div>
  );
}

function AIModal({ c, aiMsgs, aiLoading, aiInput, setAiInput, onSend, onClose, chatEndRef }) {
  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, height: "70vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>🤖</div>
          <div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15 }}>Finn — Assistente Financeiro</div>
            <div style={{ fontSize: 11, color: c.green, fontWeight: 700 }}>● Conectado ao banco de dados</div>
          </div>
          <button className="ibtn" style={{ marginLeft: "auto" }} onClick={onClose}>✕</button>
        </div>
        <div className="ai-msgs">
          {aiMsgs.map((m, i) => <div key={i} className={`amsg ${m.role}`}>{m.content}</div>)}
          {aiLoading && <div className="amsg assistant"><div className="aidots"><div className="aidot" /><div className="aidot" /><div className="aidot" /></div></div>}
          <div ref={chatEndRef} />
        </div>
        <div className="aiquick">
          {["Como economizar?", "Analisar receitas", "Reduzir dívidas", "Meta de poupança", "Revisão mensal"].map(q => (
            <div key={q} className="aqchip" onClick={() => setAiInput(q)}>{q}</div>
          ))}
        </div>
        <div className="aiir">
          <input className="aiin" placeholder="Pergunte sobre suas finanças..." value={aiInput}
            onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && onSend()} />
          <button className="aisd" onClick={onSend}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [tab, setTab] = useState("dash");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loans, setLoans] = useState([]);
  const [budgets, setBudgets] = useState({});

  const [showExpModal, setShowExpModal] = useState(false);
  const [showIncModal, setShowIncModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [editingInc, setEditingInc] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [expFilter, setExpFilter] = useState("Todas");
  const [incFilter, setIncFilter] = useState("Todos");

  const blankExp = { description: "", category_id: "alimentacao", amount: "", date: today(), type: "variable", notes: "" };
  const blankInc = { description: "", category_id: "salario", amount: "", date: today(), recurrent: false, notes: "" };
  const blankLoan = { institution: "", description: "", total_amount: "", monthly_payment: "", interest_rate: "", start_date: "", end_date: "", total_installments: "", paid_installments: "0", loan_type: "personal", notes: "" };

  const [expForm, setExpForm] = useState(blankExp);
  const [incForm, setIncForm] = useState(blankInc);
  const [loanForm, setLoanForm] = useState(blankLoan);

  const [aiMsgs, setAiMsgs] = useState([{ role: "assistant", content: "Olá! Sou o Finn 🤖\n\nSeus dados estão conectados ao banco de dados em tempo real. Como posso te ajudar hoje?" }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  const c = THEMES[theme];

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = buildCSS(c); s.id = "fts";
    document.getElementById("fts")?.remove();
    document.head.appendChild(s);
  }, [theme]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMsgs]);

  // ── Carregar dados ─────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true); setApiError(null);
    try {
      const [exps, incs, lns, buds] = await Promise.all([
        api.getExpenses(3, 2026), api.getIncomes(3, 2026),
        api.getLoans(), api.getBudgets(3, 2026),
      ]);
      setExpenses(exps || []);
      setIncomes(incs || []);
      setLoans(lns || []);
      const budMap = {};
      (buds || []).forEach(b => { budMap[b.category_id] = b.amount; });
      setBudgets(budMap);
    } catch {
      setApiError("Não foi possível conectar ao backend. Verifique se está rodando em " + API);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  // ── Derivados ──────────────────────────────────────────────────────────────
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const totalLoansM = loans.filter(l => l.status === "active").reduce((s, l) => s + l.monthly_payment, 0);
  const spentByCat = {};
  CATS.forEach(ct => { spentByCat[ct.id] = expenses.filter(e => e.category_id === ct.id).reduce((s, e) => s + e.amount, 0); });

  const filteredExp = expenses
    .filter(e => expFilter === "Fixas" ? e.type === "fixed" : expFilter === "Variáveis" ? e.type === "variable" : expFilter === "Assinaturas" ? e.type === "subscription" : true)
    .sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));

  const filteredInc = incomes
    .filter(i => incFilter === "Recorrentes" ? i.recurrent : incFilter === "Avulsos" ? !i.recurrent : true)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── Expense CRUD ───────────────────────────────────────────────────────────
  const openAddExp = () => { setExpForm(blankExp); setEditingExp(null); setShowExpModal(true); };
  const openEditExp = (e) => { setExpForm({ ...e, amount: String(e.amount), date: getDate(e) }); setEditingExp(e.id); setShowExpModal(true); };
  const saveExp = async () => {
    if (!expForm.description || !expForm.amount) return;
    setSaving(true);
    try {
      const body = { ...expForm, amount: parseFloat(expForm.amount) };
      if (editingExp) {
        const u = await api.updateExpense(editingExp, body);
        setExpenses(p => p.map(e => e.id === editingExp ? u : e));
        showToast("✏️ Despesa atualizada");
      } else {
        const cr = await api.createExpense(body);
        setExpenses(p => [cr, ...p]);
        showToast("✅ Despesa adicionada");
      }
      setShowExpModal(false);
    } catch (err) { showToast("❌ " + err.message, "err"); }
    setSaving(false);
  };
  const deleteExp = async (id) => {
    try { await api.deleteExpense(id); setExpenses(p => p.filter(e => e.id !== id)); showToast("🗑️ Removida"); }
    catch { showToast("❌ Erro ao excluir", "err"); }
  };

  // ── Income CRUD ────────────────────────────────────────────────────────────
  const openAddInc = () => { setIncForm(blankInc); setEditingInc(null); setShowIncModal(true); };
  const openEditInc = (i) => { setIncForm({ ...i, amount: String(i.amount) }); setEditingInc(i.id); setShowIncModal(true); };
  const saveInc = async () => {
    if (!incForm.description || !incForm.amount) return;
    setSaving(true);
    try {
      const body = { ...incForm, amount: parseFloat(incForm.amount) };
      if (editingInc) {
        const u = await api.updateIncome(editingInc, body);
        setIncomes(p => p.map(i => i.id === editingInc ? u : i));
        showToast("✏️ Receita atualizada");
      } else {
        const cr = await api.createIncome(body);
        setIncomes(p => [cr, ...p]);
        showToast("✅ Receita adicionada");
      }
      setShowIncModal(false);
    } catch (err) { showToast("❌ " + err.message, "err"); }
    setSaving(false);
  };
  const deleteInc = async (id) => {
    try { await api.deleteIncome(id); setIncomes(p => p.filter(i => i.id !== id)); showToast("🗑️ Removida"); }
    catch { showToast("❌ Erro ao excluir", "err"); }
  };

  // ── Loan CRUD ──────────────────────────────────────────────────────────────
  const openAddLoan = () => { setLoanForm(blankLoan); setEditingLoan(null); setShowLoanModal(true); };
  const openEditLoan = (l) => {
    setLoanForm({
      ...l, total_amount: String(l.total_amount), monthly_payment: String(l.monthly_payment),
      interest_rate: String(l.interest_rate), total_installments: String(l.total_installments),
      paid_installments: String(l.paid_installments)
    });
    setEditingLoan(l.id); setShowLoanModal(true);
  };
  const saveLoan = async () => {
    if (!loanForm.institution || !loanForm.total_amount) return;
    setSaving(true);
    try {
      const body = {
        ...loanForm, total_amount: parseFloat(loanForm.total_amount),
        monthly_payment: parseFloat(loanForm.monthly_payment) || 0,
        interest_rate: parseFloat(loanForm.interest_rate) || 0,
        total_installments: parseInt(loanForm.total_installments) || 12,
        paid_installments: parseInt(loanForm.paid_installments) || 0
      };
      if (editingLoan) {
        const u = await api.updateLoan(editingLoan, body);
        setLoans(p => p.map(l => l.id === editingLoan ? u : l));
        if (loanDetail?.id === editingLoan) setLoanDetail(u);
        showToast("✏️ Atualizado");
      } else {
        const cr = await api.createLoan(body);
        setLoans(p => [cr, ...p]);
        showToast("✅ Cadastrado");
      }
      setShowLoanModal(false);
    } catch (err) { showToast("❌ " + err.message, "err"); }
    setSaving(false);
  };
  const deleteLoan = async (id) => {
    try { await api.deleteLoan(id); setLoans(p => p.filter(l => l.id !== id)); setLoanDetail(null); showToast("🗑️ Removido"); }
    catch { showToast("❌ Erro ao excluir", "err"); }
  };
  const payInstallment = async (loanId) => {
    try {
      const u = await api.payInstallment(loanId);
      setLoans(p => p.map(l => l.id === loanId ? u : l));
      if (loanDetail?.id === loanId) setLoanDetail(u);
      showToast("✅ Parcela registrada");
    } catch { showToast("❌ Erro", "err"); }
  };

  const doConfirmDelete = async () => {
    if (!confirmDel) return;
    const { type, id } = confirmDel;
    if (type === "expense") await deleteExp(id);
    else if (type === "income") await deleteInc(id);
    else if (type === "loan") await deleteLoan(id);
    setConfirmDel(null);
  };

  // ── IA ─────────────────────────────────────────────────────────────────────
  const sendAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const msg = aiInput.trim(); setAiInput(""); setAiLoading(true);
    setAiMsgs(p => [...p, { role: "user", content: msg }]);
    try {
      const res = await api.aiChat([...aiMsgs.slice(-6), { role: "user", content: msg }]);
      setAiMsgs(p => [...p, { role: "assistant", content: res.reply || "Sem resposta." }]);
    } catch {
      try {
        const ctx = `Dados Março/2026: Renda=${fmt(totalIncome)}, Gastos=${fmt(totalExpense)}, Saldo=${fmt(balance)}, Poupança=${fmtPct(savingsRate)}.`;
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 1000,
            system: `Você é Finn, assistente financeiro. ${ctx} Responda em português, máx 180 palavras.`,
            messages: [...aiMsgs.slice(-6), { role: "user", content: msg }]
          })
        });
        const d = await r.json();
        setAiMsgs(p => [...p, { role: "assistant", content: d.content?.[0]?.text || "Erro." }]);
      } catch { setAiMsgs(p => [...p, { role: "assistant", content: "⚠️ Erro de conexão com a IA." }]); }
    }
    setAiLoading(false);
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="app">
      <style>{buildCSS(c)}</style>
      <div className="loading-scr">
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight: 800 }}>
          fintech<span style={{ background: c.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.</span>ai
        </div>
        <div className="spin" />
        <div style={{ fontSize: 13 }}>Conectando ao banco de dados...</div>
        <div style={{ fontSize: 11, color: c.muted }}>{API}</div>
      </div>
    </div>
  );

  const sharedPageProps = { c, apiError, loadAll };
  const addAction = tab === "income" ? openAddInc : tab === "loans" ? openAddLoan : openAddExp;

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <div className="sidebar">
        <div className="s-logo">
          <div className="s-logoname">fintech<span className="s-logoemph">.ai</span></div>
          <div className="s-logosub">Controle Financeiro</div>
        </div>
        <div className="s-sec">Principal</div>
        {NAV.map(n => (
          <div key={n.id} className={`s-item${tab === n.id ? " on" : ""}`} onClick={() => setTab(n.id)}>
            <span className="s-ico">{n.icon}</span>{n.label}
          </div>
        ))}
        <div className="s-sec" style={{ marginTop: 16 }}>Lançamentos</div>
        <div className="s-item" onClick={openAddInc}><span className="s-ico">💰</span>Nova Receita</div>
        <div className="s-item" onClick={openAddExp}><span className="s-ico">➕</span>Nova Despesa</div>
        <div className="s-item" onClick={openAddLoan}><span className="s-ico">💳</span>Novo Empréstimo</div>
        <div className="s-bottom">
          <div className="s-item" style={{ padding: "8px 0" }} onClick={() => setAiOpen(true)}><span className="s-ico">🤖</span>Finn IA</div>
          <div className="s-item" style={{ padding: "8px 0" }} onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            <span className="s-ico">{theme === "dark" ? "☀️" : "🌙"}</span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{PAGE_LABELS[tab]}</div>
          <div className="topbar-actions">
            {tab === "income" && <button className="btn btng" onClick={openAddInc}>+ Nova Receita</button>}
            {tab === "expenses" && <button className="btn btnp" onClick={openAddExp}>+ Nova Despesa</button>}
            {tab === "loans" && <button className="btn btnp" onClick={openAddLoan}>+ Novo Empréstimo</button>}
            {tab === "dash" && <><button className="btn btng" onClick={openAddInc}>+ Receita</button><button className="btn btnp" onClick={openAddExp}>+ Despesa</button></>}
            <button className="ibtn" onClick={() => setAiOpen(true)} title="Finn IA">🤖</button>
            <button className="ibtn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀️" : "🌙"}</button>
          </div>
        </div>
        <div className="content">
          {tab === "dash" && <Dashboard {...sharedPageProps} incomes={incomes} expenses={expenses} loans={loans} budgets={budgets} totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} savingsRate={savingsRate} totalLoansM={totalLoansM} spentByCat={spentByCat} setTab={setTab} setAiOpen={setAiOpen} openEditInc={openEditInc} openEditExp={openEditExp} getDate={getDate} />}
          {tab === "income" && <IncomePage {...sharedPageProps} incomes={incomes} filteredInc={filteredInc} incFilter={incFilter} setIncFilter={setIncFilter} totalIncome={totalIncome} openAddInc={openAddInc} openEditInc={openEditInc} setConfirmDel={setConfirmDel} />}
          {tab === "expenses" && <ExpensesPage {...sharedPageProps} expenses={expenses} filteredExp={filteredExp} expFilter={expFilter} setExpFilter={setExpFilter} totalExpense={totalExpense} openAddExp={openAddExp} openEditExp={openEditExp} setConfirmDel={setConfirmDel} getDate={getDate} />}
          {tab === "budget" && <BudgetPage c={c} budgets={budgets} spentByCat={spentByCat} />}
          {tab === "loans" && <LoansPage {...sharedPageProps} loans={loans} totalLoansM={totalLoansM} openAddLoan={openAddLoan} openEditLoan={openEditLoan} setConfirmDel={setConfirmDel} setLoanDetail={setLoanDetail} />}
        </div>
      </div>

      {/* ── MOBILE NAV ── */}
      <div className="bnav">
        {NAV.map(n => <button key={n.id} className={`nb${tab === n.id ? " on" : ""}`} onClick={() => setTab(n.id)}><span className="nb-ico">{n.icon}</span>{n.label}</button>)}
      </div>
      <button className="fab monly" onClick={addAction}>+</button>

      {/* ── MODAIS ── */}
      {showExpModal && <ExpModal c={c} editingExp={editingExp} expForm={expForm} setExpForm={setExpForm} onSave={saveExp} onClose={() => setShowExpModal(false)} saving={saving} />}
      {showIncModal && <IncModal c={c} editingInc={editingInc} incForm={incForm} setIncForm={setIncForm} onSave={saveInc} onClose={() => setShowIncModal(false)} saving={saving} />}
      {showLoanModal && <LoanModal c={c} editingLoan={editingLoan} loanForm={loanForm} setLoanForm={setLoanForm} onSave={saveLoan} onClose={() => setShowLoanModal(false)} saving={saving} />}
      {loanDetail && <LoanDetailModal c={c} loan={loanDetail} onClose={() => setLoanDetail(null)} onEdit={() => { openEditLoan(loanDetail); setLoanDetail(null); }} onDelete={() => { setConfirmDel({ type: "loan", id: loanDetail.id, label: loanDetail.description }); setLoanDetail(null); }} onPay={() => payInstallment(loanDetail.id)} />}
      {confirmDel && <ConfirmModal c={c} confirmDel={confirmDel} onConfirm={doConfirmDelete} onClose={() => setConfirmDel(null)} />}
      {aiOpen && <AIModal c={c} aiMsgs={aiMsgs} aiLoading={aiLoading} aiInput={aiInput} setAiInput={setAiInput} onSend={sendAI} onClose={() => setAiOpen(false)} chatEndRef={chatEndRef} />}

      {/* ── TOAST ── */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
