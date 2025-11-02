

// assets/js/auth-nav.js

const PANEL_URL = 'inicio.html'; // tu panel/bienvenida

/* -------------------- helpers -------------------- */
function getToken() {
  const keys = ['token','jwt','auth_token','access_token','Authorization','fs_token'];
  for (const k of keys) {
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (raw) {
      const v = raw.replace(/^Bearer\s+/i,'').trim();
      if (v) return v;
    }
  }
  return null;
}
function clearSession() {
  ['token','jwt','auth_token','access_token','Authorization','fs_token','my_autos']
    .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
}
function parseJwt(token){
  try{
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g,'+').replace(/_/g,'/');
    const json = decodeURIComponent(atob(base64).split('').map(c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  }catch{ return {}; }
}

/* -------------------- DOM refs -------------------- */
const el = {
  btnRegister: document.getElementById('btn-register'),
  btnLogin:    document.getElementById('btn-login'),
  btnAdmin:    document.getElementById('btn-admin'),
  btnLogout:   document.getElementById('btn-logout'),
  btnPanel:    document.getElementById('btn-panel'),       // podría no existir aún
  btnsWrap:    document.getElementById('navbar-buttons'),
};

/* -------------------- actions -------------------- */
function ensurePanelButton() {
  if (document.getElementById('btn-panel')) return;
  const b = document.createElement('button');
  b.id = 'btn-panel';
  b.textContent = 'Ir a mi panel';
  b.style.marginRight = '8px';
  b.onclick = () => { window.location.href = PANEL_URL; };
  // insertarlo antes de Cerrar sesión si existe
  if (el.btnsWrap) {
    el.btnsWrap.insertBefore(b, el.btnLogout || null);
  } else {
    // fallback flotante si no existe el contenedor
    if (!document.getElementById('panel-fab')) {
      const style = document.createElement('style');
      style.textContent = `
        .panel-fab { position: fixed; right: 18px; bottom: 18px; background:#1e3a8a; color:#fff;
          border:0; padding:12px 16px; border-radius:999px; box-shadow:0 8px 20px rgba(0,0,0,.15);
          cursor:pointer; z-index:9999; }
        .panel-fab:hover { opacity:.92 }
      `;
      document.head.appendChild(style);
      const fab = document.createElement('button');
      fab.id = 'panel-fab';
      fab.className = 'panel-fab';
      fab.textContent = 'Ir a mi panel';
      fab.onclick = () => (window.location.href = PANEL_URL);
      document.body.appendChild(fab);
    }
  }
}

function removePanelButton() {
  const b = document.getElementById('btn-panel');
  if (b) b.remove();
  const fab = document.getElementById('panel-fab');
  if (fab) fab.remove();
}

function show(elm, as = 'inline-block'){ if (elm) elm.style.display = as; }
function hide(elm){ if (elm) elm.style.display = 'none'; }

function wireLogout() {
  if (!el.btnLogout) return;
  el.btnLogout.onclick = () => {
    clearSession();
    window.location.href = 'login.html';
  };
}

/* -------------------- main -------------------- */
(function init(){
  wireLogout();

  const token = getToken();

  if (token) {
    // Usuario logueado → mostrar panel + logout, ocultar register/login
    ensurePanelButton();
    hide(el.btnRegister);
    hide(el.btnLogin);
    show(el.btnLogout);
    // Admin si corresponde
    const payload = parseJwt(token);
    if (String(payload.rol || '').toLowerCase() === 'admin') show(el.btnAdmin);
    else hide(el.btnAdmin);
  } else {
    // Sin sesión → mostrar register/login, ocultar panel + logout + admin
    removePanelButton();
    show(el.btnRegister);
    show(el.btnLogin);
    hide(el.btnLogout);
    hide(el.btnAdmin);
  }
})();
