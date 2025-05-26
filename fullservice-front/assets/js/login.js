

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  const respuesta = document.getElementById('respuesta-login');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      respuesta.textContent = 'Por favor, completá todos los campos.';
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Guardar el token en localStorage
        localStorage.setItem('token', data.token);

        // Redirigir al usuario
        window.location.href = 'bienvenida.html';
      } else {
        respuesta.textContent = data.mensaje;
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      respuesta.textContent = 'Ocurrió un error al intentar ingresar.';
    }
  });
});
