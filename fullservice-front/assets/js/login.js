

// login.js
const CANDIDATES = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  'http://localhost:3001',
];

let API_BASE;
async function apiBase() {
  if (API_BASE) return API_BASE;
  for (const b of CANDIDATES) {
    try {
      const r = await fetch(`${b}/health`, { method: 'GET' });
      if (r.ok) { API_BASE = b; return b; }
    } catch {}
  }
  throw new Error('API no disponible');
}

function showFeedback($el, msg, ok = true) {
  $el.hidden = false;
  $el.className = `flash ${ok ? 'flash-success' : 'flash-error'}`;
  $el.textContent = `${ok ? '✔️' : '❌'} ${msg}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const $form = document.getElementById('form-login');
  const $btn  = document.getElementById('btn-login');
  const $fb   = document.getElementById('login-feedback');

  $form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // limpiar feedback
    $fb.hidden = true; 
    $fb.textContent = ''; 
    $fb.className = 'flash';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showFeedback($fb, 'Completá email y contraseña.', false);
      return;
    }

    try {
      $btn.disabled = true; 
      $btn.textContent = 'Ingresando…';

      const base = await apiBase();
      const res = await fetch(`${base}/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });

      const text = await res.text();
      let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

      if (!res.ok) {
        showFeedback($fb, data?.mensaje || 'Error interno', false);
        $btn.disabled = false; 
        $btn.textContent = 'Ingresar';
        return;
      }

      // Guardar token y nombre (viene en data.usuario)
      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.usuario?.nombre) localStorage.setItem('nombre', data.usuario.nombre);

      showFeedback($fb, '¡Bienvenido! Redirigiendo…', true);

      // Redirigir al home
      setTimeout(() => {
        window.location.href = 'inicio.html';
      }, 1200);

    } catch (err) {
      console.error(err);
      showFeedback($fb, 'No se pudo conectar con la API.', false);
      $btn.disabled = false; 
      $btn.textContent = 'Ingresar';
    }
  });
});
