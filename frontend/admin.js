// --- VARIABLES GLOBALES ---
const pantallaLogin = document.getElementById('pantallaLogin');
const pantallaAdmin = document.getElementById('pantallaAdmin');
const claveAcceso = document.getElementById('claveAcceso');
const btnEntrar = document.getElementById('btnEntrar');
const errorLogin = document.getElementById('errorLogin');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const mensajeAdmin = document.getElementById('mensajeAdmin');

let credencialesGuardadas = null;
let capacitacionYaCreada = false;
let todosLosRegistros = [];

// Variables para el modal de eliminar
let idAEliminar = null;
let tipoAEliminar = null; // 'registro' o 'capacitacion'

// --- LOGIN ---
claveAcceso.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnEntrar.click();
});

btnEntrar.addEventListener('click', () => {
    const clave = claveAcceso.value.trim();
    if (!clave) {
        errorLogin.textContent = '❌ Debes ingresar la clave';
        errorLogin.style.display = 'block';
        return;
    }
    const credenciales = btoa(`sst:${clave}`);
    fetch('/api/registros', { headers: { 'Authorization': `Basic ${credenciales}` } })
        .then(resp => {
            if (resp.status === 401) {
                errorLogin.textContent = '❌ Clave incorrecta';
                errorLogin.style.display = 'block';
                return;
            }
            credencialesGuardadas = credenciales;
            sessionStorage.setItem('sstAuth', credenciales);
            mostrarPanel();
        });
});

// Auto-login si ya hay sesión guardada
window.addEventListener('DOMContentLoaded', () => {
    const guardadas = sessionStorage.getItem('sstAuth');
    if (guardadas) {
        credencialesGuardadas = guardadas;
        mostrarPanel();
    }
});

function mostrarPanel() {
    pantallaLogin.style.display = 'none';
    pantallaAdmin.style.display = 'block';
    cargarRegistros();
    cargarCapacitaciones();
}

// --- CERRAR SESIÓN ---
btnCerrarSesion.addEventListener('click', () => {
    sessionStorage.removeItem('sstAuth');
    window.location.href = 'index.html';
});

// --- PESTAÑAS (TABS) ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e.target.id === 'btnCerrarSesion') return;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        e.target.classList.add('active');
        const tabId = e.target.dataset.tab;
        document.getElementById(tabId).classList.add('active');
    });
});

// --- CARGAR REGISTROS (TABLA) ---
async function cargarRegistros() {
    try {
        const resp = await fetch('/api/registros', { headers: { 'Authorization': `Basic ${credencialesGuardadas}` } });
        const registros = await resp.json();
        todosLosRegistros = registros;
        renderizarTabla(registros);
    } catch (error) {
        console.error('Error al cargar registros:', error);
    }
}

function renderizarTabla(registros) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    cuerpoTabla.innerHTML = '';
    registros.forEach(r => {
        const fila = document.createElement('tr');
        const respuestasTexto = (r.respuestas || []).map(resp => `<strong>${resp.texto_pregunta}:</strong> ${resp.respuesta}`).join('<br>');
        fila.innerHTML = `
            <td>${r.nombre_completo}</td>
            <td>${r.cedula}</td>
            <td>${new Date(r.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td>
            <td>${r.cargo}</td>
            <td>${respuestasTexto || '-'}</td>
            <td>${r.foto ? `<img src="data:image/jpeg;base64,${r.foto}" class="miniatura" style="width:50px; cursor:pointer;">` : '-'}</td>
            <td>
    <button type="button" class="btn-accion btn-eliminar-cap btnEliminarRegistro" data-id="${r.id}" title="Eliminar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </button>
</td>
        `;
        cuerpoTabla.appendChild(fila);
    });

    document.querySelectorAll('.miniatura').forEach(img => {
        img.addEventListener('click', () => {
            document.getElementById('imagenModal').src = img.src;
            document.getElementById('modalFoto').style.display = 'flex';
        });
    });

    document.querySelectorAll('.btnEliminarRegistro').forEach(boton => {
        boton.addEventListener('click', () => {
            abrirModalEliminar(boton.dataset.id, 'registro');
        });
    });
}

// --- CARGAR CAPACITACIONES Y LISTA DE ADMIN ---
async function cargarCapacitaciones() {
    try {
        const resp = await fetch('/api/capacitaciones', { headers: { 'Authorization': `Basic ${credencialesGuardadas}` } });
        const capacitaciones = await resp.json();

        // Llenar el select del historial
        document.getElementById('selectorCapacitacion').innerHTML = '<option value="">Todas las capacitaciones</option>' +
            capacitaciones.map(c => `<option value="${c.id}">${c.nombre} (${new Date(c.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })})</option>`).join('');

        // Llenar la lista de "Mis Capacitaciones"
        const lista = document.getElementById('listaCapacitacionesAdmin');
        if (capacitaciones.length === 0) {
            lista.innerHTML = '<p>No has creado ninguna capacitación aún.</p>';
        } else {

            lista.innerHTML = capacitaciones.map(c => `
                <div class="capacitacion-item">
                    <div class="capacitacion-info">
                         <strong>${c.nombre}</strong><br>
                         <small>Fecha: ${new Date(c.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</small>
                     </div>
                    <div class="capacitacion-acciones">
                    <a href="index.html?cap=${c.id}" target="_blank" class="btn-accion btn-ver">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      Abrir
                     </a>
                    <button type="button" class="btn-accion btn-eliminar-cap" data-id="${c.id}" title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `).join('');

            // Evento para eliminar capacitación
            document.querySelectorAll('.btn-eliminar-cap').forEach(boton => {
                boton.addEventListener('click', () => {
                    abrirModalEliminar(boton.dataset.id, 'capacitacion');
                });
            });
        }
    } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
    }
}

// --- LÓGICA DEL MODAL DE ELIMINAR ---
function abrirModalEliminar(id, tipo) {
    idAEliminar = id;
    tipoAEliminar = tipo;
    document.getElementById('modalConfirmar').style.display = 'flex';
}

document.getElementById('btnConfirmarNo').addEventListener('click', () => {
    document.getElementById('modalConfirmar').style.display = 'none';
    idAEliminar = null;
    tipoAEliminar = null;
});

document.getElementById('btnConfirmarSi').addEventListener('click', async () => {
    if (!idAEliminar) return;
    document.getElementById('modalConfirmar').style.display = 'none';

    try {
        if (tipoAEliminar === 'registro') {
            const resp = await fetch(`/api/registros/${idAEliminar}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Basic ${credencialesGuardadas}` }
            });
            if (resp.ok) {
                todosLosRegistros = todosLosRegistros.filter(r => r.id != idAEliminar);
                renderizarTabla(todosLosRegistros);
            }
        } else if (tipoAEliminar === 'capacitacion') {
            const resp = await fetch(`/api/capacitaciones/${idAEliminar}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Basic ${credencialesGuardadas}` }
            });

            if (resp.ok) {
                cargarCapacitaciones();
                cargarRegistros();
            } else {
                // Leer el mensaje del backend
                const data = await resp.json();
                mostrarAviso(data.error || 'No se pudo eliminar la capacitación.');
            }
        }
    } catch (error) {
        console.error(error);
        mostrarAviso('Error de conexión con el servidor.');
    } finally {
        idAEliminar = null;
        tipoAEliminar = null;
    }
});

// --- FUNCIÓN PARA MOSTRAR EL AVISO ---
function mostrarAviso(mensaje) {
    document.getElementById('textoAviso').textContent = mensaje;
    document.getElementById('modalAviso').style.display = 'flex';
}

// Cerrar el modal de aviso
document.getElementById('btnCerrarAviso').addEventListener('click', () => {
    document.getElementById('modalAviso').style.display = 'none';
});

// Cerrar modal foto
document.getElementById('cerrarModal').addEventListener('click', () => document.getElementById('modalFoto').style.display = 'none');

// Filtro del selector
document.getElementById('selectorCapacitacion').addEventListener('change', async () => {
    const capId = document.getElementById('selectorCapacitacion').value;
    const url = capId ? `/api/registros?capacitacion_id=${capId}` : '/api/registros';
    const resp = await fetch(url, { headers: { 'Authorization': `Basic ${credencialesGuardadas}` } });
    const registros = await resp.json();
    todosLosRegistros = registros;
    renderizarTabla(registros);
});

// --- CREAR CAPACITACIÓN ---
const listaPreguntas = document.getElementById('listaPreguntas');
document.getElementById('btnAgregarPregunta').addEventListener('click', agregarPregunta);

function agregarPregunta() {
    const div = document.createElement('div');
    div.className = 'pregunta-item';
    div.style.border = '1px solid #e5e7eb';
    div.style.padding = '10px';
    div.style.marginBottom = '10px';
    div.style.borderRadius = '8px';
    div.innerHTML = `
        <input type="text" class="texto-pregunta" placeholder="Escribe la pregunta" style="width:100%; margin-bottom:6px; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
        <select class="tipo-pregunta" style="margin-bottom:6px; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
            <option value="texto">Respuesta de texto libre</option>
            <option value="seleccion">Opciones para elegir (ej: Sí/No)</option>
        </select>
        <input type="text" class="opciones-pregunta" placeholder="Separa cada opción con una COMA. Ejemplo: Sí,No" style="width:100%; display:none; margin-bottom:6px; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
        <button type="button" class="btnEliminarPregunta" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">Eliminar</button>
    `;
    const tipoSelect = div.querySelector('.tipo-pregunta');
    const opcionesInput = div.querySelector('.opciones-pregunta');
    tipoSelect.addEventListener('change', () => {
        opcionesInput.style.display = tipoSelect.value === 'seleccion' ? 'block' : 'none';
    });
    div.querySelector('.btnEliminarPregunta').addEventListener('click', () => div.remove());
    listaPreguntas.appendChild(div);
}

document.getElementById('btnGuardarCap').addEventListener('click', async () => {
    if (capacitacionYaCreada) {
        mensajeAdmin.textContent = 'ℹ️ Ya se creó esta capacitación. Si quieres una nueva, dale clic a "Crear otra".';
        mensajeAdmin.style.color = '#2563eb';
        return;
    }
    const nombre = document.getElementById('nombreCap').value.trim();
    const fecha = document.getElementById('fechaCap').value;
    if (!nombre || !fecha) {
        mensajeAdmin.textContent = '❌ Falta el nombre o la fecha';
        mensajeAdmin.style.color = 'red';
        return;
    }

    const preguntas = [];
    document.querySelectorAll('.pregunta-item').forEach(item => {
        const texto = item.querySelector('.texto-pregunta').value.trim();
        const tipo = item.querySelector('.tipo-pregunta').value;
        const opcionesTexto = item.querySelector('.opciones-pregunta').value.trim();
        if (!texto) return;
        const pregunta = { texto_pregunta: texto, tipo };
        if (tipo === 'seleccion' && opcionesTexto) {
            pregunta.opciones = opcionesTexto.split(',').map(o => o.trim()).filter(Boolean);
        }
        preguntas.push(pregunta);
    });

    document.getElementById('btnGuardarCap').disabled = true;
    document.getElementById('btnGuardarCap').textContent = 'Guardando...';

    try {
        const resp = await fetch('/api/capacitaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${credencialesGuardadas}` },
            body: JSON.stringify({ nombre, fecha, preguntas })
        });
        const resultado = await resp.json();
        if (resp.ok) {
            mensajeAdmin.textContent = 'Capacitación creada';
            mensajeAdmin.style.color = 'green';
            capacitacionYaCreada = true;
            document.getElementById('btnGuardarCap').textContent = ' Guardada';
            const link = `${window.location.origin}/index.html?cap=${resultado.id}`;
            document.getElementById('linkGenerado').value = link;
            document.getElementById('resultadoLink').style.display = 'block';
            cargarCapacitaciones();
        } else {
            mensajeAdmin.textContent = `❌ Error: ${resultado.error}`;
            mensajeAdmin.style.color = 'red';
            document.getElementById('btnGuardarCap').disabled = false;
            document.getElementById('btnGuardarCap').textContent = 'Guardar capacitación';
        }
    } catch (error) {
        mensajeAdmin.textContent = '❌ No se pudo conectar';
        mensajeAdmin.style.color = 'red';
        document.getElementById('btnGuardarCap').disabled = false;
        document.getElementById('btnGuardarCap').textContent = 'Guardar capacitación';
    }
});

// --- BOTÓN COPIAR LINK (ARREGLADO) ---
document.getElementById('btnCopiarLink').addEventListener('click', async () => {
    const boton = document.getElementById('btnCopiarLink');
    const input = document.getElementById('linkGenerado');

    try {
        await navigator.clipboard.writeText(input.value);
    } catch (err) {
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand('copy');
    }

    const textoOriginal = boton.textContent;
    boton.textContent = ' ¡Copiado!';
    boton.style.background = '#16a34a';

    setTimeout(() => {
        boton.textContent = textoOriginal;
        boton.style.background = '#2563eb';
    }, 2000);
});

document.getElementById('btnOtraCap').addEventListener('click', () => {
    document.getElementById('nombreCap').value = '';
    document.getElementById('fechaCap').value = '';
    listaPreguntas.innerHTML = '';
    agregarPregunta();
    document.getElementById('resultadoLink').style.display = 'none';
    mensajeAdmin.textContent = '';
    document.getElementById('btnGuardarCap').disabled = false;
    document.getElementById('btnGuardarCap').textContent = 'Guardar capacitación';
    capacitacionYaCreada = false;
});