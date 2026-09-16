# Sistema de Registro y Capacitaciones SST

Módulo web para la captura, evaluación y control de asistencia a capacitaciones de Seguridad y Salud en el Trabajo (SST).

## 🚀 Características
* **Formulario de Registro:** Captura de datos de colaboradores (nombre, cédula, fecha, cargo y observaciones).
* **Evaluación de Capacitación:** Preguntas para validar la claridad de la información brindada.
* **Historial de Registros:** Vista para consultar la información almacenada en base de datos.

## 🛠️ Tecnologías
* **Backend:** Node.js / Express
* **Base de Datos:** MySQL
* **Servidor Web:** Administrado vía PM2 y servido bajo proxy inverso en Caddy.

## 📂 Estructura
```text
formularios-sst/
├── backend/
│   └── app.js
├── public/ (o vistas HTML/JS)
└── package.json
