// backend/rutas.js
const express = require('express');
const router = express.Router();
const { crearRegistro, obtenerRegistros } = require('./controllers');

// POST /api/registros -> guardar una nueva capacitación
router.post('/registros', crearRegistro);

// GET /api/registros -> listar todas las capacitaciones (para SST consultar después)
router.get('/registros', obtenerRegistros);

module.exports = router;