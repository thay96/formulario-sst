// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rutas = require('./rutas');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir el frontend (HTML, CSS, JS) como archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas de la API
app.use('/api', rutas);

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});