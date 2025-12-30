
const db = require('../config/db');

exports.createPedido = (pedido) => {
  return new Promise((resolve, reject) => {
    // Added motorizado_id
    const sql = `
      INSERT INTO pedidos (usuario_id, subtotal, envio, total, direccion, metodo_pago, estado, motorizado_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(sql, [
      pedido.usuario_id,
      pedido.subtotal,
      pedido.envio,
      pedido.total,
      pedido.direccion,
      pedido.metodo_pago,
      pedido.estado || 'registrado',
      pedido.motorizado_id || null
    ], (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
};

exports.createDetalles = (pedidoId, detalles) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(detalles) || detalles.length === 0) return resolve();

    const values = detalles.map(d => [
      pedidoId,
      d.producto_id || null,
      d.nombre || null,
      d.cantidad,
      d.precio_unitario,
      (d.cantidad * d.precio_unitario)
    ]);

    const sql = `
      INSERT INTO detalle_pedidos (pedido_id, producto_id, nombre, cantidad, precio_unitario, total)
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

exports.getPedidosByUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY created_at DESC`;
    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getPedidoById = (pedidoId) => {
  return new Promise((resolve, reject) => {
    // Join with locales (optional) or just get pedido
    const sqlPedido = `SELECT p.*, u.nombre as cliente, l.nombre as restaurante, l.direccion as direccion_restaurante
                       FROM pedidos p
                       LEFT JOIN usuarios u ON p.usuario_id = u.id
                       -- Assuming relation with locales involves checking match or if local_id stored. 
                       -- Current schema doesn't store local_id in PEDIDOS, but products have local_id.
                       -- We can infer restaurante from the first detail's product -> local.
                       -- For simplicity returning simple fields or mocking for now if join too complex.
                       LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id LIMIT 1
                       LEFT JOIN productos prod ON dp.producto_id = prod.id
                       LEFT JOIN locales l ON prod.local_id = l.id
                       WHERE p.id = ?`;

    // Note: The above Join is heuristic since a pedido might be mixed (unlikely) or schema should have local_id in pedido.
    // Given the constraints I will stick to basic selection and maybe separate query for restaurant name if needed.
    // Reverting to simple select to avoid SQL errors if schema implies multiple locales per order not allowed but not enforced.

    // Better simple query:
    const simpleSql = `SELECT * FROM pedidos WHERE id = ?`;

    db.query(simpleSql, [pedidoId], (err, pedidos) => {
      if (err) return reject(err);
      if (!pedidos || pedidos.length === 0) return resolve(null);

      const pedido = pedidos[0];

      const sqlDetalles = `SELECT * FROM detalle_pedidos WHERE pedido_id = ?`;
      db.query(sqlDetalles, [pedidoId], (err2, detalles) => {
        if (err2) return reject(err2);
        pedido.detalles = detalles || [];
        resolve(pedido);
      });
    });
  });
};

// --- New Methods ---

exports.getPedidosByMotorizado = (motorizadoId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM pedidos WHERE motorizado_id = ? ORDER BY created_at DESC`;
    db.query(sql, [motorizadoId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.updateEstado = (pedidoId, estado) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE pedidos SET estado = ? WHERE id = ?`;
    db.query(sql, [estado, pedidoId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

exports.assignMotorizado = (pedidoId, motorizadoId) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE pedidos SET motorizado_id = ?, estado = 'asignado' WHERE id = ?`;
    db.query(sql, [motorizadoId, pedidoId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
