// frontend/formulario.js

document.addEventListener('DOMContentLoaded', () => {
    // Poner la fecha de hoy por defecto
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;
});

const formulario = document.getElementById('formularioSST');
const mensaje = document.getElementById('mensaje');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const btnCapturar = document.getElementById('btnCapturar');
const btnRepetir = document.getElementById('btnRepetir');
let fotoCapturada = null; // aquí queda el blob

async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' } // cámara frontal
  });
  video.srcObject = stream;
}

btnCapturar.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    fotoCapturada = blob;
    preview.src = URL.createObjectURL(blob);
    preview.style.display = 'block';
    video.style.display = 'none';
    btnCapturar.style.display = 'none';
    btnRepetir.style.display = 'inline-block';
    document.getElementById('fotoError').style.display = 'none';
  }, 'image/jpeg', 0.9);
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

    if (!fotoCapturada) {
        document.getElementById('fotoError').style.display = 'block';
        mensaje.textContent = '❌ Debes tomar la foto de confirmación';
        mensaje.style.color = 'red';
        return;
    }

    const datos = new FormData();
    datos.append('nombre_completo', document.getElementById('nombre_completo').value);
    datos.append('cedula', document.getElementById('cedula').value);
    datos.append('fecha', document.getElementById('fecha').value);
    datos.append('cargo', document.getElementById('cargo').value);
    datos.append('quedo_clara_la_informacion', document.getElementById('quedo_clara_la_informacion').value);
    datos.append('observacion', document.getElementById('observacion').value);
    datos.append('foto', fotoCapturada, 'foto.jpg');

    try {
        const respuesta = await fetch('/api/registros', {
            method: 'POST',
            body: datos
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mensaje.textContent = '✅ Registro guardado con éxito';
            mensaje.style.color = 'green';
            formulario.reset();
            document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

            fotoCapturada = null;
            preview.style.display = 'none';
            video.style.display = 'block';
            btnCapturar.style.display = 'inline-block';
            btnRepetir.style.display = 'none';
        } else {
            mensaje.textContent = `❌ Error: ${resultado.error}`;
            mensaje.style.color = 'red';
        }
    } catch (error) {
        mensaje.textContent = '❌ No se pudo conectar con el servidor';
        mensaje.style.color = 'red';
        console.error(error);
    }
});