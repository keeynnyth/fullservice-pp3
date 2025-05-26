document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-registro');
  const respuesta = document.getElementById('respuesta-registro');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!nombre || !email || !password) {
      respuesta.textContent = 'Por favor, completá todos los campos.';
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await res.json();
      respuesta.textContent = data.mensaje;
      if (res.ok) form.reset(); // Limpiar solo si fue exitoso
    } catch (error) {
      console.error('Error al registrar:', error);
      respuesta.textContent = 'Ocurrió un error al registrar el usuario.';
    }
  });
});
