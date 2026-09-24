// frontend/historial.js

const pantallaLogin = document.getElementById('pantallaLogin');
const pantallaHistorial = document.getElementById('pantallaHistorial');
const claveAcceso = document.getElementById('claveAcceso');
const btnEntrar = document.getElementById('btnEntrar');
const errorLogin = document.getElementById('errorLogin');
const cuerpoTabla = document.getElementById('cuerpoTabla');

const buscador = document.getElementById('buscador');
let todosLosRegistros = [];
const modalFoto = document.getElementById('modalFoto');
const imagenModal = document.getElementById('imagenModal');
const cerrarModal = document.getElementById('cerrarModal');

// Al cargar la página, revisa si ya había una sesión guardada en este navegador
window.addEventListener('DOMContentLoaded', () => {
    const credencialesGuardadas = sessionStorage.getItem('sstAuth');
    if (credencialesGuardadas) {
        cargarHistorial(credencialesGuardadas);
    }
});

btnEntrar.addEventListener('click', () => {
    const clave = claveAcceso.value.trim();

    if (!clave) {
        errorLogin.textContent = '❌ Debes ingresar la clave';
        errorLogin.style.display = 'block';
        return; // no manda la petición si está vacío
    }

    const credenciales = btoa(`sst:${clave}`);
    cargarHistorial(credenciales);
});

// Permitir dar Enter en vez de clic
claveAcceso.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnEntrar.click();
});

async function cargarHistorial(credenciales) {
    try {
        const respuesta = await fetch('/api/registros', {
            headers: { 'Authorization': `Basic ${credenciales}` }
        });

        if (respuesta.status === 401) {
            errorLogin.style.display = 'block';
            sessionStorage.removeItem('sstAuth');
            return;
        }

        const registros = await respuesta.json();
        todosLosRegistros = registros; // ← AGREGA ESTA LÍNEA

        sessionStorage.setItem('sstAuth', credenciales);

        pantallaLogin.style.display = 'none';
        pantallaHistorial.style.display = 'block';

        renderizarTabla(registros);
    } catch (error) {
        console.error(error);
        errorLogin.textContent = '❌ No se pudo conectar con el servidor';
        errorLogin.style.display = 'block';
    }
}

function renderizarTabla(registros) {
    cuerpoTabla.innerHTML = '';
    registros.forEach(r => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${r.nombre_completo}</td>
            <td>${r.cedula}</td>
            <td>${new Date(r.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td>
            <td>${r.cargo}</td>
            <td>${r.quedo_clara_la_informacion}</td>
            <td>${r.observacion || '-'}</td>
        <td>${r.foto ? `<img src="data:image/jpeg;base64,${r.foto}" class="miniatura" style="width:50px; cursor:pointer;">` : '-'}</td>
        `;
        cuerpoTabla.appendChild(fila);
    });

    // Click en cada miniatura para agrandarla
    document.querySelectorAll('.miniatura').forEach(img => {
        img.addEventListener('click', () => {
            imagenModal.src = img.src;
            modalFoto.style.display = 'flex';
        });
    });
}

cerrarModal.addEventListener('click', () => {
    modalFoto.style.display = 'none';
});


buscador.addEventListener('input', () => {
    const texto = buscador.value.toLowerCase().trim();

    const filtrados = todosLosRegistros.filter(r =>
        r.nombre_completo.toLowerCase().includes(texto) ||
        r.cedula.toLowerCase().includes(texto)
    );

    renderizarTabla(filtrados);
});