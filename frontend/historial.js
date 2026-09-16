// frontend/historial.js

document.addEventListener('DOMContentLoaded', async () => {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    const mensaje = document.getElementById('mensajeHistorial');

    try {
        const respuesta = await fetch('/api/registros');
        const registros = await respuesta.json();

        if (registros.length === 0) {
            mensaje.textContent = 'Aún no hay registros guardados.';
            return;
        }

        registros.forEach((registro) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${registro.nombre_completo}</td>
                <td>${registro.cedula}</td>
                <td>${registro.fecha.split('T')[0]}</td>
                <td>${registro.cargo}</td>
                <td>${registro.quedo_clara_la_informacion}</td>
                <td>${registro.observacion || '-'}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    } catch (error) {
        mensaje.textContent = '❌ No se pudo cargar el historial';
        console.error(error);
    }
});