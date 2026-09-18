// backend/controllers.js
const db = require('./config');

// Crear un nuevo registro de capacitación
const crearRegistro = async (req, res) => {
    try {
        const { nombre_completo, cedula, fecha, cargo, quedo_clara_la_informacion, observacion } = req.body;

        // Validación básica
        if (!nombre_completo || !cedula || !fecha || !cargo || !quedo_clara_la_informacion) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // La foto es obligatoria (viene de multer en req.file)
        if (!req.file) {
            return res.status(400).json({ error: 'La foto de confirmación es obligatoria' });
        }

        const foto = req.file.filename;

        const [result] = await db.query(
            `INSERT INTO registros_capacitacion 
            (nombre_completo, cedula, fecha, cargo, quedo_clara_la_informacion, observacion, foto) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombre_completo, cedula, fecha, cargo, quedo_clara_la_informacion, observacion || null, foto]
        );

        res.status(201).json({ mensaje: 'Registro guardado con éxito', id: result.insertId });
    } catch (error) {
        console.error('Error al crear registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Listar todos los registros (para que SST pueda consultarlos después)
const obtenerRegistros = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM registros_capacitacion ORDER BY creado_en DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { crearRegistro, obtenerRegistros };