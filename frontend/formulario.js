const params = new URLSearchParams(window.location.search);
const capacitacionId = params.get('cap');
const preguntasDinamicas = document.getElementById('preguntasDinamicas');
const mensajeCapacitacion = document.getElementById('mensajeCapacitacion');
const btnEnviar = document.querySelector('button[type="submit"]');

let preguntasCargadas = [];

async function cargarPreguntas() {
    if (!capacitacionId) {
        mensajeCapacitacion.innerHTML = '<p style="color:red;">⚠️ Este link no es válido. Pide a SST el link correcto de la capacitación.</p>';
        btnEnviar.disabled = true;
        return;
    }

    try {
        const resp = await fetch(`/api/capacitaciones/${capacitacionId}/preguntas`);
        const preguntas = await resp.json();
        preguntasCargadas = preguntas;

        preguntasDinamicas.innerHTML = '';
        preguntas.forEach(p => {
            const label = document.createElement('label');
            label.textContent = p.texto_pregunta;
            preguntasDinamicas.appendChild(label);

            if (p.tipo === 'seleccion' && p.opciones) {
                const select = document.createElement('select');
                select.dataset.preguntaId = p.id;
                select.required = true;
                select.innerHTML = '<option value="">Seleccione...</option>' +
                    p.opciones.map(op => `<option value="${op}">${op}</option>`).join('');
                preguntasDinamicas.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.dataset.preguntaId = p.id;
                input.required = true;
                preguntasDinamicas.appendChild(input);
            }
        });
    } catch (error) {
        console.error(error);
        mensajeCapacitacion.innerHTML = '<p style="color:red;">❌ No se pudo cargar la capacitación</p>';
        btnEnviar.disabled = true;
    }
}

cargarPreguntas();


// frontend/formulario.js

document.addEventListener('DOMContentLoaded', () => {
    // Poner la fecha de hoy por defecto
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;
});

const formulario = document.getElementById('formularioSST');
const mensaje = document.getElementById('mensaje') || { textContent: '', style: {} };

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const btnCapturar = document.getElementById('btnCapturar');
const btnRepetir = document.getElementById('btnRepetir');
let fotoCapturada = null; // aquí queda el blob

let camaraActual = 'user'; // 'user' = frontal (selfie), 'environment' = trasera

async function iniciarCamara() {
    // si ya había un stream activo, lo detenemos antes de abrir uno nuevo
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: camaraActual }
    });
    video.srcObject = stream;
}

document.getElementById('btnVoltear').addEventListener('click', () => {
    camaraActual = camaraActual === 'user' ? 'environment' : 'user';
    iniciarCamara();
});

btnCapturar.addEventListener('click', () => {
    const maxAncho = 640; // reduce el tamaño de la foto
    const escala = Math.min(1, maxAncho / video.videoWidth);
    canvas.width = video.videoWidth * escala;
    canvas.height = video.videoHeight * escala;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
        fotoCapturada = blob;
        preview.src = URL.createObjectURL(blob);
        preview.style.display = 'block';
        video.style.display = 'none';
        btnCapturar.style.display = 'none';
        btnRepetir.style.display = 'inline-block';
        document.getElementById('fotoError').style.display = 'none';
    }, 'image/jpeg', 0.8); // un poco menos de calidad, sigue viéndose bien
});

btnRepetir.addEventListener('click', () => {
    fotoCapturada = null;
    preview.style.display = 'none';
    video.style.display = 'block';
    btnCapturar.style.display = 'inline-block';
    btnRepetir.style.display = 'none';
});

iniciarCamara();

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- VALIDACIÓN DEL CHECKBOX ---
    const aceptaDatos = document.getElementById('aceptaDatos');
    const contenedorDatos = document.getElementById('contenedorDatos');
    const errorDatos = document.getElementById('errorDatos');

    if (!aceptaDatos.checked) {
        errorDatos.style.display = 'block';
        contenedorDatos.style.border = '2px solid #dc2626';
        contenedorDatos.style.background = '#fef2f2';
        contenedorDatos.style.animation = 'temblor 0.4s ease';
        setTimeout(() => { contenedorDatos.style.animation = ''; }, 400);
        contenedorDatos.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    errorDatos.style.display = 'none';
    contenedorDatos.style.border = '1px solid #e5e7eb';
    contenedorDatos.style.background = '#f9fafb';

    // --- VALIDACIÓN DE FOTO ---
    if (!fotoCapturada) {
        document.getElementById('fotoError').style.display = 'block';
        mensaje.textContent = '❌ Debes tomar la foto de confirmación';
        mensaje.style.color = 'red';
        return;
    }

    // --- ARMAR DATOS ---
    const datos = new FormData();
    datos.append('nombre_completo', document.getElementById('nombre_completo').value.trim());
    datos.append('cedula', document.getElementById('cedula').value.trim());
    datos.append('fecha', document.getElementById('fecha').value);
    datos.append('cargo', document.getElementById('cargo').value.trim());
    datos.append('capacitacion_id', capacitacionId);

    const respuestas = [];
    document.querySelectorAll('#preguntasDinamicas [data-pregunta-id]').forEach(el => {
        respuestas.push({ pregunta_id: el.dataset.preguntaId, respuesta: el.value });
    });
    datos.append('respuestas', JSON.stringify(respuestas));
    datos.append('foto', fotoCapturada, 'foto.jpg');

    // --- MOSTRAR ESTADO "ENVIANDO..." ---
    mensaje.textContent = '⏳ Enviando registro...';
    mensaje.style.color = '#2563eb';
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    try {
        const respuesta = await fetch('/api/registros', {
            method: 'POST',
            body: datos
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mensaje.textContent = '✅ Registro guardado con éxito';
            mensaje.style.color = 'green';

            // Limpiar formulario
            formulario.reset();
            document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

            // Resetear la cámara
            fotoCapturada = null;
            preview.style.display = 'none';
            video.style.display = 'block';
            btnCapturar.style.display = 'inline-block';
            btnRepetir.style.display = 'none';

            // Scroll al mensaje de éxito
            mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } else if (respuesta.status === 409) {
            // Cédula duplicada
            mensaje.textContent = `⚠️ ${resultado.error}`;
            mensaje.style.color = '#dc2626';
            mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            mensaje.textContent = `❌ Error: ${resultado.error}`;
            mensaje.style.color = 'red';
        }
    } catch (error) {
        mensaje.textContent = '❌ No se pudo conectar con el servidor';
        mensaje.style.color = 'red';
        console.error(error);
    } finally {
        // Siempre reactivamos el botón
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar registro';
    }
});

document.getElementById('verPolitica').addEventListener('click', (e) => {
    e.preventDefault();
    alert("Tus datos serán utilizados únicamente para el registro de capacitaciones SST y no serán compartidos con terceros sin tu autorización.");
    // Aquí luego puedes poner un modal más elaborado con el texto legal completo
});

// --- VALIDACIÓN EN TIEMPO REAL (bloquea caracteres al escribir) ---

// Nombre: solo letras y espacios
document.getElementById('nombre_completo').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
});

// Cédula: solo números
document.getElementById('cedula').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});