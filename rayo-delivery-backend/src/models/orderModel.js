const db = require("../config/db");

// Crear un nuevo pedido con transacción
exports.createOrder = (orderData, items) => {
    return new Promise(async (resolve, reject) => {
        // `db` es una conexión simple (createConnection), no un pool.
        // Usaremos `db` directamente para la transacción.
        const connection = db;

        try {
            await new Promise((res, rej) => connection.beginTransaction(err => err ? rej(err) : res()));

            // 1. Insertar Cabecera Pedido
            const sqlOrder = `
                INSERT INTO pedidos (
                    usuario_id, subtotal, envio, total, direccion, metodo_pago,
                    latitude, longitude, codigo_promocional, descuento, estado, estado_pago, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registrado', 'pendiente', NOW())
            `;

            const resultOrder = await new Promise((res, rej) => {
                connection.query(sqlOrder, [
                    orderData.usuario_id,
                    orderData.subtotal,
                    orderData.envio,
                    orderData.total,
                    orderData.direccion,
                    orderData.metodo_pago,
                    orderData.latitude,
                    orderData.longitude,
                    orderData.codigo_promocional || null,
                    orderData.descuento || 0
                ], (err, result) => {
                    if (err) rej(err);
                    else res(result);
                });
            });

            const pedidoId = resultOrder.insertId;

            // 2. Insertar Detalles
            const sqlDetail = `
                INSERT INTO detalle_pedidos (pedido_id, producto_id, nombre, cantidad, precio_unitario, total)
                VALUES ?
            `;

            const detailValues = items.map(item => [
                pedidoId,
                item.product.id,
                item.product.nombre,
                item.quantity,
                item.product.precio,
                item.product.precio * item.quantity
            ]);

            await new Promise((res, rej) => {
                connection.query(sqlDetail, [detailValues], (err, result) => {
                    if (err) rej(err);
                    else res(result);
                });
            });

            await new Promise((res, rej) => connection.commit(err => err ? rej(err) : res()));
            resolve(pedidoId);
        } catch (err) {
            try {
                connection.rollback(() => { /* rollback complete */ });
            } catch (e) { /* ignore rollback error */ }
            reject(err);
        }
    });
};

// Obtener pedido por ID (con detalles)
exports.getOrderById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, u.nombre as usuario_nombre, u.correo as usuario_correo, u.telefono as usuario_telefono
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = ?
        `;
        db.query(sql, [id], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return resolve(null);

            const pedido = results[0];

            // Obtener detalles
            const sqlDetails = `SELECT * FROM detalle_pedidos WHERE pedido_id = ?`;
            db.query(sqlDetails, [id], (err, details) => {
                if (err) return reject(err);
                pedido.detalles = details;
                resolve(pedido);
            });
        });
    });
};

// Obtener pedidos por Usuario
exports.getOrdersByUser = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY created_at DESC`;
        db.query(sql, [userId], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Listar todos (Admin)
exports.getAllOrders = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                p.*, 
                u.nombre as usuario_nombre,
                m.nombre as motorizado_nombre
            FROM pedidos p 
            JOIN usuarios u ON p.usuario_id = u.id 
            LEFT JOIN usuarios m ON p.motorizado_id = m.id
            ORDER BY p.created_at DESC
        `;
        db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Obtener pedidos disponibles para motorizados (no asignados)
exports.getAvailableOrders = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, u.nombre as usuario_nombre, u.direccion as usuario_direccion
            FROM pedidos p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.motorizado_id IS NULL AND p.estado IN ('registrado', 'pagado')
            ORDER BY created_at ASC
        `;
        db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Obtener pedidos asignados a un motorizado
exports.getOrdersByMotorizado = (motorizadoId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, u.nombre as usuario_nombre, u.direccion as usuario_direccion, u.telefono as usuario_telefono
            FROM pedidos p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.motorizado_id = ?
            ORDER BY created_at DESC
        `;
        db.query(sql, [motorizadoId], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Actualizar estado del pedido (para motorizado/admin)
exports.updateStatus = (id, estado, motorizadoId = null) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE pedidos SET estado = ? WHERE id = ?`;
        let params = [estado, id];

        if (motorizadoId) {
            sql = `UPDATE pedidos SET estado = ?, motorizado_id = ? WHERE id = ?`;
            params = [estado, motorizadoId, id];
        }

        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// RF-11: Reasignar pedido a otro motorizado (Solo Admin)
exports.reassignMotorizado = (pedidoId, nuevoMotorizadoId) => {
    return new Promise((resolve, reject) => {
        // Primero verificar que el pedido existe
        const sqlCheckPedido = `SELECT id, motorizado_id FROM pedidos WHERE id = ?`;

        db.query(sqlCheckPedido, [pedidoId], (err, pedidos) => {
            if (err) return reject(err);
            if (pedidos.length === 0) {
                return reject(new Error('Pedido no encontrado'));
            }

            const pedido = pedidos[0];
            const motorizadoAnterior = pedido.motorizado_id;

            // Verificar que el nuevo motorizado existe y es motorizado
            const sqlCheckMotorizado = `
                SELECT id, nombre, disponible 
                FROM usuarios 
                WHERE id = ? AND rol = 'motorizado'
            `;

            db.query(sqlCheckMotorizado, [nuevoMotorizadoId], (err, motorizados) => {
                if (err) return reject(err);
                if (motorizados.length === 0) {
                    return reject(new Error('Motorizado no encontrado o inválido'));
                }

                const motorizado = motorizados[0];

                // Actualizar la asignación del pedido
                const sqlUpdate = `UPDATE pedidos SET motorizado_id = ? WHERE id = ?`;

                db.query(sqlUpdate, [nuevoMotorizadoId, pedidoId], (err, result) => {
                    if (err) return reject(err);

                    resolve({
                        success: true,
                        pedidoId,
                        motorizadoAnterior,
                        nuevoMotorizado: {
                            id: motorizado.id,
                            nombre: motorizado.nombre
                        }
                    });
                });
            });
        });
    });
};
