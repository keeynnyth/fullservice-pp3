

// perfil.js (Frontend - Solicitar Perfil)
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const respuesta = document.getElementById('respuesta-perfil');

  if (!token) {
    respuesta.textContent = 'No estás autenticado. Por favor, inicia sesión.';
    window.location.href = 'login.html';  // Redirige a login si no hay token
    return;
  }

  fetch('http://localhost:3000/perfil/perfil', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,  // Enviar token JWT en la cabecera
    },
  })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        document.getElementById('nombre').textContent = data.user.nombre;
        document.getElementById('email').textContent = data.user.email;
        document.getElementById('autos').textContent = data.autos.length;
        document.getElementById('turnosCount').textContent = data.turnosCount;
        document.getElementById('fechaRegistro').textContent = data.fechaRegistro;
      } else {
        respuesta.textContent = 'Error al cargar el perfil.';
      }
    })
    .catch(error => {
      console.error('Error al obtener los datos del perfil:', error);
      respuesta.textContent = 'Ocurrió un error al intentar obtener el perfil.';
    });
});
