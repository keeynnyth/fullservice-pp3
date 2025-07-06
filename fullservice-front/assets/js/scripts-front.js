


  
  document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const btnLogin = document.getElementById('btn-login');
    const btnAdmin = document.getElementById('btn-admin');
    const btnLogout = document.getElementById('btn-logout');

    if (!token) {
      btnLogin.style.display = 'inline-block';
      btnAdmin.style.display = 'none';
      btnLogout.style.display = 'none';
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rol = payload.rol;

        btnLogin.style.display = 'none';
        btnLogout.style.display = 'inline-block';

        if (rol === 'admin') {
          btnAdmin.style.display = 'inline-block';
        }
      } catch (e) {
        console.error('Token inválido:', e);
        localStorage.removeItem('token');
        window.location.reload();
      }
    }

    btnLogin.addEventListener('click', () => {
      window.location.href = 'login.html';
    });

    btnAdmin.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });

    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  });



  document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnAdmin = document.getElementById('btn-admin');
    const btnLogout = document.getElementById('btn-logout');

    if (!token) {
      btnLogin.style.display = 'inline-block';
      btnRegister.style.display = 'inline-block';
      btnAdmin.style.display = 'none';
      btnLogout.style.display = 'none';
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rol = payload.rol;

        btnLogin.style.display = 'none';
        btnRegister.style.display = 'none';
        btnLogout.style.display = 'inline-block';

        if (rol === 'admin') {
          btnAdmin.style.display = 'inline-block';
        }
      } catch (e) {
        console.error('Token inválido:', e);
        localStorage.removeItem('token');
        window.location.reload();
      }
    }

    btnLogin.addEventListener('click', () => {
      window.location.href = 'login.html';
    });

    btnRegister.addEventListener('click', () => {
      window.location.href = 'registro.html';
    });

    btnAdmin.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });

    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  });



  function irAWhatsApp() {
    const telefono = '5491126079467'; // Reemplaza con el número de teléfono real
    const mensaje = 'Hola, me gustaría obtener más información sobre los planes y costos de FullService.';
    const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }




document.addEventListener('DOMContentLoaded', function () {
  const menuIcon = document.getElementById('menu-icon');
  const navLinks = document.getElementById('nav-links');

  // Abrir/cerrar menú al hacer clic en el ícono
  menuIcon.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    menuIcon.innerHTML = isOpen ? '&#10005;' : '&#9776;';
  });

  // Cierra el menú al hacer clic en un enlace
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      menuIcon.innerHTML = '&#9776;';
    });
  });

  // Cierra el menú al hacer clic fuera
  document.addEventListener('click', function (e) {
    if (
      navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !menuIcon.contains(e.target)
    ) {
      navLinks.classList.remove('open');
      menuIcon.innerHTML = '&#9776;';
    }
  });
});


