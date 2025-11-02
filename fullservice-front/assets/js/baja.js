

// assets/js/baja.js

const CANDIDATES = [
  'http://127.0.0.1:3000','http://localhost:3000',
  'http://127.0.0.1:3001','http://localhost:3001'
];
let API_BASE = null;
async function apiBase(){
  if (API_BASE) return API_BASE;
  for (const b of CANDIDATES){
    try { const r = await fetch(b+'/health'); if (r.ok) { API_BASE=b; return b; } } catch {}
  }
  API_BASE = CANDIDATES[0];
  return API_BASE;
}
function getToken(){
  const keys=['token','jwt','auth_token','access_token','Authorization','fs_token'];
  for (const k of keys){
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (raw){ const v = raw.replace(/^Bearer\s+/i,'').trim(); if (v) return v; }
  }
  return null;
}
function fb(el,msg,ok=true){ el.hidden=false; el.className='flash '+(ok?'flash-success':'flash-error'); el.textContent=(ok?'✔️ ':'❌ ')+msg; }
function hide(el){ el.hidden=true; el.textContent=''; el.className='flash'; }

const $form = document.getElementById('form-baja');
const $msg  = document.getElementById('msg');
const $btn  = document.getElementById('btn-baja');

$form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  hide($msg);

  const token = getToken();
  if (!token){ fb($msg,'Debes iniciar sesión.', false); return; }

  const confirm = document.getElementById('confirm').checked;
  if (!confirm){ fb($msg,'Debes confirmar la baja.', false); return; }

  try{
    $btn.disabled = true; const prev = $btn.textContent; $btn.textContent = 'Procesando…';

    const base = await apiBase();
    // Si querés enviar "motivo", podés guardarlo en otra tabla. Por ahora solo lo recolectamos.
    const motivo = (document.getElementById('motivo')?.value || '').trim();

    const r = await fetch(base + '/baja', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type':'application/json' },
      body: JSON.stringify({ motivo })
    });

    const text = await r.text(); let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}

    if (!r.ok){
      fb($msg, data?.mensaje || 'No se pudo procesar la baja.', false);
      $btn.disabled=false; $btn.textContent=prev; return;
    }

    fb($msg, 'Tu cuenta ha sido dada de baja.', true);
    // limpiar sesión y redirigir
    try {
      ['token','jwt','auth_token','access_token','Authorization','fs_token','my_autos']
        .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    } catch {}
    setTimeout(()=>{ window.location.href = 'login.html'; }, 1200);

  }catch(err){
    fb($msg,'Error de conexión con el servidor.', false);
    $btn.disabled=false; $btn.textContent='Dar de baja';
  }
});
