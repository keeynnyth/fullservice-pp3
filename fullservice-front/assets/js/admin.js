

// assets/js/admin.js — Panel admin maestro-detalle

/* ------------------------- util / base API ------------------------- */
const CANDIDATES = [
  'http://127.0.0.1:3000','http://localhost:3000',
  'http://127.0.0.1:3001','http://localhost:3001'
];
let API_BASE = null;
async function apiBase(){
  if (API_BASE) return API_BASE;
  for (const b of CANDIDATES){ try{ const r=await fetch(b+'/health'); if(r.ok){ API_BASE=b; return b; } }catch{} }
  API_BASE = CANDIDATES[0]; return API_BASE;
}
function $(id){ return document.getElementById(id); }
function fb(el,msg,ok=true){ el.hidden=false; el.className='flash '+(ok?'flash-success':'flash-error'); el.textContent=(ok?'✔️ ':'❌ ')+msg; }
function hide(el){ el.hidden=true; el.textContent=''; el.className='flash'; }
function getToken(){ const raw=localStorage.getItem('token'); return raw ? raw.replace(/^Bearer\s+/i,'').trim() : null; }
function parseJwt(t){ try{ return JSON.parse(atob(t.split('.')[1])); }catch{ return null; } }
function isAdmin(){ const p=parseJwt(getToken()||''); return p && String(p.rol).toLowerCase()==='admin'; }
function fmtDateTime(iso){ try{ return new Date(iso).toLocaleString(); }catch{ return iso||'—'; } }
function debounce(fn,ms=350){ let h; return (...a)=>{ clearTimeout(h); h=setTimeout(()=>fn(...a),ms); }; }

/* ------------------------- DOM refs ------------------------- */
const $logout = $('btn-logout');
const $fb     = $('fb');
const $q      = $('q');
const $userList = $('user-list');

const $uNombre = $('u-nombre');
const $uEmail  = $('u-email');
const $uRol    = $('u-rol');
const $uActivo = $('u-activo');
const $uId     = $('u-id');
const $uCreado = $('u-creado');
const $uPlan   = $('u-plan');
const $uPlanPaid = $('u-plan-paid');

const $actRol  = $('act-rol');
const $actOn   = $('act-activar');
const $actOff  = $('act-desactivar');
const $actReset= $('act-reset');
const $actDel  = $('act-delete');
const $fbDetail= $('fb-detail');

const $autos   = $('autos');
const $turnos  = $('turnos');

/* ------------------------- state ------------------------- */
let users = [];
let selected = null;

/* ------------------------- init ------------------------- */
init();
async function init(){
  // Guard de admin
  const token = getToken();
  if (!token || !isAdmin()){
    alert('Acceso restringido: sólo administradores.');
    location.href = 'login.html'; return;
  }
  // logout
  $logout.onclick = ()=>{
    ['token','jwt','auth_token','access_token','Authorization','fs_token','my_autos']
      .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    location.href = 'login.html';
  };

  // load list
  await loadUsuarios('');
  renderList(users);
  if (users.length) selectUser(users[0]);

  // search
  $q.addEventListener('input', debounce(async ()=>{
    const term = $q.value.trim();
    await loadUsuarios(term);
    renderList(users);
    clearDetail(); // hasta que selecciones uno
  }, 350));
}

/* ------------------------- API calls ------------------------- */
async function loadUsuarios(search){
  hide($fb);
  try{
    const base = await apiBase();
    const url = new URL(base + '/admin/usuarios');
    if (search) url.searchParams.set('search', search);
    const r = await fetch(url, { headers:{ Authorization:'Bearer '+getToken() }});
    const d = await r.json();
    if (!r.ok) { fb($fb, d?.mensaje || 'No se pudieron listar usuarios', false); users=[]; return; }
    users = Array.isArray(d) ? d : [];
  }catch{
    fb($fb,'Error de conexión al listar usuarios', false);
    users = [];
  }
}

async function loadAutos(userId){
  const base = await apiBase();
  const r = await fetch(base + `/admin/usuarios/${userId}/autos`, { headers:{ Authorization:'Bearer '+getToken() }});
  const d = await r.json();
  if (!r.ok) throw new Error(d?.mensaje || 'Error autos');
  return Array.isArray(d) ? d : [];
}
async function loadTurnos(userId){
  const base = await apiBase();
  const r = await fetch(base + `/admin/usuarios/${userId}/turnos`, { headers:{ Authorization:'Bearer '+getToken() }});
  const d = await r.json();
  if (!r.ok) throw new Error(d?.mensaje || 'Error turnos');
  return Array.isArray(d) ? d : [];
}
async function toggleActive(user, active){
  const base = await apiBase();
  const ep = active ? 'reactivar' : 'desactivar';
  const r = await fetch(base + `/admin/usuarios/${user.id}/${ep}`, { method:'POST', headers:{ Authorization:'Bearer '+getToken() }});
  const d = await r.json();
  if (!r.ok) throw new Error(d?.mensaje || 'Error cambiando estado');
}
async function toggleRole(user){
  const newRol = String(user.rol).toLowerCase()==='admin' ? 'usuario' : 'admin';
  const base = await apiBase();
  const r = await fetch(base + `/admin/usuarios/${user.id}`, {
    method:'PATCH',
    headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+getToken() },
    body: JSON.stringify({ rol: newRol })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.mensaje || 'Error cambiando rol');
  user.rol = newRol;
}
async function resetPassword(user){
  const base = await apiBase();
  const r = await fetch(base + `/admin/usuarios/${user.id}/reset-password`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+getToken() }
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.mensaje || 'Error reseteando contraseña');
  return d?.temp_password || '';
}
async function deleteUser(user){
  const base = await apiBase();
  const r = await fetch(base + `/admin/usuarios/${user.id}`, {
    method:'DELETE',
    headers:{ Authorization:'Bearer '+getToken() }
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.mensaje || 'Error eliminando usuario');
}

/* ------------------------- render list ------------------------- */
function renderList(arr){
  $userList.innerHTML = '';
  if (!arr.length){
    $userList.innerHTML = `<div class="item">Sin resultados.</div>`;
    return;
  }
  for (const u of arr){
    const node = document.createElement('div');
    node.className = 'item';
    node.dataset.id = u.id;
    node.innerHTML = `
      <div style="font-weight:600">${escapeHtml(u.nombre||'—')}</div>
      <div class="muted">${escapeHtml(u.email||'')}</div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge">${escapeHtml(u.rol)}</span>
        <span class="badge ${u.activo? 'green':'red'}">${u.activo?'activo':'inactivo'}</span>
      </div>
    `;
    node.onclick = ()=> selectUser(u);
    $userList.appendChild(node);
  }
  highlightActive();
}
function highlightActive(){
  const nodes = $userList.querySelectorAll('.item');
  nodes.forEach(n=>n.classList.remove('active'));
  if (selected){
    const node = $userList.querySelector(`.item[data-id="${selected.id}"]`);
    if (node) node.classList.add('active');
  }
}
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

/* ------------------------- render detail ------------------------- */
function clearDetail(){
  selected = null; highlightActive();
  $uNombre.textContent='—'; $uEmail.textContent='—'; $uRol.textContent='—'; $uActivo.textContent='—';
  $uId.textContent='—'; $uCreado.textContent='—'; $uPlan.textContent='—'; $uPlanPaid.textContent='—';
  $autos.innerHTML='<div class="empty">Seleccioná un usuario.</div>';
  $turnos.innerHTML='<div class="empty">Seleccioná un usuario.</div>';
  hide($fbDetail);
}

async function selectUser(user){
  selected = user; highlightActive(); hide($fbDetail);

  // encabezado
  $uNombre.textContent = user.nombre || '—';
  $uEmail.textContent  = user.email  || '—';
  $uRol.textContent    = (user.rol || '—');
  $uActivo.textContent = user.activo ? 'activo' : 'inactivo';
  $uActivo.className   = 'badge ' + (user.activo ? 'green':'red');

  $uId.textContent     = user.id;
  $uCreado.textContent = user.creado_en ? fmtDateTime(user.creado_en) : '—';
  $uPlan.textContent   = user.plan || '—';
  $uPlanPaid.textContent = user.plan_paid ? 'pagado' : 'pendiente';

  // acciones
  $actOn.onclick    = async ()=> doActivate(true);
  $actOff.onclick   = async ()=> doActivate(false);
  $actRol.onclick   = async ()=> doToggleRole();
  $actReset.onclick = async ()=> doReset();
  $actDel.onclick   = async ()=> doDelete();

  // datos secundarios
  try{
    $autos.innerHTML = 'Cargando…';
    const autos = await loadAutos(user.id);
    if(!autos.length){ $autos.innerHTML = '<div class="empty">Sin autos.</div>'; }
    else {
      $autos.innerHTML = renderAutosTable(autos);
    }
  }catch{ $autos.innerHTML = '<div class="empty">Error cargando autos.</div>'; }

  try{
    $turnos.innerHTML = 'Cargando…';
    const turnos = await loadTurnos(user.id);
    if(!turnos.length){ $turnos.innerHTML = '<div class="empty">Sin turnos.</div>'; }
    else {
      $turnos.innerHTML = renderTurnosTable(turnos);
    }
  }catch{ $turnos.innerHTML = '<div class="empty">Error cargando turnos.</div>'; }
}

function renderAutosTable(arr){
  let html = `<table><thead><tr>
    <th>ID</th><th>Marca</th><th>Modelo</th><th>Año</th>
  </tr></thead><tbody>`;
  for(const a of arr){
    html += `<tr>
      <td>${a.id}</td><td>${escapeHtml(a.marca)}</td><td>${escapeHtml(a.modelo)}</td><td>${escapeHtml(String(a.anio))}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  return html;
}
function renderTurnosTable(arr){
  let html = `<table><thead><tr>
    <th>ID</th><th>Fecha</th><th>Hora</th><th>Servicios</th><th>Motivo</th><th>Vehículo</th>
  </tr></thead><tbody>`;
  for(const t of arr){
    html += `<tr>
      <td>${t.id}</td><td>${escapeHtml(String(t.fecha||'').slice(0,10))}</td><td>${escapeHtml(String(t.hora||'').slice(0,5))}</td>
      <td>${escapeHtml(t.servicios||'')}</td><td>${escapeHtml(t.motivo||'')}</td>
      <td>${escapeHtml(`${t.marca} ${t.modelo} (${t.anio})`)}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  return html;
}

/* ------------------------- actions ------------------------- */
async function doActivate(active){
  if(!selected) return;
  try{
    await toggleActive(selected, active);
    selected.activo = active ? 1 : 0;
    $uActivo.textContent = selected.activo ? 'activo' : 'inactivo';
    $uActivo.className   = 'badge ' + (selected.activo ? 'green':'red');
    renderList(users); // refrescar badges del listado
    fb($fbDetail, active ? 'Usuario activado' : 'Usuario desactivado', true);
  }catch(e){ fb($fbDetail, e.message || 'Error cambiando estado', false); }
}
async function doToggleRole(){
  if(!selected) return;
  try{
    await toggleRole(selected);
    // selected.rol fue alterado en toggleRole()
    $uRol.textContent = selected.rol;
    renderList(users);
    fb($fbDetail, 'Rol actualizado', true);
  }catch(e){ fb($fbDetail, e.message || 'Error cambiando rol', false); }
}
async function doReset(){
  if(!selected) return;
  if(!confirm('¿Generar una contraseña temporal para este usuario?')) return;
  try{
    const temp = await resetPassword(selected);
    fb($fbDetail, 'Contraseña temporal: ' + temp, true);
  }catch(e){ fb($fbDetail, e.message || 'Error reseteando contraseña', false); }
}
async function doDelete(){
  if(!selected) return;
  if(!confirm('Esta acción eliminará el usuario, sus autos y turnos. ¿Continuar?')) return;
  try{
    await deleteUser(selected);
    fb($fbDetail, 'Usuario eliminado', true);
    // quitar de la lista local
    users = users.filter(u => u.id !== selected.id);
    renderList(users);
    clearDetail();
  }catch(e){ fb($fbDetail, e.message || 'Error eliminando usuario', false); }
}
