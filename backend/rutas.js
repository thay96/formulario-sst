// backend/rutas.js
const express = require('express');
const router = express.Router();
const { crearRegistro, obtenerRegistros } = require('./controllers');
const upload = require('./multer');// ajusta la ruta según donde guardaste el archivo
const authHistorial = require('./middleware/authHistorial'); // lo crearemos en el siguiente paso

// POST /api/registros -> guardar una nueva capacitación (ahora con foto)
router.post('/registros', upload.single('foto'), crearRegistro);

// GET /api/registros -> listar todas las capacitaciones (protegido, solo SST)
router.get('/registros', authHistorial, obtenerRegistros);

module.exports = router;