

// assets/js/perfil-plan.js

const CANDIDATES = [
  'http://127.0.0.1:3000','http://localhost:3000',
  'http://127.0.0.1:3001','http://localhost:3001'
];
let API_BASE = null;
async function apiBase(){
  if (API_BASE) return API_BASE;
  for (const b of CANDIDATES){
    try{ const r=await fetch(b+'/health'); if(r.ok){ API_BASE=b; return b; } }catch{}
  }
  API_BASE = CANDIDATES[0];
  return API_BASE;
}

function getCookie(name){
  return document.cookie.split('; ').find(r => r.startsWith(name+'='))?.split('=')[1];
}
function getToken(){
  const keys = ['token','jwt','auth_token','access_token','Authorization','fs_token'];
  for (const k of keys){
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (raw){ const v = raw.replace(/^Bearer\s+/i,'').trim(); if(v) return v; }
  }
  for (const c of ['token','jwt','auth_token','access_token']){
    const v = getCookie(c);
    if (v) return decodeURIComponent(v).replace(/^Bearer\s+/i,'').trim();
  }
  return null;
}

function $(id){ return document.getElementById(id); }
const info  = $('plan-info');
const acts  = $('plan-actions');

function setInfo(html){ info.innerHTML = html; }
function setError(msg){
  info.innerHTML = `❌ <strong>${msg}</strong>`;
  info.style.color = '#842029';
}

(async function init(){
  try{
    const base = await apiBase();
    const token = getToken();
    if (!token){
      setError('Debes iniciar sesión para ver tu plan.');
      return;
    }
    const res = await fetch(base + '/perfil', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const text = await res.text(); let data={};
    try{ data = text ? JSON.parse(text) : {}; }catch{ data = {}; }

    if (!res.ok){
      setError(data?.mensaje || 'No se pudo cargar tu perfil.');
      return;
    }

    // Render
    const plan = (data.plan || 'standard').toLowerCase();
    const planName = plan === 'premium' ? 'Premium' : 'Standard';
    const planPaid = data.plan_paid ? '✅ activo' : '⚠️ pendiente de pago';
    const prices = { standard: 13000, premium: 20000 };

    const price = prices[plan] ? `AR$ ${prices[plan].toLocaleString('es-AR')}/mes` : '';
    const terms = data.terms_version ? ` | Términos: ${data.terms_version}` : '';

    setInfo(`
      <div><strong>Plan contratado:</strong> ${planName} <small>(${price})</small></div>
      <div><strong>Estado:</strong> ${planPaid}</div>
      <div class="muted"><small>${data.email || ''}${terms}</small></div>
    `);
    acts.style.display = 'flex';
  }catch(e){
    setError('Error de conexión.');
  }
})();
