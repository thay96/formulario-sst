// frontend/formulario.js

document.addEventListener('DOMContentLoaded', () => {
    // Poner la fecha de hoy por defecto
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;
});

const formulario = document.getElementById('formularioSST');
const mensaje = document.getElementById('mensaje');

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
        nombre_completo: document.getElementById('nombre_completo').value,
        cedula: document.getElementById('cedula').value,
        fecha: document.getElementById('fecha').value,
        cargo: document.getElementById('cargo').value,
        quedo_clara_la_informacion: document.getElementById('quedo_clara_la_informacion').value,
        observacion: document.getElementById('observacion').value
    };

    try {
        const respuesta = await fetch('/api/registros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mensaje.textContent = '✅ Registro guardado con éxito';
            mensaje.style.color = 'green';
            formulario.reset();
            document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
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