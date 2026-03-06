import { useState, useEffect, useRef } from "react";

const T = {
  dark: {
    bg:"#080A10",surf:"#0F1117",card:"#14161E",border:"#1C1F2E",
    accent:"#5B7CFA",accentDim:"rgba(91,124,250,0.12)",accentGlow:"rgba(91,124,250,0.25)",
    green:"#0EC97F",greenDim:"rgba(14,201,127,0.12)",
    red:"#F04E6A",redDim:"rgba(240,78,106,0.12)",
    yellow:"#F5A623",yellowDim:"rgba(245,166,35,0.12)",
    purple:"#A855F7",purpleDim:"rgba(168,85,247,0.12)",
    text:"#EDF0FF",sub:"#7B84A3",muted:"#3D4260",
    grad:"linear-gradient(135deg,#5B7CFA,#A855F7)",
    gradG:"linear-gradient(135deg,#0EC97F,#22D3EE)",
  },
  light: {
    bg:"#F0F2FA",surf:"#FFFFFF",card:"#FFFFFF",border:"#E4E7F5",
    accent:"#3B5BDB",accentDim:"rgba(59,91,219,0.08)",accentGlow:"rgba(59,91,219,0.2)",
    green:"#059669",greenDim:"rgba(5,150,105,0.08)",
    red:"#DC2626",redDim:"rgba(220,38,38,0.08)",
    yellow:"#D97706",yellowDim:"rgba(217,119,6,0.08)",
    purple:"#7C3AED",purpleDim:"rgba(124,58,237,0.08)",
    text:"#0F1429",sub:"#5A6281",muted:"#C4CAE0",
    grad:"linear-gradient(135deg,#3B5BDB,#7C3AED)",
    gradG:"linear-gradient(135deg,#059669,#0891B2)",
  }
};

const CATS=[
  {id:"moradia",label:"Moradia",icon:"🏠",color:"#5B7CFA"},
  {id:"alimentacao",label:"Alimentação",icon:"🍽️",color:"#0EC97F"},
  {id:"transporte",label:"Transporte",icon:"🚗",color:"#F5A623"},
  {id:"saude",label:"Saúde",icon:"💊",color:"#F04E6A"},
  {id:"lazer",label:"Lazer",icon:"🎮",color:"#A855F7"},
  {id:"assinaturas",label:"Assinaturas",icon:"📱",color:"#22D3EE"},
  {id:"emprestimos",label:"Empréstimos",icon:"💳",color:"#F5A623"},
  {id:"educacao",label:"Educação",icon:"📚",color:"#0EC97F"},
  {id:"outros",label:"Outros",icon:"📦",color:"#7B84A3"},
];

const LOAN_TYPES=[
  {id:"personal",label:"Pessoal",icon:"👤"},
  {id:"vehicle",label:"Veículo",icon:"🚗"},
  {id:"mortgage",label:"Imóvel",icon:"🏠"},
  {id:"consignado",label:"Consignado",icon:"📋"},
  {id:"credit_card",label:"Cartão",icon:"💳"},
  {id:"student",label:"Estudantil",icon:"📚"},
  {id:"other",label:"Outro",icon:"📦"},
];

const fmt=(v)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtPct=(v)=>`${(v||0).toFixed(1)}%`;
const cat=(id)=>CATS.find(c=>c.id===id)||CATS[CATS.length-1];
const lt=(id)=>LOAN_TYPES.find(t=>t.id===id)||LOAN_TYPES[0];

const INIT_LOANS=[
  {id:1,institution:"Banco do Brasil",description:"Empréstimo Pessoal",total_amount:15000,monthly_payment:650,
   interest_rate:1.99,start_date:"2025-01-10",end_date:"2027-01-10",total_installments:24,paid_installments:14,
   loan_type:"personal",status:"active",notes:"",
   amount_paid:9100,remaining_amount:5900,remaining_installments:10,progress_pct:58.3,total_interest:1600},
];
const INIT_SUBS=[
  {id:1,name:"Netflix",category_id:"assinaturas",amount:39.9,billing_cycle:"monthly",billing_day:5,start_date:"2024-01-01",status:"active",annual_cost:478.8},
  {id:2,name:"Spotify",category_id:"assinaturas",amount:21.9,billing_cycle:"monthly",billing_day:5,start_date:"2024-01-01",status:"active",annual_cost:262.8},
  {id:3,name:"Academia",category_id:"saude",amount:89.9,billing_cycle:"monthly",billing_day:1,start_date:"2024-06-01",status:"active",annual_cost:1078.8},
];
const INIT_EXPS=[
  {id:1,description:"Aluguel",amount:1800,category_id:"moradia",expense_date:"2026-03-01",type:"fixed"},
  {id:2,description:"Netflix",amount:39.9,category_id:"assinaturas",expense_date:"2026-03-05",type:"subscription"},
  {id:3,description:"Spotify",amount:21.9,category_id:"assinaturas",expense_date:"2026-03-05",type:"subscription"},
  {id:4,description:"Supermercado",amount:320,category_id:"alimentacao",expense_date:"2026-03-02",type:"variable"},
  {id:5,description:"Gasolina",amount:180,category_id:"transporte",expense_date:"2026-03-03",type:"variable"},
  {id:6,description:"Academia",amount:89.9,category_id:"saude",expense_date:"2026-03-01",type:"subscription"},
  {id:7,description:"iFood",amount:95,category_id:"alimentacao",expense_date:"2026-03-04",type:"variable"},
];
const INIT_BUDGETS={moradia:2000,alimentacao:600,transporte:300,saude:200,lazer:300,assinaturas:150,emprestimos:700,educacao:300,outros:200};

const buildCSS=(c)=>`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body,#root{height:100%;overflow:hidden;}
.app{display:flex;flex-direction:column;height:100%;max-width:440px;margin:0 auto;background:${c.bg};color:${c.text};font-family:'Outfit',sans-serif;position:relative;}
.scr{flex:1;overflow-y:auto;overflow-x:hidden;}.scr::-webkit-scrollbar{width:0;}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 8px;flex-shrink:0;}
.logo{font-family:'Syne',sans-serif;font-size:21px;font-weight:800;letter-spacing:-.5px;}
.logo em{color:${c.accent};font-style:normal;}
.hdr-r{display:flex;gap:8px;}
.ibtn{background:${c.card};border:1.5px solid ${c.border};color:${c.text};width:38px;height:38px;border-radius:12px;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.ibtn:hover{border-color:${c.accent};}
.hero{margin:0 14px 14px;background:${c.grad};border-radius:22px;padding:22px;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.07);}
.hero::after{content:'';position:absolute;bottom:-35px;left:15px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.04);}
.h-eye{font-size:10px;font-weight:700;color:rgba(255,255,255,.65);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px;}
.h-amt{font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:500;color:#fff;letter-spacing:-1px;}
.h-chips{display:flex;gap:7px;margin-top:14px;flex-wrap:wrap;}
.h-chip{background:rgba(255,255,255,.15);backdrop-filter:blur(10px);border-radius:20px;padding:4px 11px;font-size:10px;color:#fff;font-weight:600;}
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 14px 12px;}
.scard{background:${c.card};border:1px solid ${c.border};border-radius:15px;padding:13px;}
.slbl{font-size:10px;font-weight:700;color:${c.sub};text-transform:uppercase;letter-spacing:.8px;}
.sval{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:500;margin-top:4px;}
.shdr{display:flex;justify-content:space-between;align-items:center;padding:0 18px;margin-bottom:9px;}
.stitle{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;}
.slink{font-size:12px;color:${c.accent};font-weight:600;cursor:pointer;background:none;border:none;font-family:'Outfit',sans-serif;}
.frow{display:flex;gap:7px;padding:0 14px 10px;overflow-x:auto;}.frow::-webkit-scrollbar{height:0;}
.fchip{white-space:nowrap;border-radius:20px;padding:5px 13px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid ${c.border};color:${c.sub};background:${c.card};transition:all .2s;}
.fchip.on{background:${c.accentDim};border-color:${c.accent};color:${c.accent};}
.elist{display:flex;flex-direction:column;gap:7px;padding:0 14px 14px;}
.eitem{background:${c.card};border:1px solid ${c.border};border-radius:13px;padding:12px 13px;display:flex;align-items:center;gap:11px;transition:border-color .2s;}
.eitem:hover{border-color:${c.accent};}
.eico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.ebody{flex:1;min-width:0;}
.ename{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.emeta{font-size:11px;color:${c.sub};margin-top:2px;}
.eamt{font-family:'JetBrains Mono',monospace;font-size:13.5px;font-weight:500;color:${c.red};white-space:nowrap;}
.blist{display:flex;flex-direction:column;gap:9px;padding:0 14px 14px;}
.bitem{background:${c.card};border:1px solid ${c.border};border-radius:13px;padding:13px;}
.brow{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;}
.bname{font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px;}
.bamts{font-family:'JetBrains Mono',monospace;font-size:11px;color:${c.sub};}
.bar{height:7px;background:${c.border};border-radius:4px;overflow:hidden;}
.barf{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.4,0,.2,1);}
.otag{font-size:10px;color:${c.red};margin-top:5px;font-weight:700;}
.lcards{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 14px 14px;}
.lcard{background:${c.card};border:1px solid ${c.border};border-radius:15px;padding:13px;}
.llbl{font-size:10px;font-weight:700;color:${c.sub};text-transform:uppercase;letter-spacing:.8px;}
.lval{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:500;margin-top:4px;}
.loan-hero{background:${c.card};border:1px solid ${c.border};border-radius:18px;padding:18px;margin:0 14px 10px;cursor:pointer;transition:border-color .2s;}
.loan-hero:hover{border-color:${c.accent};}
.linst{font-size:10px;font-weight:700;color:${c.sub};text-transform:uppercase;letter-spacing:1px;}
.lname{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin:3px 0 11px;}
.lpbar{height:9px;background:${c.border};border-radius:5px;overflow:hidden;margin:7px 0 4px;}
.lpfill{height:100%;border-radius:5px;background:${c.gradG};}
.lprow{display:flex;justify-content:space-between;font-size:11px;color:${c.sub};font-family:'JetBrains Mono',monospace;}
.lgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:13px;}
.lstat{background:${c.bg};border-radius:11px;padding:9px;text-align:center;}
.lsval{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;}
.lslbl{font-size:9px;color:${c.sub};margin-top:2px;font-weight:700;text-transform:uppercase;}
.sub-item{background:${c.card};border:1px solid ${c.border};border-left:3px solid ${c.purple};border-radius:13px;padding:13px 15px;margin:0 14px 8px;display:flex;align-items:center;justify-content:space-between;}
.sn{font-size:13.5px;font-weight:600;}
.sc{font-size:11px;color:${c.sub};margin-top:3px;}
.sp{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:500;color:${c.purple};}
.bnav{background:${c.surf};border-top:1px solid ${c.border};display:grid;grid-template-columns:repeat(5,1fr);padding:7px 0 14px;flex-shrink:0;}
.nbtn{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;background:none;border:none;color:${c.sub};font-family:'Outfit',sans-serif;font-size:9px;font-weight:700;padding:4px;transition:all .2s;letter-spacing:.3px;text-transform:uppercase;}
.nbtn.on{color:${c.accent};}
.nico{font-size:20px;}
.fab{position:fixed;bottom:80px;right:calc(50% - 206px);width:52px;height:52px;border-radius:50%;background:${c.grad};border:none;color:#fff;font-size:25px;cursor:pointer;box-shadow:0 4px 22px ${c.accentGlow};display:flex;align-items:center;justify-content:center;z-index:50;transition:transform .2s;}
.fab:hover{transform:scale(1.07);}
@media(max-width:440px){.fab{right:14px;}}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(10px);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
.modal{background:${c.surf};border-radius:22px 22px 0 0;padding:22px;width:100%;max-width:440px;border-top:1px solid ${c.border};max-height:92vh;overflow-y:auto;}
.modal::-webkit-scrollbar{width:0;}
.mtitle{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;margin-bottom:18px;}
.fg{margin-bottom:12px;}
.fl{font-size:10px;color:${c.sub};font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px;display:block;}
.fi{width:100%;background:${c.card};border:1.5px solid ${c.border};border-radius:12px;padding:11px 13px;color:${c.text};font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s;}
.fi:focus{border-color:${c.accent};}
select.fi option{background:${c.card};}
.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px;}
.cchip{background:${c.card};border:1.5px solid ${c.border};border-radius:11px;padding:8px 5px;text-align:center;cursor:pointer;font-size:10px;font-weight:700;transition:all .2s;color:${c.sub};}
.cchip.on{border-color:${c.accent};background:${c.accentDim};color:${c.accent};}
.ltgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px;}
.ltchip{background:${c.card};border:1.5px solid ${c.border};border-radius:11px;padding:9px 4px;text-align:center;cursor:pointer;font-size:10px;font-weight:700;transition:all .2s;color:${c.sub};}
.ltchip.on{border-color:${c.yellow};background:${c.yellowDim};color:${c.yellow};}
.lticon{font-size:19px;margin-bottom:3px;}
.brow2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.bts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px;}
.btn{border:none;border-radius:12px;padding:13px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;}
.btnp{background:${c.grad};color:#fff;}
.btns{background:${c.card};color:${c.text};border:1.5px solid ${c.border};}
.divider{height:1px;background:${c.border};margin:14px 0;}
.irow{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid ${c.border};font-size:13px;}
.irow:last-child{border:none;}
.ikey{color:${c.sub};}.ival{font-weight:700;font-family:'JetBrains Mono',monospace;}
.tag{display:inline-flex;align-items:center;border-radius:20px;padding:3px 9px;font-size:10px;font-weight:800;letter-spacing:.3px;}
.inscard{background:${c.card};border:1px solid ${c.border};border-left:3px solid ${c.accent};border-radius:13px;padding:13px 15px;margin:0 14px 13px;}
.inslbl{font-size:10px;font-weight:800;color:${c.accent};text-transform:uppercase;letter-spacing:1px;}
.instxt{font-size:12.5px;color:${c.sub};margin-top:5px;line-height:1.55;}
.pgtitle{font-family:'Syne',sans-serif;font-size:23px;font-weight:800;padding:14px 18px 3px;letter-spacing:-.5px;}
.pgsub{font-size:12.5px;color:${c.sub};padding:0 18px 14px;}
.empty{text-align:center;padding:44px 20px;color:${c.sub};}
.emicon{font-size:44px;margin-bottom:10px;}
.ai-panel{position:fixed;inset:0;z-index:500;background:${c.bg};display:flex;flex-direction:column;max-width:440px;margin:0 auto;}
.ai-hdr{padding:16px 18px;border-bottom:1px solid ${c.border};display:flex;align-items:center;gap:11px;flex-shrink:0;}
.ai-av{width:42px;height:42px;border-radius:13px;background:${c.grad};display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0;}
.ai-name{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;}
.ai-st{font-size:11px;color:${c.green};font-weight:700;margin-top:1px;}
.ai-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px;}
.ai-msgs::-webkit-scrollbar{width:0;}
.amsg{max-width:88%;line-height:1.55;font-size:13.5px;}
.amsg.user{align-self:flex-end;background:${c.grad};color:#fff;border-radius:18px 18px 4px 18px;padding:10px 14px;}
.amsg.assistant{align-self:flex-start;background:${c.card};border:1px solid ${c.border};border-radius:18px 18px 18px 4px;padding:10px 14px;white-space:pre-wrap;}
.aidots{display:flex;gap:4px;padding:2px 0;}
.aidot{width:6px;height:6px;border-radius:50%;background:${c.sub};animation:bdot 1.2s infinite;}
.aidot:nth-child(2){animation-delay:.2s;}.aidot:nth-child(3){animation-delay:.4s;}
@keyframes bdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
.ai-quick{display:flex;gap:7px;padding:8px 14px;overflow-x:auto;flex-shrink:0;}
.ai-quick::-webkit-scrollbar{height:0;}
.aqchip{white-space:nowrap;background:${c.card};border:1px solid ${c.border};border-radius:20px;padding:5px 12px;font-size:11px;cursor:pointer;color:${c.text};font-weight:600;transition:all .2s;}
.aqchip:hover{border-color:${c.accent};}
.ai-ir{padding:11px 14px;border-top:1px solid ${c.border};display:flex;gap:9px;flex-shrink:0;}
.ai-in{flex:1;background:${c.card};border:1.5px solid ${c.border};border-radius:13px;padding:11px 13px;color:${c.text};font-family:'Outfit',sans-serif;font-size:13.5px;outline:none;}
.ai-in:focus{border-color:${c.accent};}
.ai-sd{background:${c.grad};border:none;border-radius:13px;width:44px;height:44px;cursor:pointer;color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
`;

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [tab, setTab] = useState("dash");
  const [expenses, setExpenses] = useState(INIT_EXPS);
  const [loans, setLoans] = useState(INIT_LOANS);
  const [subs] = useState(INIT_SUBS);
  const [budgets] = useState(INIT_BUDGETS);
  const [income] = useState(6500);
  const [showAdd, setShowAdd] = useState(false);
  const [showLoanAdd, setShowLoanAdd] = useState(false);
  const [loanDetail, setLoanDetail] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMsgs, setAiMsgs] = useState([
    {role:"assistant",content:"Olá! Sou o Finn, seu assistente financeiro pessoal 🤖\n\nAnaliso seus dados em tempo real e te ajudo a tomar melhores decisões com seu dinheiro. Como posso te ajudar hoje?"}
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [filterExp, setFilterExp] = useState("Todas");
  const [newExp, setNewExp] = useState({description:"",category_id:"alimentacao",amount:"",expense_date:new Date().toISOString().split("T")[0],type:"variable"});
  const [newLoan, setNewLoan] = useState({institution:"",description:"",total_amount:"",monthly_payment:"",interest_rate:"",start_date:"",end_date:"",total_installments:"",paid_installments:"0",loan_type:"personal",notes:""});
  const chatEndRef = useRef(null);
  const c = T[theme];

  useEffect(()=>{
    const s=document.createElement("style");s.textContent=buildCSS(c);s.id="fts";
    const o=document.getElementById("fts");if(o)o.remove();
    document.head.appendChild(s);
  },[theme]);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[aiMsgs]);

  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const balance = income - totalSpent;
  const savings = parseFloat(((balance/income)*100).toFixed(1));
  const totalLoansMonthly = loans.filter(l=>l.status==="active").reduce((s,l)=>s+l.monthly_payment,0);
  const totalSubsMonthly = subs.filter(s=>s.status==="active").reduce((s,sub)=>s+sub.amount,0);

  const spentByCat = {};
  CATS.forEach(ct=>{spentByCat[ct.id]=expenses.filter(e=>e.category_id===ct.id).reduce((s,e)=>s+e.amount,0);});

  const categories = CATS.map(ct=>({
    ...ct, spent:spentByCat[ct.id]||0, budget:budgets[ct.id]||0,
    pct:budgets[ct.id]>0?Math.min(((spentByCat[ct.id]||0)/budgets[ct.id])*100,100):0,
    over:(spentByCat[ct.id]||0)>(budgets[ct.id]||0)&&(budgets[ct.id]||0)>0
  }));

  const addExpense=()=>{
    if(!newExp.description||!newExp.amount)return;
    setExpenses(p=>[{...newExp,id:Date.now(),amount:parseFloat(newExp.amount)},...p]);
    setNewExp({description:"",category_id:"alimentacao",amount:"",expense_date:new Date().toISOString().split("T")[0],type:"variable"});
    setShowAdd(false);
  };

  const enrichLoan=(l)=>{
    const paidAmt=l.paid_installments*l.monthly_payment;
    const remaining=Math.max(0,l.total_amount-paidAmt);
    const remInst=l.total_installments-l.paid_installments;
    const pct=parseFloat(((l.paid_installments/l.total_installments)*100).toFixed(1));
    const totalInterest=Math.max(0,(l.monthly_payment*l.total_installments)-l.total_amount);
    return{...l,amount_paid:paidAmt,remaining_amount:remaining,remaining_installments:remInst,progress_pct:pct,total_interest:totalInterest};
  };

  const addLoan=()=>{
    if(!newLoan.institution||!newLoan.total_amount||!newLoan.monthly_payment)return;
    const raw={...newLoan,id:Date.now(),total_amount:parseFloat(newLoan.total_amount),monthly_payment:parseFloat(newLoan.monthly_payment),
      interest_rate:parseFloat(newLoan.interest_rate)||0,total_installments:parseInt(newLoan.total_installments)||12,
      paid_installments:parseInt(newLoan.paid_installments)||0,status:"active"};
    setLoans(p=>[enrichLoan(raw),...p]);
    setNewLoan({institution:"",description:"",total_amount:"",monthly_payment:"",interest_rate:"",start_date:"",end_date:"",total_installments:"",paid_installments:"0",loan_type:"personal",notes:""});
    setShowLoanAdd(false);
  };

  const payInstallment=(loanId)=>{
    setLoans(prev=>prev.map(l=>{
      if(l.id!==loanId)return l;
      const newPaid=l.paid_installments+1;
      const updated=enrichLoan({...l,paid_installments:newPaid,status:newPaid>=l.total_installments?"paid":"active"});
      if(loanDetail?.id===loanId)setLoanDetail(updated);
      return updated;
    }));
  };

  const sendAI=async()=>{
    if(!aiInput.trim()||aiLoading)return;
    const msg=aiInput.trim();setAiInput("");
    setAiMsgs(p=>[...p,{role:"user",content:msg}]);setAiLoading(true);
    const ctx=`Dados Março/2026: Renda=${fmt(income)}, Gasto=${fmt(totalSpent)}, Saldo=${fmt(balance)}, Poupança=${fmtPct(savings)}, Empréstimos=${fmt(totalLoansMonthly)}/mês, Assinaturas=${fmt(totalSubsMonthly)}/mês. Categorias: ${categories.filter(c=>c.spent>0).map(c=>`${c.label}=${fmt(c.spent)}/${fmt(c.budget)}`).join(", ")}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`Você é o Finn, assistente financeiro pessoal. ${ctx}. Respostas em português BR, máx 180 palavras, seja empático e use dados reais.`,
          messages:[...aiMsgs.slice(-6),{role:"user",content:msg}]})});
      const d=await res.json();
      setAiMsgs(p=>[...p,{role:"assistant",content:d.content?.[0]?.text||"Erro."}]);
    }catch{setAiMsgs(p=>[...p,{role:"assistant",content:"⚠️ Erro de conexão. Tente novamente."}]);}
    setAiLoading(false);
  };

  const filteredExp=expenses.filter(e=>{
    if(filterExp==="Todas")return true;
    if(filterExp==="Fixas")return e.type==="fixed";
    if(filterExp==="Variáveis")return e.type==="variable";
    if(filterExp==="Assinaturas")return e.type==="subscription";
    return true;
  });

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const Dashboard=()=>(
    <div className="scr">
      <div className="hero">
        <div className="h-eye">Saldo Disponível • Março 2026</div>
        <div className="h-amt">{fmt(balance)}</div>
        <div className="h-chips">
          <div className="h-chip">💰 {fmt(income)}</div>
          <div className="h-chip">📊 {fmtPct(savings)} poupança</div>
          <div className="h-chip">📉 {fmt(totalSpent)} gasto</div>
        </div>
      </div>
      <div className="sgrid">
        <div className="scard"><div className="slbl">Total Gasto</div><div className="sval" style={{color:totalSpent>income*.75?c.red:c.yellow}}>{fmt(totalSpent)}</div></div>
        <div className="scard"><div className="slbl">Taxa Poupança</div><div className="sval" style={{color:savings>20?c.green:c.yellow}}>{fmtPct(savings)}</div></div>
        <div className="scard"><div className="slbl">Empréstimos/mês</div><div className="sval" style={{color:c.yellow}}>{fmt(totalLoansMonthly)}</div></div>
        <div className="scard"><div className="slbl">Assinaturas/mês</div><div className="sval" style={{color:c.purple}}>{fmt(totalSubsMonthly)}</div></div>
      </div>
      <div className="inscard">
        <div className="inslbl">🤖 Finn — Insight</div>
        <div className="instxt">{savings>30?`Ótimo! Você poupa ${fmtPct(savings)} da renda. Continue assim! 🚀`:totalSpent>income*.85?`⚠️ Atenção: seus gastos estão em ${fmtPct((totalSpent/income)*100)} da renda. Revise assinaturas e variáveis.`:`Você tem ${fmt(balance)} disponível. Que tal investir parte? 💡`}</div>
      </div>
      <div className="shdr"><span className="stitle">Categorias</span><button className="slink" onClick={()=>setTab("budget")}>Ver tudo</button></div>
      <div className="blist">
        {categories.filter(ct=>ct.spent>0||ct.budget>0).slice(0,5).map(ct=>(
          <div className="bitem" key={ct.id}>
            <div className="brow"><div className="bname"><span>{ct.icon}</span>{ct.label}</div><div className="bamts">{fmt(ct.spent)} / {fmt(ct.budget)}</div></div>
            <div className="bar"><div className="barf" style={{width:`${ct.pct}%`,background:ct.over?c.red:ct.color}}/></div>
            {ct.over&&<div className="otag">⚠️ +{fmt(ct.spent-ct.budget)} acima</div>}
          </div>
        ))}
      </div>
      <div className="shdr"><span className="stitle">Últimas Despesas</span><button className="slink" onClick={()=>setTab("expenses")}>Ver todas</button></div>
      <div className="elist">
        {expenses.slice(0,5).map(e=>{const ct=cat(e.category_id);return(
          <div className="eitem" key={e.id}>
            <div className="eico" style={{background:ct.color+"22"}}>{ct.icon}</div>
            <div className="ebody"><div className="ename">{e.description}</div><div className="emeta">{ct.label} • {new Date(e.expense_date+"T12:00:00").toLocaleDateString("pt-BR")}</div></div>
            <div className="eamt">-{fmt(e.amount)}</div>
          </div>
        );})}
      </div>
      <div style={{height:80}}/>
    </div>
  );

  // ── EXPENSES ───────────────────────────────────────────────────────────────
  const Expenses=()=>(
    <div className="scr">
      <div className="pgtitle">Despesas</div>
      <div className="frow">
        {["Todas","Fixas","Variáveis","Assinaturas"].map(f=>(
          <div key={f} className={`fchip${filterExp===f?" on":""}`} onClick={()=>setFilterExp(f)}>{f}</div>
        ))}
      </div>
      <div className="elist">
        {filteredExp.length===0&&<div className="empty"><div className="emicon">💸</div><div>Nenhuma despesa</div></div>}
        {filteredExp.map(e=>{const ct=cat(e.category_id);return(
          <div className="eitem" key={e.id}>
            <div className="eico" style={{background:ct.color+"22"}}>{ct.icon}</div>
            <div className="ebody"><div className="ename">{e.description}</div><div className="emeta">{ct.label} • {new Date(e.expense_date+"T12:00:00").toLocaleDateString("pt-BR")}</div></div>
            <div className="eamt">-{fmt(e.amount)}</div>
          </div>
        );})}
      </div>
      <div style={{height:80}}/>
    </div>
  );

  // ── BUDGET ─────────────────────────────────────────────────────────────────
  const Budget=()=>(
    <div className="scr">
      <div className="pgtitle">Orçamentos</div>
      <div className="pgsub">Controle seus limites por categoria</div>
      <div className="blist">
        {categories.map(ct=>(
          <div className="bitem" key={ct.id}>
            <div className="brow"><div className="bname"><span>{ct.icon}</span>{ct.label}</div><div className="bamts">{fmt(ct.spent)} / {fmt(ct.budget)}</div></div>
            <div className="bar"><div className="barf" style={{width:`${ct.pct}%`,background:ct.over?c.red:ct.color}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:11,color:c.sub}}>
              <span>{fmtPct(ct.pct)} usado</span>
              {ct.over?<span style={{color:c.red,fontWeight:700}}>⚠️ +{fmt(ct.spent-ct.budget)}</span>:<span style={{color:c.green}}>✓ {fmt(ct.budget-ct.spent)} livre</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── LOANS ──────────────────────────────────────────────────────────────────
  const LoanDetailModal=({loan})=>{
    const ltype=lt(loan.loan_type);
    const sc=loan.status==="active"?c.green:loan.status==="paid"?c.accent:c.red;
    return(
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setLoanDetail(null)}>
        <div className="modal">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div className="mtitle" style={{margin:0}}>{ltype.icon} {loan.institution}</div>
            <button className="ibtn" onClick={()=>setLoanDetail(null)}>✕</button>
          </div>
          <div style={{padding:14,background:c.card,borderRadius:14,border:`1px solid ${c.border}`,marginBottom:13}}>
            <div style={{fontSize:12,color:c.sub,marginBottom:3}}>{loan.description}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:500}}>{fmt(loan.total_amount)}</div>
            <div style={{marginTop:5}}><span className="tag" style={{background:sc+"20",color:sc}}>● {loan.status==="active"?"Ativo":loan.status==="paid"?"Quitado":"Renegociado"}</span></div>
          </div>
          <div className="lpbar" style={{height:11}}><div className="lpfill" style={{width:`${loan.progress_pct}%`}}/></div>
          <div className="lprow" style={{marginBottom:14}}>
            <span>{loan.paid_installments} pagas</span>
            <span style={{color:c.green,fontWeight:700}}>{fmtPct(loan.progress_pct)}</span>
            <span>{loan.remaining_installments} restantes</span>
          </div>
          <div className="divider"/>
          {[
            ["Parcela mensal",fmt(loan.monthly_payment),c.yellow],
            ["Taxa de juros",`${loan.interest_rate}% a.m.`,null],
            ["Valor pago",fmt(loan.amount_paid),c.green],
            ["Valor restante",fmt(loan.remaining_amount),c.red],
            ["Total de juros",fmt(loan.total_interest),null],
            ["Início",loan.start_date?new Date(loan.start_date+"T12:00:00").toLocaleDateString("pt-BR"):"—",null],
            ["Término",loan.end_date?new Date(loan.end_date+"T12:00:00").toLocaleDateString("pt-BR"):"—",null],
          ].map(([k,v,col])=>(
            <div className="irow" key={k}><span className="ikey">{k}</span><span className="ival" style={col?{color:col}:{}}>{v}</span></div>
          ))}
          {loan.notes&&<div style={{marginTop:10,padding:10,background:c.card,borderRadius:10,fontSize:12,color:c.sub}}>{loan.notes}</div>}
          <div className="bts" style={{marginTop:14}}>
            {loan.status==="active"&&loan.paid_installments<loan.total_installments&&(
              <button className="btn btnp" onClick={()=>payInstallment(loan.id)}>✓ Pagar Parcela</button>
            )}
            <button className="btn btns" onClick={()=>setLoanDetail(null)}>Fechar</button>
          </div>
        </div>
      </div>
    );
  };

  const Loans=()=>{
    const active=loans.filter(l=>l.status==="active");
    const paid=loans.filter(l=>l.status==="paid");
    const totalM=active.reduce((s,l)=>s+l.monthly_payment,0);
    const totalR=active.reduce((s,l)=>s+l.remaining_amount,0);
    return(
      <div className="scr">
        <div className="pgtitle">Empréstimos</div>
        <div className="lcards">
          <div className="lcard"><div className="llbl">Comprometido/mês</div><div className="lval" style={{color:c.yellow}}>{fmt(totalM)}</div></div>
          <div className="lcard"><div className="llbl">Total Restante</div><div className="lval" style={{color:c.red}}>{fmt(totalR)}</div></div>
          <div className="lcard"><div className="llbl">Ativos</div><div className="lval" style={{color:c.accent}}>{active.length}</div></div>
          <div className="lcard"><div className="llbl">Quitados</div><div className="lval" style={{color:c.green}}>{paid.length}</div></div>
        </div>
        <div className="shdr"><span className="stitle">Ativos</span><button className="slink" onClick={()=>setShowLoanAdd(true)}>+ Novo</button></div>
        {active.length===0&&<div className="empty"><div className="emicon">🎉</div><div>Nenhum empréstimo ativo!</div></div>}
        {active.map(loan=>{
          const ltype=lt(loan.loan_type);
          return(
            <div className="loan-hero" key={loan.id} onClick={()=>setLoanDetail(loan)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                <div><div className="linst">{ltype.icon} {ltype.label} • {loan.institution}</div><div className="lname">{loan.description}</div></div>
                <span className="tag" style={{background:c.greenDim,color:c.green,flexShrink:0}}>Ativo</span>
              </div>
              <div className="lpbar"><div className="lpfill" style={{width:`${loan.progress_pct}%`}}/></div>
              <div className="lprow">
                <span>{loan.paid_installments}/{loan.total_installments} parcelas</span>
                <span style={{color:c.green,fontWeight:700}}>{fmtPct(loan.progress_pct)}</span>
              </div>
              <div className="lgrid">
                <div className="lstat"><div className="lsval" style={{color:c.yellow}}>{fmt(loan.monthly_payment)}</div><div className="lslbl">Parcela</div></div>
                <div className="lstat"><div className="lsval" style={{color:c.red}}>{fmt(loan.remaining_amount)}</div><div className="lslbl">Restante</div></div>
                <div className="lstat"><div className="lsval">{loan.interest_rate}%</div><div className="lslbl">Juros a.m.</div></div>
              </div>
            </div>
          );
        })}
        {paid.length>0&&(
          <>
            <div className="shdr" style={{marginTop:8}}><span className="stitle">Quitados ✓</span></div>
            {paid.map(loan=>(
              <div key={loan.id} style={{opacity:.55}} className="loan-hero" onClick={()=>setLoanDetail(loan)}>
                <div className="linst">✓ {loan.institution}</div>
                <div className="lname" style={{marginBottom:5}}>{loan.description}</div>
                <div style={{fontSize:12,color:c.sub,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(loan.total_amount)} quitado</div>
              </div>
            ))}
          </>
        )}
        <div style={{height:90}}/>
      </div>
    );
  };

  // ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
  const Subscriptions=()=>{
    const active=subs.filter(s=>s.status==="active");
    const totalM=active.reduce((s,sub)=>s+sub.amount,0);
    const totalA=active.reduce((s,sub)=>s+sub.annual_cost,0);
    return(
      <div className="scr">
        <div className="pgtitle">Assinaturas</div>
        <div className="lcards">
          <div className="lcard"><div className="llbl">Mensal</div><div className="lval" style={{color:c.purple}}>{fmt(totalM)}</div></div>
          <div className="lcard"><div className="llbl">Anual</div><div className="lval" style={{color:c.purple}}>{fmt(totalA)}</div></div>
        </div>
        <div className="shdr"><span className="stitle">Ativas</span></div>
        {active.map(sub=>{const ct=cat(sub.category_id);return(
          <div className="sub-item" key={sub.id}>
            <div><div style={{fontSize:19,marginBottom:3}}>{ct.icon}</div><div className="sn">{sub.name}</div><div className="sc">{sub.billing_cycle==="monthly"?"Mensal":"Anual"} • dia {sub.billing_day}</div></div>
            <div style={{textAlign:"right"}}><div className="sp">{fmt(sub.amount)}</div><div style={{fontSize:11,color:c.sub,marginTop:2}}>{fmt(sub.annual_cost)}/ano</div></div>
          </div>
        );})}
        <div style={{height:80}}/>
      </div>
    );
  };

  const TABS=[{id:"dash",icon:"📊",label:"Resumo"},{id:"expenses",icon:"💸",label:"Despesas"},{id:"budget",icon:"🎯",label:"Orçamento"},{id:"loans",icon:"💳",label:"Crédito"},{id:"subs",icon:"🔁",label:"Assinaturas"}];
  const AI_Q=["Como economizar?","Analisar gastos","Meta de poupança","Quitar dívidas","Reserva de emergência"];

  return(
    <div className="app">
      <div className="hdr">
        <div className="logo">fintech<em>.</em>ai</div>
        <div className="hdr-r">
          <button className="ibtn" onClick={()=>setAiOpen(true)}>🤖</button>
          <button className="ibtn" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?"☀️":"🌙"}</button>
        </div>
      </div>

      {tab==="dash"&&<Dashboard/>}
      {tab==="expenses"&&<Expenses/>}
      {tab==="budget"&&<Budget/>}
      {tab==="loans"&&<Loans/>}
      {tab==="subs"&&<Subscriptions/>}

      <div className="bnav">
        {TABS.map(t=>(
          <button key={t.id} className={`nbtn${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
            <span className="nico">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {(tab==="dash"||tab==="expenses")&&<button className="fab" onClick={()=>setShowAdd(true)}>+</button>}
      {tab==="loans"&&<button className="fab" onClick={()=>setShowLoanAdd(true)}>+</button>}

      {/* Add Expense */}
      {showAdd&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal">
            <div className="mtitle">Nova Despesa</div>
            <div className="fg"><label className="fl">Descrição</label><input className="fi" placeholder="Ex: Almoço, Uber, Farmácia..." value={newExp.description} onChange={e=>setNewExp(p=>({...p,description:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Valor (R$)</label><input className="fi" type="number" placeholder="0,00" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Categoria</label>
              <div className="cgrid">{CATS.map(ct=>(
                <div key={ct.id} className={`cchip${newExp.category_id===ct.id?" on":""}`} onClick={()=>setNewExp(p=>({...p,category_id:ct.id}))}>
                  <div style={{fontSize:17}}>{ct.icon}</div><div style={{marginTop:3}}>{ct.label}</div>
                </div>
              ))}</div>
            </div>
            <div className="fg"><label className="fl">Data</label><input className="fi" type="date" value={newExp.expense_date} onChange={e=>setNewExp(p=>({...p,expense_date:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Tipo</label>
              <select className="fi" value={newExp.type} onChange={e=>setNewExp(p=>({...p,type:e.target.value}))}>
                <option value="variable">Variável</option><option value="fixed">Fixa</option><option value="subscription">Assinatura</option>
              </select>
            </div>
            <div className="bts"><button className="btn btns" onClick={()=>setShowAdd(false)}>Cancelar</button><button className="btn btnp" onClick={addExpense}>Salvar</button></div>
          </div>
        </div>
      )}

      {/* Add Loan */}
      {showLoanAdd&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowLoanAdd(false)}>
          <div className="modal">
            <div className="mtitle">Novo Empréstimo</div>
            <div className="fg"><label className="fl">Tipo de Crédito</label>
              <div className="ltgrid">{LOAN_TYPES.map(ltype=>(
                <div key={ltype.id} className={`ltchip${newLoan.loan_type===ltype.id?" on":""}`} onClick={()=>setNewLoan(p=>({...p,loan_type:ltype.id}))}>
                  <div className="lticon">{ltype.icon}</div><div>{ltype.label}</div>
                </div>
              ))}</div>
            </div>
            <div className="fg"><label className="fl">Instituição</label><input className="fi" placeholder="Ex: Banco do Brasil, Nubank, Caixa..." value={newLoan.institution} onChange={e=>setNewLoan(p=>({...p,institution:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Descrição</label><input className="fi" placeholder="Ex: Empréstimo Pessoal, Financiamento Carro..." value={newLoan.description} onChange={e=>setNewLoan(p=>({...p,description:e.target.value}))}/></div>
            <div className="brow2">
              <div className="fg"><label className="fl">Valor Total (R$)</label><input className="fi" type="number" placeholder="15000" value={newLoan.total_amount} onChange={e=>setNewLoan(p=>({...p,total_amount:e.target.value}))}/></div>
              <div className="fg"><label className="fl">Parcela (R$)</label><input className="fi" type="number" placeholder="650" value={newLoan.monthly_payment} onChange={e=>setNewLoan(p=>({...p,monthly_payment:e.target.value}))}/></div>
            </div>
            <div className="brow2">
              <div className="fg"><label className="fl">Nº Parcelas</label><input className="fi" type="number" placeholder="24" value={newLoan.total_installments} onChange={e=>setNewLoan(p=>({...p,total_installments:e.target.value}))}/></div>
              <div className="fg"><label className="fl">Já Pagas</label><input className="fi" type="number" placeholder="0" value={newLoan.paid_installments} onChange={e=>setNewLoan(p=>({...p,paid_installments:e.target.value}))}/></div>
            </div>
            <div className="fg"><label className="fl">Juros (% a.m.)</label><input className="fi" type="number" step="0.01" placeholder="1.99" value={newLoan.interest_rate} onChange={e=>setNewLoan(p=>({...p,interest_rate:e.target.value}))}/></div>
            <div className="brow2">
              <div className="fg"><label className="fl">Data Início</label><input className="fi" type="date" value={newLoan.start_date} onChange={e=>setNewLoan(p=>({...p,start_date:e.target.value}))}/></div>
              <div className="fg"><label className="fl">Data Término</label><input className="fi" type="date" value={newLoan.end_date} onChange={e=>setNewLoan(p=>({...p,end_date:e.target.value}))}/></div>
            </div>
            <div className="fg"><label className="fl">Observações</label><input className="fi" placeholder="Ex: Usado para reforma da casa" value={newLoan.notes} onChange={e=>setNewLoan(p=>({...p,notes:e.target.value}))}/></div>
            <div className="bts"><button className="btn btns" onClick={()=>setShowLoanAdd(false)}>Cancelar</button><button className="btn btnp" onClick={addLoan}>Cadastrar</button></div>
          </div>
        </div>
      )}

      {loanDetail&&<LoanDetailModal loan={loanDetail}/>}

      {/* AI Panel */}
      {aiOpen&&(
        <div className="ai-panel">
          <div className="ai-hdr">
            <div className="ai-av">🤖</div>
            <div><div className="ai-name">Finn — Assistente Financeiro</div><div className="ai-st">● Online · Claude AI</div></div>
            <button className="ibtn" style={{marginLeft:"auto"}} onClick={()=>setAiOpen(false)}>✕</button>
          </div>
          <div className="ai-msgs">
            {aiMsgs.map((m,i)=><div key={i} className={`amsg ${m.role}`}>{m.content}</div>)}
            {aiLoading&&<div className="amsg assistant"><div className="aidots"><div className="aidot"/><div className="aidot"/><div className="aidot"/></div></div>}
            <div ref={chatEndRef}/>
          </div>
          <div className="ai-quick">
            {AI_Q.map(q=><div key={q} className="aqchip" onClick={()=>setAiInput(q)}>{q}</div>)}
          </div>
          <div className="ai-ir">
            <input className="ai-in" placeholder="Pergunte sobre suas finanças..." value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAI()}/>
            <button className="ai-sd" onClick={sendAI}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
