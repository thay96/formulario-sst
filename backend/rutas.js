// backend/rutas.js
const express = require('express');
const router = express.Router();
const { crearRegistro, obtenerRegistros, crearCapacitacion, obtenerCapacitaciones, obtenerPreguntasCapacitacion, exportarExcel } = require('./controllers');
const upload = require('./multer');// ajusta la ruta según donde guardaste el archivo
const authHistorial = require('./middleware/authHistorial'); // lo crearemos en el siguiente paso

// POST /api/registros -> guardar una nueva capacitación (ahora con foto)
router.post('/registros', upload.single('foto'), crearRegistro);

// GET /api/registros -> listar todas las capacitaciones (protegido, solo SST)
router.get('/registros', authHistorial, obtenerRegistros);
router.get('/registros/excel', authHistorial, exportarExcel);

// Crear capacitación y listar todas -> solo SST (protegido con la misma clave del historial)
router.post('/capacitaciones', authHistorial, crearCapacitacion);
router.get('/capacitaciones', authHistorial, obtenerCapacitaciones);


// Obtener preguntas de una capacitación -> pública, la necesita el formulario para cualquier empleado
router.get('/capacitaciones/:id/preguntas', obtenerPreguntasCapacitacion);

module.exports = router;