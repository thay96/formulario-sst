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
const selectorCapacitacion = document.getElementById('selectorCapacitacion');
const btnDescargarExcel = document.getElementById('btnDescargarExcel');

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
        return;
    }

    const credenciales = btoa(`sst:${clave}`);
    cargarHistorial(credenciales);
});

claveAcceso.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnEntrar.click();
});

async function cargarHistorial(credenciales) {
    try {
        const respuesta = await fetch('/api/registros', {
            headers: { 'Authorization': `Basic ${credenciales}` }
        });

        if (respuesta.status === 401) {
            errorLogin.textContent = '❌ Clave incorrecta';
            errorLogin.style.display = 'block';
            sessionStorage.removeItem('sstAuth');
            return;
        }

        const registros = await respuesta.json();
        todosLosRegistros = registros;

        sessionStorage.setItem('sstAuth', credenciales);

        pantallaLogin.style.display = 'none';
        pantallaHistorial.style.display = 'block';

        renderizarTabla(registros);
        cargarCapacitaciones(credenciales);
    } catch (error) {
        console.error(error);
        errorLogin.textContent = '❌ No se pudo conectar con el servidor';
        errorLogin.style.display = 'block';
    }
}

async function cargarCapacitaciones(credenciales) {
    try {
        const resp = await fetch('/api/capacitaciones', {
            headers: { 'Authorization': `Basic ${credenciales}` }
        });
        const capacitaciones = await resp.json();

        selectorCapacitacion.innerHTML = '<option value="">Todas las capacitaciones</option>' +
            capacitaciones.map(c => `<option value="${c.id}">${c.nombre} (${new Date(c.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })})</option>`).join('');
    } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
    }
}

selectorCapacitacion.addEventListener('change', async () => {
    const credenciales = sessionStorage.getItem('sstAuth');
    const capId = selectorCapacitacion.value;
    const url = capId ? `/api/registros?capacitacion_id=${capId}` : '/api/registros';

    const resp = await fetch(url, { headers: { 'Authorization': `Basic ${credenciales}` } });
    const registros = await resp.json();
    todosLosRegistros = registros;
    renderizarTabla(registros);
});

btnDescargarExcel.addEventListener('click', async () => {
    const credenciales = sessionStorage.getItem('sstAuth');
    const capId = selectorCapacitacion.value;
    const url = capId ? `/api/registros/excel?capacitacion_id=${capId}` : '/api/registros/excel';

    const resp = await fetch(url, { headers: { 'Authorization': `Basic ${credenciales}` } });
    const blob = await resp.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'registros.xlsx';
    link.click();
});

function renderizarTabla(registros) {
    cuerpoTabla.innerHTML = '';
    registros.forEach(r => {
        const fila = document.createElement('tr');
        const respuestasTexto = (r.respuestas || [])
            .map(resp => `<strong>${resp.texto_pregunta}:</strong> ${resp.respuesta}`)
            .join('<br>');

        fila.innerHTML = `
            <td>${r.nombre_completo}</td>
            <td>${r.cedula}</td>
            <td>${new Date(r.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td>
            <td>${r.cargo}</td>
            <td>${respuestasTexto || '-'}</td>
            <td>${r.foto ? `<img src="data:image/jpeg;base64,${r.foto}" class="miniatura" style="width:50px; cursor:pointer;">` : '-'}</td>
        `;
        cuerpoTabla.appendChild(fila);
    });

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

const volverDesdeHistorial = document.getElementById('volverDesdeHistorial');
if (volverDesdeHistorial) {
    volverDesdeHistorial.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('sstAuth');
        window.location.href = 'index.html';
    });
}