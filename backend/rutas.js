// backend/rutas.js
const db = require('./config');
const express = require('express');
const router = express.Router();

// Una sola importación, con TODAS las funciones incluyendo eliminarCapacitacion
const { 
    crearRegistro, 
    obtenerRegistros, 
    crearCapacitacion, 
    obtenerCapacitaciones, 
    obtenerPreguntasCapacitacion, 
    exportarExcel, 
    eliminarRegistro,
    eliminarCapacitacion  // <-- Agregada aquí
} = require('./controllers');

const upload = require('./multer');
const authHistorial = require('./middleware/authHistorial');

// --- REGISTROS ---
router.post('/registros', upload.single('foto'), crearRegistro);
router.get('/registros', authHistorial, obtenerRegistros);
router.get('/registros/excel', authHistorial, exportarExcel);
router.delete('/registros/:id', authHistorial, eliminarRegistro);

// --- CAPACITACIONES ---
router.post('/capacitaciones', authHistorial, crearCapacitacion);
router.get('/capacitaciones', authHistorial, obtenerCapacitaciones);
router.delete('/capacitaciones/:id', authHistorial, eliminarCapacitacion); // <-- NUEVA

// Obtener preguntas -> pública
router.get('/capacitaciones/:id/preguntas', obtenerPreguntasCapacitacion);

// Health check
router.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false });
    }
});

module.exports = router;