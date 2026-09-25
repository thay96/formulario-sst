// backend/controllers.js
const db = require('./config');

// Crear un nuevo registro de capacitación
const crearRegistro = async (req, res) => {
    try {
        const { nombre_completo, cedula, fecha, cargo, capacitacion_id, respuestas } = req.body;

        if (!nombre_completo || !cedula || !fecha || !cargo || !capacitacion_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'La foto de confirmación es obligatoria' });
        }

        const foto = req.file.buffer.toString('base64');

        const [result] = await db.query(
            `INSERT INTO registros_capacitacion 
            (nombre_completo, cedula, fecha, cargo, foto, capacitacion_id) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre_completo, cedula, fecha, cargo, foto, capacitacion_id]
        );

        const registroId = result.insertId;

        const listaRespuestas = respuestas ? JSON.parse(respuestas) : [];
        for (const r of listaRespuestas) {
            await db.query(
                'INSERT INTO respuestas (registro_id, pregunta_id, respuesta) VALUES (?, ?, ?)',
                [registroId, r.pregunta_id, r.respuesta]
            );
        }

        res.status(201).json({ mensaje: 'Registro guardado con éxito', id: registroId });
    } catch (error) {
        console.error('Error al crear registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Listar todos los registros (para que SST pueda consultarlos después)
const obtenerRegistros = async (req, res) => {
    try {
        const { capacitacion_id } = req.query;
        let sql = 'SELECT * FROM registros_capacitacion';
        const params = [];

        if (capacitacion_id) {
            sql += ' WHERE capacitacion_id = ?';
            params.push(capacitacion_id);
        }
        sql += ' ORDER BY creado_en DESC';

        const [registros] = await db.query(sql, params);

        for (const r of registros) {
            const [respuestas] = await db.query(
                `SELECT p.texto_pregunta, resp.respuesta 
                 FROM respuestas resp 
                 JOIN preguntas p ON resp.pregunta_id = p.id 
                 WHERE resp.registro_id = ?`,
                [r.id]
            );
            r.respuestas = respuestas;
        }

        res.json(registros);
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Descargar Excel de una capacitación
const exportarExcel = async (req, res) => {
    try {
        const XLSX = require('xlsx');
        const { capacitacion_id } = req.query;

        let sql = 'SELECT * FROM registros_capacitacion';
        const params = [];
        if (capacitacion_id) {
            sql += ' WHERE capacitacion_id = ?';
            params.push(capacitacion_id);
        }
        const [registros] = await db.query(sql, params);

        const data = [];
        for (const r of registros) {
            const [respuestas] = await db.query(
                `SELECT p.texto_pregunta, resp.respuesta 
                 FROM respuestas resp 
                 JOIN preguntas p ON resp.pregunta_id = p.id 
                 WHERE resp.registro_id = ?`,
                [r.id]
            );

            const fila = {
                Nombre: r.nombre_completo,
                Cédula: r.cedula,
                Fecha: r.fecha,
                Cargo: r.cargo
            };
            respuestas.forEach(resp => {
                fila[resp.texto_pregunta] = resp.respuesta;
            });
            data.push(fila);
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Registros');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=registros.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear una capacitación nueva con sus preguntas
const crearCapacitacion = async (req, res) => {
    try {
        const { nombre, fecha, preguntas } = req.body;

        if (!nombre || !fecha) {
            return res.status(400).json({ error: 'Faltan nombre o fecha de la capacitación' });
        }

        const [result] = await db.query(
            'INSERT INTO capacitaciones (nombre, fecha) VALUES (?, ?)',
            [nombre, fecha]
        );
        const capacitacionId = result.insertId;

        if (Array.isArray(preguntas)) {
            for (let i = 0; i < preguntas.length; i++) {
                const p = preguntas[i];
                await db.query(
                    'INSERT INTO preguntas (capacitacion_id, texto_pregunta, tipo, opciones, orden) VALUES (?, ?, ?, ?, ?)',
                    [capacitacionId, p.texto_pregunta, p.tipo, p.opciones ? JSON.stringify(p.opciones) : null, i]
                );
            }
        }

        res.status(201).json({ mensaje: 'Capacitación creada con éxito', id: capacitacionId });
    } catch (error) {
        console.error('Error al crear capacitación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Listar todas las capacitaciones (para el panel y el historial)
const obtenerCapacitaciones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM capacitaciones ORDER BY creado_en DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener capacitaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener las preguntas de una capacitación específica (para pintar el formulario)
const obtenerPreguntasCapacitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM preguntas WHERE capacitacion_id = ? ORDER BY orden',
            [id]
        );
        const preguntas = rows.map(r => ({
            ...r,
            opciones: typeof r.opciones === 'string' ? JSON.parse(r.opciones) : r.opciones
        }));
        res.json(preguntas);
    } catch (error) {
        console.error('Error al obtener preguntas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { crearRegistro, obtenerRegistros, crearCapacitacion, obtenerCapacitaciones, obtenerPreguntasCapacitacion, exportarExcel };