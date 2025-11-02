

// perfil-autos.js
const CANDIDATES = [
  'http://127.0.0.1:3000','http://localhost:3000',
  'http://127.0.0.1:3001','http://localhost:3001'
];
let API_BASE=null;
async function apiBase(){
  if(API_BASE) return API_BASE;
  for(const b of CANDIDATES){
    try{ const r=await fetch(b+'/health'); if(r.ok){ API_BASE=b; return b; } }catch{}
  }
  throw new Error('API no disponible');
}
function fb(el,msg,ok=true){ el.hidden=false; el.className='flash '+(ok?'flash-success':'flash-error'); el.textContent=(ok?'✔️ ':'❌ ')+msg; }
function hide(el){ el.hidden=true; el.textContent=''; el.className='flash'; }

const $fb = document.getElementById('fb');
const $fb2 = document.getElementById('fb2');
const $lista = document.getElementById('lista');
const $newContainer = document.getElementById('new-container');
const $btnAdd = document.getElementById('btn-add');
const $btnSave = document.getElementById('btn-save');
const $btnCancel = document.getElementById('btn-cancel');
const $tpl = document.getElementById('tpl-row');

const modelosState = new WeakMap();

init();

async function init(){
  hide($fb); hide($fb2);
  const token = localStorage.getItem('token');
  if(!token){ fb($fb, 'Debes iniciar sesión.', false); return; }
  await loadRegistrados();
  addRow(true); // primera fila para agregar
}

async function loadRegistrados(){
  $lista.innerHTML = 'Cargando...';
  try{
    const base = await apiBase();
    const r = await fetch(base+'/autos/mios', { headers:{ Authorization:'Bearer '+localStorage.getItem('token') }});
    const data = await r.json();
    if(!r.ok) { $lista.innerHTML=''; fb($fb, data?.mensaje || 'No se pudieron cargar tus autos', false); return; }
    renderRegistrados(Array.isArray(data)?data:[]);
  }catch{
    $lista.innerHTML=''; fb($fb, 'Error de conexión', false);
  }
}

function renderRegistrados(autos){
  $lista.innerHTML='';
  if(!autos.length){ $lista.innerHTML='<div class="item">No tenés autos cargados.</div>'; return; }
  for(const a of autos){
    const row = document.createElement('div');
    row.className='item';
    row.innerHTML = `
      <div><strong>${escapeHtml(a.marca)} ${escapeHtml(a.modelo)}</strong> (${escapeHtml(String(a.anio))})</div>
      <div style="margin-top:8px">
        <button class="btn btn-danger" data-id="${a.id}">Eliminar</button>
      </div>
    `;
    row.querySelector('button').onclick = () => delAuto(a.id);
    $lista.appendChild(row);
  }
}

async function delAuto(id){
  if(!confirm('¿Eliminar este vehículo?')) return;
  try{
    const base = await apiBase();
    const r = await fetch(base+'/autos/'+id, {
      method:'DELETE',
      headers:{ Authorization:'Bearer '+localStorage.getItem('token') }
    });
    const d = await r.json();
    if(!r.ok){ fb($fb, d?.mensaje || 'No se pudo eliminar', false); return; }
    fb($fb, 'Vehículo eliminado', true);
    await loadRegistrados();
  }catch{
    fb($fb, 'Error de conexión', false);
  }
}

$btnAdd.addEventListener('click', ()=> addRow());

function addRow(loadMarcas=false){
  const node = document.importNode($tpl.content, true);
  $newContainer.appendChild(node);
  const $row = $newContainer.querySelector('.item.row:last-child');
  const $marca = $row.querySelector('.marca');
  const $modelo = $row.querySelector('.modelo');
  const $del = $row.querySelector('.btn-del');

  modelosState.set($modelo, { loading:false, marca:'' });

  if(loadMarcas) fillMarcas($marca);
  else {
    const first = document.querySelector('.marca');
    if(first && first.options.length>1) copyOptions(first, $marca);
    else fillMarcas($marca);
  }

  $row.addEventListener('change', async (e)=>{
    if(e.target.classList.contains('marca')){
      await fillModelos(e.target.value, $modelo);
    }
  });
  $del.onclick = () => {
    $row.remove();
    if(!$newContainer.querySelector('.item.row')) addRow(true);
  };
}

function copyOptions(fromSelect,toSelect){
  toSelect.innerHTML='';
  for(const opt of fromSelect.options) toSelect.appendChild(opt.cloneNode(true));
  toSelect.selectedIndex=0;
}

async function fillMarcas($select){
  const base = await apiBase();
  $select.innerHTML = `<option value="" disabled selected>Marca</option>`;
  try{
    const r = await fetch(base+'/modelos/marcas');
    const data = await r.json();
    const unique = [...new Map((data.marcas||[])
      .map(m => [String(m).trim().toLowerCase(), String(m).trim().replace(/\s+/g,' ')]))]
      .map(([,pretty])=>pretty).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
    unique.forEach(m => {
      const opt=document.createElement('option');
      opt.value=opt.textContent=m;
      $select.appendChild(opt);
    });
  }catch(e){ console.error('Error marcas', e); }
}

async function fillModelos(marca, $select){
  const st = modelosState.get($select) || { loading:false, marca:'' };
  if(st.loading) return;
  if(st.marca === marca) return;
  st.loading = true; modelosState.set($select, st);

  $select.innerHTML = `<option value="" disabled selected>Modelo</option>`;
  if(!marca){ $select.disabled=true; st.loading=false; return; }
  $select.disabled=false;

  const base = await apiBase();
  try{
    const r = await fetch(base+`/modelos?marca=${encodeURIComponent(marca)}`);
    const data = await r.json();
    const unique = [...new Map((data.modelos||[])
      .map(mo => [String(mo).trim().toLowerCase(), String(mo).trim().replace(/\s+/g,' ')]))]
      .map(([,pretty])=>pretty).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
    unique.forEach(modelo=>{
      const opt=document.createElement('option');
      opt.value=opt.textContent=modelo;
      $select.appendChild(opt);
    });
    st.marca = marca;
  }catch(e){ console.error('Error modelos', e); }
  finally{ st.loading=false; modelosState.set($select, st); }
}

$btnSave.addEventListener('click', onSaveBatch);
$btnCancel.addEventListener('click', ()=>{
  $newContainer.innerHTML='';
  addRow(true);
  hide($fb2);
});

async function onSaveBatch(){
  hide($fb2);
  const token = localStorage.getItem('token');
  if(!token){ fb($fb2,'Debes iniciar sesión.',false); return; }

  const autos = Array.from($newContainer.querySelectorAll('.item.row')).map(row => ({
    marca: row.querySelector('.marca').value,
    modelo: row.querySelector('.modelo').value,
    anio: Number(row.querySelector('.anio').value)
  })).filter(a => a.marca && a.modelo && a.anio);

  if(!autos.length){ fb($fb2,'Agregá al menos un vehículo.',false); return; }

  try{
    const base = await apiBase();
    const r = await fetch(base+'/autos/batch', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token },
      body: JSON.stringify({ autos })
    });
    const d = await r.json();
    if(!r.ok){ fb($fb2, d?.mensaje || 'No se pudieron guardar los vehículos', false); return; }
    fb($fb2, `Se guardaron ${d.insertados || autos.length} vehículo(s).`, true);
    // refrescar lista y limpiar alta
    await loadRegistrados();
    $newContainer.innerHTML='';
    addRow(true);
  }catch{
    fb($fb2, 'Error de conexión.', false);
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
