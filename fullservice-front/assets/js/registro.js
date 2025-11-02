

// assets/js/registro.js

// =========================
// Config & utilidades
// =========================

// Precios por plan
const PRICES = { standard: 13000, premium: 20000 };

// Detección de base URL del backend
const CANDIDATE_BASES = [
  'http://127.0.0.1:3000', 'http://localhost:3000',
  'http://127.0.0.1:3001', 'http://localhost:3001'
];
let API_BASE = null;

async function findApiBase () {
  if (API_BASE) return API_BASE;
  for (const b of CANDIDATE_BASES) {
    try {
      const r = await fetch(b + '/health', { cache: 'no-store' });
      if (r.ok) { API_BASE = b; return b; }
    } catch {}
  }
  throw new Error('API no disponible');
}

// Helpers DOM
const $ = (sel) => document.querySelector(sel);
const $id = (id) => document.getElementById(id);

// Form & feedback
const $form = $id('form-registro');
const $feedback = $id('feedback');

// Autos
const $autosContainer = $id('autos-container');
const $tpl = $id('tpl-auto');
const $btnAddAuto = $id('btn-add-auto');

// Pago simulado
const $pagoSim = $id('pago-sim');
const $btnProcesar = $id('btn-procesar');
const $pagoFlow = $id('pago-flow');
const $brandGroup = $id('brand-group');
const $btnPagar = $id('btn-pagar');
const $pagoEstado = $id('pago-estado');
const $cardLast4 = $id('card-last4');
const $cardExp = $id('card-exp');

// Modal (opcional — puede no existir según el HTML)
const $modal = $id('modal-pdf');
const $btnPDFSi = $id('btn-pdf-si');
const $btnPDFNo = $id('btn-pdf-no');

let paymentOk = false;
let selectedBrand = null;

// Estado por select de modelos
const modelosState = new WeakMap();

// =========================
// Init
// =========================
init();
async function init () {
  addAutoRow(true);
  initPlanBox();
  $form.addEventListener('submit', onSubmit);
}

// =========================
/* Feedback visual */
// =========================
function showFeedback (msg, ok = true) {
  if (!$feedback) return;
  $feedback.hidden = false;
  $feedback.className = 'flash ' + (ok ? 'flash-success' : 'flash-error');
  $feedback.textContent = (ok ? '✔️ ' : '❌ ') + msg;
}
function hideFeedback () {
  if ($feedback) {
    $feedback.hidden = true;
    $feedback.textContent = '';
    $feedback.className = 'flash';
  }
}

// =========================
/* Autos */
// =========================
$btnAddAuto.addEventListener('click', () => addAutoRow());
$autosContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-remove-auto')) {
    e.target.closest('.auto-row')?.remove();
    if (!$autosContainer.querySelector('.auto-row')) addAutoRow(true);
  }
});
$autosContainer.addEventListener('change', onAutosChange);

function addAutoRow (loadMarcas = false) {
  const node = document.importNode($tpl.content, true);
  $autosContainer.appendChild(node);
  const $row = $autosContainer.querySelector('.auto-row:last-child');
  const $marca = $row.querySelector('.auto-marca');
  const $modelo = $row.querySelector('.auto-modelo');
  modelosState.set($modelo, { loading: false, marca: '' });

  if (loadMarcas) fillMarcas($marca);
  else {
    const firstMarca = document.querySelector('.auto-marca');
    if (firstMarca && firstMarca.options.length > 1) copyOptions(firstMarca, $marca);
    else fillMarcas($marca);
  }
}

function copyOptions (fromSelect, toSelect) {
  toSelect.innerHTML = '';
  for (const opt of fromSelect.options) toSelect.appendChild(opt.cloneNode(true));
  toSelect.selectedIndex = 0;
}

async function onAutosChange (e) {
  if (e.target.classList.contains('auto-marca')) {
    const $row = e.target.closest('.auto-row');
    const $modelo = $row.querySelector('.auto-modelo');
    await fillModelos(e.target.value, $modelo);
  }
}

async function fillMarcas ($selectMarca) {
  const base = await findApiBase();
  $selectMarca.innerHTML = `<option value="" disabled selected>Marca</option>`;
  try {
    const res = await fetch(`${base}/modelos/marcas`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.marcas || []);
    const unique = [...new Map(
      list.map(m => [String(m).trim().toLowerCase(), String(m).trim().replace(/\s+/g, ' ')])
    )].map(([, pretty]) => pretty)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    unique.forEach(m => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = m;
      $selectMarca.appendChild(opt);
    });
  } catch (e) { console.error('Error cargando marcas', e); }
}

async function fillModelos (marca, $selectModelo) {
  const st = modelosState.get($selectModelo) || { loading: false, marca: '' };
  if (st.loading) return;
  if (st.marca === marca) return;
  st.loading = true; modelosState.set($selectModelo, st);

  $selectModelo.innerHTML = `<option value="" disabled selected>Modelo</option>`;
  if (!marca) { $selectModelo.disabled = true; st.loading = false; return; }
  $selectModelo.disabled = false;

  const base = await findApiBase();
  try {
    const res = await fetch(`${base}/modelos?marca=${encodeURIComponent(marca)}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.modelos || []);
    const unique = [...new Map(
      list.map(mo => [String(mo).trim().toLowerCase(), String(mo).trim().replace(/\s+/g, ' ')])
    )].map(([, pretty]) => pretty)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    unique.forEach(modelo => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = modelo;
      $selectModelo.appendChild(opt);
    });
    st.marca = marca;
  } catch (e) { console.error('Error cargando modelos', e); }
  finally { st.loading = false; modelosState.set($selectModelo, st); }
}

// =========================
/* Pago simulado al final */
// =========================
function initPlanBox () {
  const plan = document.querySelector('input[name="plan"]:checked')?.value || 'standard';
  if ($pagoSim) $pagoSim.style.display = 'block';
  if ($pagoEstado) $pagoEstado.textContent = `Plan ${plan} — Importe AR$ ${PRICES[plan].toLocaleString('es-AR')}`;
}

document.addEventListener('change', (e) => {
  if (e.target.name === 'plan') {
    resetPaymentUI();
    const plan = document.querySelector('input[name="plan"]:checked').value;
    if ($pagoSim) $pagoSim.style.display = 'block';
    if ($pagoEstado) $pagoEstado.textContent = `Plan ${plan} — Importe AR$ ${PRICES[plan].toLocaleString('es-AR')}`;
  }
});

// Mostrar el flujo de pago
$btnProcesar?.addEventListener('click', () => {
  // Quita la clase que lo oculta
  $pagoFlow.classList.remove('hidden');
  $pagoEstado.textContent = 'Seleccioná tu tarjeta para continuar.';
});

$brandGroup?.addEventListener('change', (e) => {
  if (e.target.name === 'card_brand') {
    selectedBrand = e.target.value;
    enablePayIfReady();
  }
});

$cardLast4?.addEventListener('input', () => {
  $cardLast4.value = $cardLast4.value.replace(/\D/g, '').slice(0, 4);
  enablePayIfReady();
});

$cardExp?.addEventListener('input', () => {
  let v = $cardExp.value.replace(/[^\d]/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
  $cardExp.value = v;
  enablePayIfReady();
});

function enablePayIfReady () {
  const okLast4 = $cardLast4 ? /^\d{4}$/.test($cardLast4.value) : false;
  const okExp = $cardExp ? /^((0[1-9])|(1[0-2]))\/\d{2}$/.test($cardExp.value) : false;
  if ($btnPagar) $btnPagar.disabled = !(selectedBrand && okLast4 && okExp);
}

$btnPagar?.addEventListener('click', async () => {
  if ($btnPagar.disabled) return;
  $btnPagar.disabled = true;
  const prev = $btnPagar.textContent;
  $btnPagar.textContent = 'Procesando...';
  if ($pagoEstado) $pagoEstado.textContent = '';
  await new Promise(r => setTimeout(r, 900));
  paymentOk = true;
  $btnPagar.textContent = prev;
  const brandName = selectedBrand === 'visa' ? 'Visa' : 'Mastercard';
  if ($pagoEstado) $pagoEstado.textContent = `✔️ Pago aprobado con ${brandName}`;
});

// Reset del UI de pago
function resetPaymentUI(){
  paymentOk = false;
  selectedBrand = null;
  // Volver a ocultar el flujo
  $pagoFlow.classList.add('hidden');
  $pagoEstado.textContent = '';
  $btnPagar.disabled = true;

  const sel = $brandGroup.querySelector('input[name="card_brand"]:checked');
  if(sel) sel.checked = false;
  $cardLast4.value = '';
  $cardExp.value = '';
}

// =========================
/* PDF helpers */
// =========================
function genOrderId () {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 6);
  return `FS-${t}-${r}`.toUpperCase();
}
function formatDateTime (d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loadImageAsDataURL (url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function generateReceiptPDF({ nombre, email, plan, amount, brand, last4, autosCount, orderId, ts }) {
  const lib = window.jspdf;
  if (!lib || !lib.jsPDF) return;
  const { jsPDF } = lib;

  // --- helpers ---
  const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--azul-morado').trim() || '#2a2aae';
  const hexToRgb = (hex) => {
    const m = hex.replace('#','').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 42, g: 42, b: 174 }; // fallback  #2a2aae
    return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  };
  const { r, g, b } = hexToRgb(cssVar);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const left = 48;
  const right = pageW - 35;
  let y = 64;

  // ====== Franja superior (sin logo) ======
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 80, 'F');

  // Título sobre la franja
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.text('FullService - Comprobante de alta', left, 45);
  doc.setTextColor(0);

  // ====== Marca de agua (logo grande, centrado y transparente) ======
  const logo = await loadImageAsDataURL('./assets/img/logo-fullservice.png');
  if (logo) {
    try {
      const img = new Image();
      img.src = logo;
      await new Promise((r) => { img.onload = r; img.onerror = r; });

      const ratio = img.width / img.height;
      const maxW = pageW * 0.6;
      const maxH = pageH * 0.6;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (pageW - drawW) / 2;
      const yWM = (pageH - drawH) / 2;

      try {
        const gs = new doc.GState({ opacity: 0.08 });
        doc.setGState(gs);
        doc.addImage(logo, 'PNG', x, yWM, drawW, drawH, undefined, 'FAST');
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch {
        // fallback sin opacidad (algunas versiones)
        doc.addImage(logo, 'PNG', x, yWM, drawW, drawH, undefined, 'FAST');
      }
    } catch {}
  }

  // ====== Cuerpo ======
  y = 100;
  doc.setLineWidth(0.8);
  doc.line(left, y, right, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`N° de comprobante: ${orderId}`, left, y); y += 16;
  doc.text(`Fecha y hora: ${ts}`, left, y); y += 24;

  doc.setFont('helvetica', 'bold'); doc.text('Datos del usuario', left, y); y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${nombre}`, left, y); y += 16;
  doc.text(`Email: ${email}`, left, y); y += 24;

  doc.setFont('helvetica', 'bold'); doc.text('Plan y pago', left, y); y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Plan contratado: ${plan === 'premium' ? 'Premium' : 'Standard'}`, left, y); y += 16;
  doc.text(`Importe: AR$ ${amount.toLocaleString('es-AR')}`, left, y); y += 16;
  doc.text(`Medio de pago: ${brand === 'visa' ? 'Visa' : 'Mastercard'} •••• ${last4}`, left, y); y += 24;

  doc.setFont('helvetica', 'bold'); doc.text('Vehículos registrados', left, y); y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Cantidad: ${autosCount}`, left, y); y += 24;

  doc.setFont('helvetica', 'italic');
  doc.setTextColor(110);
  doc.text('Este es un comprobante no fiscal generado automáticamente por FullService.', left, y);

  doc.save(`comprobante-fullservice-${orderId}.pdf`);
}



// =========================
/* Lectura del formulario */
// =========================
function readPlan () {
  return document.querySelector('input[name="plan"]:checked')?.value || 'standard';
}

function readAutosFromDOM () {
  const rows = [...$autosContainer.querySelectorAll('.auto-row')];
  if (rows.length === 0) throw new Error('Agregá al menos un vehículo.');
  const autos = [];
  for (const row of rows) {
    const marca = row.querySelector('.auto-marca')?.value?.trim();
    const modelo = row.querySelector('.auto-modelo')?.value?.trim();
    const anio = parseInt(row.querySelector('.auto-anio')?.value || '0', 10);
    if (!marca || !modelo || !anio) throw new Error('Completá marca, modelo y año en todos los vehículos.');
    if (anio < 1950 || anio > 2099) throw new Error('El año del vehículo está fuera de rango.');
    autos.push({ marca, modelo, anio });
  }
  return autos;
}

// =========================
/* Submit /registro */
// =========================
async function onSubmit (e) {
  e.preventDefault();
  hideFeedback();

  // Validaciones
  const acepto = !!$id('accept_policies')?.checked;
  if (!acepto) { showFeedback('Debes aceptar la Política de Privacidad para continuar.', false); return; }

  if (!paymentOk) { showFeedback('Procesá el pago antes de crear tu cuenta.', false); return; }

  const nombre = $id('nombre').value.trim();
  const email = $id('email').value.trim();
  const password = $id('password').value;
  const plan = readPlan();

  if (!nombre || !email || !password) {
    showFeedback('Completá nombre, email y contraseña.', false);
    return;
  }

  let autos;
  try {
    autos = readAutosFromDOM();
  } catch (err) {
    showFeedback(err.message || 'Revisá los datos de los vehículos.', false);
    return;
  }

  const submitBtn = $form.querySelector('button[type="submit"]');
  const prevLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creando cuenta...';

  const orderId = genOrderId();
  const ts = formatDateTime();
  const amount = PRICES[plan];

  try {
    const base = await findApiBase();
    const payload = {
      nombre, email, password, plan, autos,
      accept_policies: true,
      terms_version: 'v1.0',
      marketing_opt_in: false,
      payment_ok: true
    };

    const res = await fetch(`${base}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errMsg = 'Error al crear la cuenta.';
      try {
        const data = await res.json();
        if (data?.mensaje) errMsg = data.mensaje;
      } catch {
        const text = await res.text().catch(() => null);
        if (text) errMsg = text;
      }
      throw new Error(errMsg);
    }

    // =========================
    // Éxito: modal SI/NO si existe, o fallback con confirm()
    // =========================
    const autosCount = autos.length;

    const handlePDFandRedirect = async () => {
      await generateReceiptPDF({
        nombre, email, plan, amount,
        brand: selectedBrand, last4: $cardLast4?.value || '0000',
        autosCount, orderId, ts
      });
      alert('Descarga completada. Serás redirigido al inicio de sesión.');
      window.location.href = 'login.html';
    };

    const justRedirect = () => {
      alert('Serás redirigido al inicio de sesión.');
      window.location.href = 'login.html';
    };

    if ($modal && $btnPDFSi && $btnPDFNo) {
      // Modal disponible
      $modal.style.display = 'flex';
      $btnPDFSi.onclick = async () => {
        $modal.style.display = 'none';
        await handlePDFandRedirect();
      };
      $btnPDFNo.onclick = () => {
        $modal.style.display = 'none';
        justRedirect();
      };
    } else {
      // Fallback sin modal (evita el error .style)
      const desea = confirm('✔️ Cuenta creada.\n\n¿Deseás descargar tu comprobante en PDF ahora?');
      if (desea) await handlePDFandRedirect();
      else justRedirect();
    }

  } catch (err) {
    console.error(err);
    showFeedback(err?.message || 'Ocurrió un error al registrar.', false);
    submitBtn.disabled = false;
    submitBtn.textContent = prevLabel;
  }
}
