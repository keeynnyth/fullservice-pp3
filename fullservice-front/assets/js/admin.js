


document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const tablaBody = document.querySelector('#tabla-usuarios tbody');

  if (!token) {
    alert('Acceso denegado. Debes iniciar sesión.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/admin/usuarios', {
      method: 'GET',
      headers: {
        'Authorization': token
      }
    });

    if (!res.ok) {
      throw new Error('Token inválido o sesión expirada');
    }

    const usuarios = await res.json();

    if (usuarios.length === 0) {
      tablaBody.innerHTML = '<tr><td colspan="5">No hay usuarios registrados</td></tr>';
    } else {
      usuarios.forEach(user => {
        const fila = `
          <tr data-id="${user.id}">
            <td>${user.id}</td>
            <td>${user.nombre}</td>
            <td>${user.email}</td>
            <td>${new Date(user.creado_en).toLocaleString()}</td>
            <td>
              <button class="btn-editar" data-id="${user.id}">Editar</button>
              <button class="btn-eliminar" data-id="${user.id}">Eliminar</button>
            </td>
          </tr>
        `;
        tablaBody.insertAdjacentHTML('beforeend', fila);
      });

      // Asignar eventos a botones eliminar
      document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const userId = e.target.dataset.id;

          const confirmar = confirm('¿Estás seguro de que deseas eliminar este usuario?');
          if (!confirmar) return;

          try {
            const res = await fetch(`http://localhost:3000/admin/usuarios/${userId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': token
              }
            });

            const data = await res.json();
            if (res.ok) {
              // Eliminar la fila de la tabla
              const fila = document.querySelector(`tr[data-id="${userId}"]`);
              if (fila) fila.remove();
              alert('Usuario eliminado correctamente.');
            } else {
              alert(data.mensaje || 'No se pudo eliminar el usuario.');
            }
          } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el usuario.');
          }
        });
      });
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    alert('Error al acceder. Por favor, iniciá sesión nuevamente.');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
});
