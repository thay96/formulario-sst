// backend/rutas.js
const db = require('./config');
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


router.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false });
    }
});

module.exports = router;