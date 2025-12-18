const db = require('../config/db');

exports.createPedido = (pedido) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO pedidos (usuario_id, subtotal, envio, total, direccion, metodo_pago, estado, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(sql, [
      pedido.usuario_id,
      pedido.subtotal,
      pedido.envio,
      pedido.total,
      pedido.direccion,
      pedido.metodo_pago,
      pedido.estado || 'registrado'
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
    const sqlPedido = `SELECT * FROM pedidos WHERE id = ?`;
    db.query(sqlPedido, [pedidoId], (err, pedidos) => {
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
