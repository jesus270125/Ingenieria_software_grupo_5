const db = require('../config/db');

// RF-22: Crear evaluación
exports.create = (data) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO evaluaciones (pedido_id, cliente_id, motorizado_id, calificacion, comentario)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            data.pedido_id,
            data.cliente_id,
            data.motorizado_id,
            data.calificacion,
            data.comentario || null
        ], (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
};

// RF-22: Verificar si un pedido ya fue evaluado
exports.existeEvaluacion = (pedidoId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id FROM evaluaciones WHERE pedido_id = ?';
        db.query(sql, [pedidoId], (err, results) => {
            if (err) return reject(err);
            resolve(results.length > 0);
        });
    });
};

// RF-22: Obtener evaluaciones de un motorizado
exports.getByMotorizado = (motorizadoId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                e.*,
                u.nombre as cliente_nombre,
                p.id as pedido_numero
            FROM evaluaciones e
            INNER JOIN usuarios u ON e.cliente_id = u.id
            INNER JOIN pedidos p ON e.pedido_id = p.id
            WHERE e.motorizado_id = ?
            ORDER BY e.fecha_evaluacion DESC
        `;
        db.query(sql, [motorizadoId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// RF-22: Obtener todas las evaluaciones (para administrador)
exports.getAll = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                e.*,
                c.nombre as cliente_nombre,
                m.nombre as motorizado_nombre,
                m.placa as motorizado_placa,
                p.id as pedido_numero
            FROM evaluaciones e
            INNER JOIN usuarios c ON e.cliente_id = c.id
            INNER JOIN usuarios m ON e.motorizado_id = m.id
            INNER JOIN pedidos p ON e.pedido_id = p.id
            ORDER BY e.fecha_evaluacion DESC
        `;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// RF-22: Obtener promedio de calificación de un motorizado
exports.getPromedioMotorizado = (motorizadoId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                AVG(calificacion) as promedio,
                COUNT(*) as total_evaluaciones
            FROM evaluaciones
            WHERE motorizado_id = ?
        `;
        db.query(sql, [motorizadoId], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

// RF-22: Actualizar respuesta del administrador
exports.updateRespuestaAdmin = (id, respuesta, accion) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE evaluaciones 
            SET respuesta_admin = ?, accion_tomada = ?, fecha_respuesta = NOW()
            WHERE id = ?
        `;
        db.query(sql, [respuesta, accion, id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// RF-22: Obtener evaluación por ID
exports.getById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                e.*,
                c.nombre as cliente_nombre,
                m.nombre as motorizado_nombre,
                p.id as pedido_numero
            FROM evaluaciones e
            INNER JOIN usuarios c ON e.cliente_id = c.id
            INNER JOIN usuarios m ON e.motorizado_id = m.id
            INNER JOIN pedidos p ON e.pedido_id = p.id
            WHERE e.id = ?
        `;
        db.query(sql, [id], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

// RF-22: Obtener evaluaciones de un cliente
exports.getByCliente = (clienteId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                e.*,
                m.nombre as motorizado_nombre,
                m.placa as motorizado_placa,
                p.id as pedido_numero
            FROM evaluaciones e
            INNER JOIN usuarios m ON e.motorizado_id = m.id
            INNER JOIN pedidos p ON e.pedido_id = p.id
            WHERE e.cliente_id = ?
            ORDER BY e.fecha_evaluacion DESC
        `;
        db.query(sql, [clienteId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};
