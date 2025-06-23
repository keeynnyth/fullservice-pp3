// contacto.js (FRONTEND)

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-contacto');
  const respuesta = document.getElementById('respuesta');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombreContacto').value.trim();
    const telefono = document.getElementById('telefonoContacto').value.trim();
    const mensaje = document.getElementById('mensajeContacto').value.trim();

    if (!nombre || !telefono || !mensaje) {
      alert('Por favor completá todos los campos.');
      return;
    }

    try {
      const respuestaServidor = await fetch('http://localhost:3000/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, telefono, mensaje }),
      });

      const data = await respuestaServidor.json();
      document.getElementById('respuesta').innerText = data.mensaje || 'Mensaje enviado correctamente.';
      form.reset(); // <- limpia el formulario al enviar con éxito
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      alert('Hubo un error al enviar el formulario. Por favor, intentá nuevamente.');
    }
  });

  form.addEventListener('reset', function () {
    document.getElementById('respuesta').innerText = '';
  });
});
