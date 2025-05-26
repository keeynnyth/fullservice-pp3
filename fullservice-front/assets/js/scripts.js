document.addEventListener('DOMContentLoaded', () => {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-inner .servicio');
    const totalSlides = slides.length;
    console.log(totalSlides);

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.transform = `translateX(${(i - index) * 100}%)`;
        });
    }

    document.querySelector('.next').addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    });

    document.querySelector('.prev').addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    });

    showSlide(currentSlide);

});

    document.getElementById('mostrarFormulario').addEventListener('click', () => {
        const form = document.getElementById('registroForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('registroForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const cliente = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            plan: formData.get('plan')
        };

        document.getElementById('registroForm').reset();
        document.getElementById('registroForm').style.display = 'none';
        document.getElementById('mensaje').innerText = 'Registro exitoso';
        setTimeout(() => document.getElementById('mensaje').innerText = '', 3000);
    });

    document.getElementById('mostrarProgramacion').addEventListener('click', () => {
        const form = document.getElementById('programacionForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('taller').addEventListener('change', (event) => {
        const value = event.target.value;
        document.getElementById('tallerAsociado').style.display = value === 'asociado' ? 'block' : 'none';
        document.getElementById('tallerExterno').style.display = value === 'externo' ? 'block' : 'none';
    });

    document.getElementById('programacionForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const turno = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            dia: formData.get('dia'),
            hora: formData.get('hora'),
            lugarRecepcion: formData.get('lugarRecepcion'),
            lugarEntrega: formData.get('lugarEntrega'),
            servicio: Array.from(formData.getAll('servicio')).join(', '),
            taller: formData.get('taller'),
            tallerAsociado: formData.get('taller') === 'asociado' ? formData.get('tallerAsociado') : '',
            tallerExternoNombre: formData.get('taller') === 'externo' ? formData.get('tallerExternoNombre') : '',
            tallerExternoDireccion: formData.get('taller') === 'externo' ? formData.get('tallerExternoDireccion') : ''
        };

        const reciboTexto = `
            Hola amigos de FULLSERVICE! Les envio el detalle de mi cita.<br><br>
            Recibo No: ${Math.floor(Math.random() * 1000000)}<br>
            Nombre: ${turno.nombre}<br>
            Apellido: ${turno.apellido}<br>
            Dirección: ${turno.direccion}<br>
            Teléfono: ${turno.telefono}<br>
            Email: ${turno.email}<br>
            Día: ${turno.dia}<br>
            Hora: ${turno.hora}<br>
            Lugar de Recepción del vehiculo: ${turno.lugarRecepcion}<br>
            Lugar de Entrega del vehiculo: ${turno.lugarEntrega}<br>
            Servicio(s): ${turno.servicio}<br>
            Taller: ${turno.taller}<br>
            ${turno.taller === 'asociado' ? `Taller Asociado: ${turno.tallerAsociado}<br>` : ''}
            ${turno.taller === 'externo' ? `Nombre del Taller: ${turno.tallerExternoNombre}<br>Dirección del Taller: ${turno.tallerExternoDireccion}<br>` : ''}
            <br>
            Quedo a la espera de del costo de los servicios seleccionados para proceder a confirmar mi turno.
        `;

        document.getElementById('programacionForm').reset();
        document.getElementById('programacionForm').style.display = 'none';
        document.getElementById('reciboTexto').innerHTML = reciboTexto;
        document.getElementById('recibo').style.display = 'block';
    });

    document.getElementById('confirmarTurno').addEventListener('click', () => {
        const telefonoEmpresa = "5491126079467"; // Reemplazar con el número de WhatsApp de la empresa
        const reciboTexto = document.getElementById('reciboTexto').innerText;
        const mensaje = encodeURIComponent(reciboTexto);
        const url = `https://wa.me/${telefonoEmpresa}?text=${mensaje}`;

        window.open(url, '_blank');
        document.getElementById('recibo').style.display = 'none';
    });

    document.getElementById('menu-icon').addEventListener('click', () => {
        const navLinks = document.getElementById('nav-links');
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.display = 'flex';
        }
    });


function irAWhatsApp() {
    const telefonoEmpresa = "5491126079467"; // Reemplazar con el número de WhatsApp de la empresa
    const url = `https://wa.me/${telefonoEmpresa}`;
    window.open(url, '_blank');
}

// scripts.js

document.addEventListener('DOMContentLoaded', function() {
    var menuIcon = document.getElementById('menu-icon');
    var navLinks = document.getElementById('nav-links');

    menuIcon.addEventListener('click', function() {
        navLinks.classList.toggle('open');
    });

    // Close the menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            navLinks.classList.remove('open');
        });
    });
});
