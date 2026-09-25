const pantallaLogin = document.getElementById('pantallaLogin');
const pantallaAdmin = document.getElementById('pantallaAdmin');
const claveAcceso = document.getElementById('claveAcceso');
const btnEntrar = document.getElementById('btnEntrar');
const errorLogin = document.getElementById('errorLogin');
claveAcceso.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnEntrar.click();
});
let credencialesGuardadas = null;

window.addEventListener('DOMContentLoaded', () => {
    const guardadas = sessionStorage.getItem('sstAuth');
    if (guardadas) {
        credencialesGuardadas = guardadas;
        mostrarPanel();
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
    // Validamos la clave contra el mismo endpoint del historial
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

function mostrarPanel() {
    pantallaLogin.style.display = 'none';
    pantallaAdmin.style.display = 'block';
}

document.getElementById('volverDesdeAdmin').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('sstAuth');
    window.location.href = 'index.html';
});

// ---- Constructor de preguntas ----
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
        <input type="text" class="texto-pregunta" placeholder="Escribe la pregunta" style="width:100%; margin-bottom:6px;">
        <select class="tipo-pregunta" style="margin-bottom:6px;">
            <option value="texto">Respuesta de texto libre</option>
            <option value="seleccion">Opciones para elegir (ej: Sí/No)</option>
        </select>
        <input type="text" class="opciones-pregunta" placeholder="Separa cada opción con una COMA. Ejemplo: Sí,No" style="width:100%; display:none;">
        <button type="button" class="btnEliminarPregunta">Eliminar</button>
    `;

    const tipoSelect = div.querySelector('.tipo-pregunta');
    const opcionesInput = div.querySelector('.opciones-pregunta');
    tipoSelect.addEventListener('change', () => {
        opcionesInput.style.display = tipoSelect.value === 'seleccion' ? 'block' : 'none';
    });

    div.querySelector('.btnEliminarPregunta').addEventListener('click', () => div.remove());

    listaPreguntas.appendChild(div);
}

// Arranca con una pregunta ya lista para no dejarlo vacío
agregarPregunta();

// ---- Guardar capacitación ----
document.getElementById('btnGuardarCap').addEventListener('click', async () => {
    const nombre = document.getElementById('nombreCap').value.trim();
    const fecha = document.getElementById('fechaCap').value;
    const mensajeAdmin = document.getElementById('mensajeAdmin');

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

    try {
        const resp = await fetch('/api/capacitaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesGuardadas}`
            },
            body: JSON.stringify({ nombre, fecha, preguntas })
        });

        const resultado = await resp.json();

        if (resp.ok) {
            mensajeAdmin.textContent = '✅ Capacitación creada';
            mensajeAdmin.style.color = 'green';

            const link = `${window.location.origin}/index.html?cap=${resultado.id}`;
            document.getElementById('linkGenerado').value = link;
            document.getElementById('resultadoLink').style.display = 'block';
        } else {
            mensajeAdmin.textContent = `❌ Error: ${resultado.error}`;
            mensajeAdmin.style.color = 'red';
        }
    } catch (error) {
        console.error(error);
        mensajeAdmin.textContent = '❌ No se pudo conectar con el servidor';
        mensajeAdmin.style.color = 'red';
    }
});

document.getElementById('btnCopiarLink').addEventListener('click', () => {
    const boton = document.getElementById('btnCopiarLink');
    const input = document.getElementById('linkGenerado');
    navigator.clipboard.writeText(input.value);

    const textoOriginal = boton.textContent;
    boton.textContent = '✅ ¡Copiado!';
    setTimeout(() => { boton.textContent = textoOriginal; }, 1500);
});