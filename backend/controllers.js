// backend/controllers.js
const db = require('./config');

// Crear un nuevo registro de capacitación
const crearRegistro = async (req, res) => {
    const { nombre_completo, cedula, fecha, cargo, capacitacion_id, respuestas } = req.body;

    try {
        // --- VALIDACIÓN DE CAMPOS OBLIGATORIOS ---
        if (!nombre_completo || !cedula || !fecha || !cargo || !capacitacion_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // --- VALIDACIÓN DE DUPLICADO ---
        const [existe] = await db.query(
            'SELECT id FROM registros_capacitacion WHERE cedula = ? AND capacitacion_id = ?',
            [cedula, capacitacion_id]
        );

        if (existe.length > 0) {
            return res.status(409).json({
                error: 'Esta cédula ya está registrada en esta capacitación. No puedes registrarte dos veces.'
            });
        }

        // --- VALIDACIÓN DE FOTO ---
        if (!req.file) {
            return res.status(400).json({ error: 'La foto de confirmación es obligatoria' });
        }

        const foto = req.file.buffer.toString('base64');

        // --- INSERTAR REGISTRO ---
        const [result] = await db.query(
            `INSERT INTO registros_capacitacion 
            (nombre_completo, cedula, fecha, cargo, foto, capacitacion_id) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre_completo, cedula, fecha, cargo, foto, capacitacion_id]
        );

        const registroId = result.insertId;

        // --- INSERTAR RESPUESTAS ---
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
        const ExcelJS = require('exceljs');
        const { capacitacion_id } = req.query;

        let sql = 'SELECT * FROM registros_capacitacion';
        const params = [];
        if (capacitacion_id) {
            sql += ' WHERE capacitacion_id = ?';
            params.push(capacitacion_id);
        }
        const [registros] = await db.query(sql, params);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Registros');

        // Primero averiguamos todas las preguntas posibles para armar las columnas dinámicas
        const columnasPreguntas = new Set();
        const registrosConRespuestas = [];

        for (const r of registros) {
            const [respuestas] = await db.query(
                `SELECT p.texto_pregunta, resp.respuesta 
                 FROM respuestas resp 
                 JOIN preguntas p ON resp.pregunta_id = p.id 
                 WHERE resp.registro_id = ?`,
                [r.id]
            );
            respuestas.forEach(resp => columnasPreguntas.add(resp.texto_pregunta));
            registrosConRespuestas.push({ ...r, respuestas });
        }

        const listaPreguntas = Array.from(columnasPreguntas);

        // Definir columnas: fijas + preguntas dinámicas + foto al final
        sheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 25 },
            { header: 'Cédula', key: 'cedula', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 14 },
            { header: 'Cargo', key: 'cargo', width: 18 },
            ...listaPreguntas.map(p => ({ header: p, key: p, width: 20 })),
            { header: 'Foto', key: 'foto', width: 16 }
        ];

        let filaActual = 2; // la fila 1 es el encabezado

        for (const r of registrosConRespuestas) {
            const fila = {
                nombre: r.nombre_completo,
                cedula: r.cedula,
                fecha: r.fecha,
                cargo: r.cargo
            };
            r.respuestas.forEach(resp => {
                fila[resp.texto_pregunta] = resp.respuesta;
            });

            sheet.addRow(fila);
            sheet.getRow(filaActual).height = 70; // más alto para que quepa la foto

            if (r.foto) {
                const imageId = workbook.addImage({
                    base64: `data:image/jpeg;base64,${r.foto}`,
                    extension: 'jpeg'
                });

                const colIndex = sheet.columns.length - 1; // última columna (Foto)
                sheet.addImage(imageId, {
                    tl: { col: colIndex, row: filaActual - 1 },
                    ext: { width: 80, height: 80 }
                });
            }

            filaActual++;
        }

        const buffer = await workbook.xlsx.writeBuffer();

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

// Eliminar un registro específico (y sus respuestas asociadas)
const eliminarRegistro = async (req, res) => {
    try {
        const { id } = req.params;

        // Primero borramos las respuestas de ese registro (por la relación entre tablas)
        await db.query('DELETE FROM respuestas WHERE registro_id = ?', [id]);

        // Luego el registro en sí
        const [result] = await db.query('DELETE FROM registros_capacitacion WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        res.json({ mensaje: 'Registro eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// controllers.js
async function eliminarCapacitacion(req, res) {
    const { id } = req.params;
    try {
        // 1. Verificar si tiene registros asociados
        const [registros] = await db.query(
            'SELECT COUNT(*) as total FROM registros_capacitacion WHERE capacitacion_id = ?',
            [id]
        );

        if (registros[0].total > 0) {
            return res.status(409).json({
                error: `No se puede eliminar esta capacitación porque tiene ${registros[0].total} registro(s) de empleados asociados.`
            });
        }

        // 2. Si no tiene registros, eliminamos preguntas y capacitación
        await db.query('DELETE FROM preguntas WHERE capacitacion_id = ?', [id]);
        const [resultado] = await db.query('DELETE FROM capacitaciones WHERE id = ?', [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Capacitación no encontrada' });
        }

        res.json({ ok: true, mensaje: 'Capacitación eliminada' });
    } catch (error) {
        console.error('Error al eliminar capacitación:', error);
        res.status(500).json({ error: 'Error al eliminar la capacitación' });
    }
}

module.exports = {
    crearRegistro,
    obtenerRegistros,
    crearCapacitacion,
    obtenerCapacitaciones,
    obtenerPreguntasCapacitacion,
    exportarExcel,
    eliminarRegistro,
    eliminarCapacitacion // <-- Agregar esta
};


