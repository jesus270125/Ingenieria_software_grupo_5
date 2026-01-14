
const db = require('../config/db');

exports.createPedido = (pedido) => {
  return new Promise((resolve, reject) => {
    // Added motorizado_id
    const sql = `
      INSERT INTO pedidos (usuario_id, subtotal, envio, total, direccion, metodo_pago, estado, motorizado_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const estadoInicial = pedido.estado || 'registrado';

    db.query(sql, [
      pedido.usuario_id,
      pedido.subtotal,
      pedido.envio,
      pedido.total,
      pedido.direccion,
      pedido.metodo_pago,
      estadoInicial,
      pedido.motorizado_id || null
    ], (err, result) => {
      if (err) return reject(err);
      
      const pedidoId = result.insertId;
      
      // RF-14: Registrar estado inicial en el historial
      const sqlHistorial = `
        INSERT INTO historial_estados_pedido 
        (pedido_id, estado_anterior, estado_nuevo, observaciones) 
        VALUES (?, NULL, ?, ?)
      `;
      
      const observacion = pedido.motorizado_id 
        ? `Pedido creado y asignado automáticamente a motorizado ${pedido.motorizado_id}`
        : 'Pedido creado';
      
      db.query(sqlHistorial, [pedidoId, estadoInicial, observacion], (err) => {
        if (err) console.error('Error registrando estado inicial en historial:', err);
        // No rechazamos si falla el historial, solo logueamos
        resolve(pedidoId);
      });
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
    const sql = `
      SELECT DISTINCT
        p.*,
        l.nombre as nombre_local
      FROM pedidos p
      LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
      LEFT JOIN productos pr ON dp.producto_id = pr.id
      LEFT JOIN locales l ON pr.local_id = l.id
      WHERE p.usuario_id = ?
      ORDER BY p.created_at DESC
    `;
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

        // Normalizar items para compatibilidad con frontend
        pedido.items = (detalles || []).map(d => ({
          producto: {
            id: d.producto_id,
            nombre: d.nombre,
            precio: d.precio_unitario
          },
          nombre: d.nombre,
          cantidad: d.cantidad,
          quantity: d.cantidad,
          precio: d.precio_unitario,
          precio_unitario: d.precio_unitario,
          total: d.total
        }));


        // Asegurar que cada detalle tenga los campos que el frontend espera y producto sea string
        (detalles || []).forEach(d => {
          d.producto = d.nombre || 'Producto';
          d.precio = d.precio_unitario;
        });

        // Mapear campos de columna snake_case a camelCase que usa el frontend
        pedido.metodoPago = pedido.metodo_pago || pedido.metodoPago;
        pedido.createdAt = pedido.created_at || pedido.createdAt;

        // Mapear coordenadas a nombres esperados por frontend
        pedido.lat_cliente = pedido.latitude || pedido.lat_cliente || null;
        pedido.lng_cliente = pedido.longitude || pedido.lng_cliente || null;

        // Agregar información adicional: cliente y restaurante (si es posible)
        const sqlUser = `SELECT nombre, direccion, telefono FROM usuarios WHERE id = ?`;
        db.query(sqlUser, [pedido.usuario_id], (err3, users) => {
          if (err3) return reject(err3);
          if (users && users[0]) {
            pedido.cliente = users[0].nombre || 'Cliente';
            pedido.direccion_cliente = pedido.direccion || users[0].direccion || 'Sin dirección';
            pedido.telefono_cliente = users[0].telefono || null;
          } else {
            pedido.cliente = pedido.cliente || 'Cliente';
            pedido.direccion_cliente = pedido.direccion || 'Sin dirección';
            pedido.telefono_cliente = null;
          }

          // Intentar resolver restaurante a partir del primer producto
          if (detalles && detalles.length > 0 && detalles[0].producto_id) {
            const sqlLocal = `SELECT l.nombre, l.direccion FROM productos p LEFT JOIN locales l ON p.local_id = l.id WHERE p.id = ? LIMIT 1`;
            db.query(sqlLocal, [detalles[0].producto_id], (err4, locals) => {
              // No cortar ejecución por falta de datos de local
              if (!err4 && locals && locals[0]) {
                pedido.restaurante = locals[0].nombre || 'Restaurante';
                pedido.direccion_restaurante = locals[0].direccion || 'Sin dirección';
              } else {
                pedido.restaurante = pedido.restaurante || 'Restaurante';
                pedido.direccion_restaurante = pedido.direccion_restaurante || 'Sin dirección';
              }

              resolve(pedido);
            });
          } else {
            // No hay detalles con product_id, devolvemos lo que tengamos
            pedido.restaurante = pedido.restaurante || 'Restaurante';
            pedido.direccion_restaurante = pedido.direccion_restaurante || 'Sin dirección';
            resolve(pedido);
          }
        });
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
      // Forzar que estado nunca sea nulo o vacío y siempre string
      const pedidos = (results || []).map(p => ({
        ...p,
        estado: typeof p.estado === 'string' && p.estado.trim() ? p.estado : (p.estado ? String(p.estado) : 'Sin estado')
      }));
      resolve(pedidos);
    });
  });
};

// Función auxiliar para generar código de 6 dígitos
const generarCodigoEntrega = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.updateEstado = (pedidoId, estado, observaciones = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Obtener el estado anterior
      const sqlGet = `SELECT estado FROM pedidos WHERE id = ?`;
      db.query(sqlGet, [pedidoId], (err, results) => {
        if (err) return reject(err);
        
        const estadoAnterior = results.length > 0 ? results[0].estado : null;
        
        // RF-15: Generar código de entrega cuando vaya en camino al cliente
        let codigoEntrega = null;
        if (estado === 'en_camino_cliente') {
          codigoEntrega = generarCodigoEntrega();
        }
        
        // 2. Actualizar el estado del pedido (y código si aplica)
        let sqlUpdate, params;
        if (codigoEntrega) {
          sqlUpdate = `UPDATE pedidos SET estado = ?, codigo_entrega = ? WHERE id = ?`;
          params = [estado, codigoEntrega, pedidoId];
        } else {
          sqlUpdate = `UPDATE pedidos SET estado = ? WHERE id = ?`;
          params = [estado, pedidoId];
        }
        
        db.query(sqlUpdate, params, (err, result) => {
          if (err) return reject(err);
          
          // 3. Registrar en historial de estados (RF-14)
          const sqlHistorial = `
            INSERT INTO historial_estados_pedido 
            (pedido_id, estado_anterior, estado_nuevo, observaciones) 
            VALUES (?, ?, ?, ?)
          `;
          const obs = codigoEntrega 
            ? `${observaciones || ''} - Código de entrega generado`.trim() 
            : observaciones;
          
          db.query(sqlHistorial, [pedidoId, estadoAnterior, estado, obs], (err) => {
            if (err) console.error('Error registrando historial de estado:', err);
            // No rechazamos la promesa si falla el historial, solo logueamos
            resolve({ ...result, codigo_entrega: codigoEntrega });
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

exports.updateEstadoPago = (pedidoId, estadoPago) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE pedidos SET estado_pago = ? WHERE id = ?`;
    db.query(sql, [estadoPago, pedidoId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

exports.assignMotorizado = (pedidoId, motorizadoId) => {
  return new Promise((resolve, reject) => {
    // 1. Obtener el estado anterior
    const sqlGet = `SELECT estado FROM pedidos WHERE id = ?`;
    db.query(sqlGet, [pedidoId], (err, results) => {
      if (err) return reject(err);
      
      const estadoAnterior = results.length > 0 ? results[0].estado : null;
      
      // 2. Actualizar motorizado y estado
      const sql = `UPDATE pedidos SET motorizado_id = ?, estado = 'asignado' WHERE id = ?`;
      db.query(sql, [motorizadoId, pedidoId], (err, result) => {
        if (err) return reject(err);
        
        // 3. Registrar en historial de estados (RF-14)
        const sqlHistorial = `
          INSERT INTO historial_estados_pedido 
          (pedido_id, estado_anterior, estado_nuevo, observaciones) 
          VALUES (?, ?, ?, ?)
        `;
        db.query(sqlHistorial, [pedidoId, estadoAnterior, 'asignado', `Asignado a motorizado ${motorizadoId}`], (err) => {
          if (err) console.error('Error registrando historial de asignación:', err);
          resolve(result);
        });
      });
    });
  });
};

// RF-14: Obtener historial de estados de un pedido
exports.getHistorialEstados = (pedidoId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id,
        pedido_id,
        estado_anterior,
        estado_nuevo,
        observaciones,
        fecha_cambio
      FROM historial_estados_pedido
      WHERE pedido_id = ?
      ORDER BY fecha_cambio ASC
    `;
    db.query(sql, [pedidoId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// RF-15: Validar código de entrega
exports.validarCodigoEntrega = (pedidoId, codigo) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, codigo_entrega, estado 
      FROM pedidos 
      WHERE id = ? AND codigo_entrega = ?
    `;
    db.query(sql, [pedidoId, codigo], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) {
        return resolve({ valido: false, mensaje: 'Código incorrecto' });
      }
      
      const pedido = results[0];
      if (pedido.estado === 'entregado') {
        return resolve({ valido: false, mensaje: 'Este pedido ya fue entregado' });
      }
      
      resolve({ valido: true, mensaje: 'Código válido' });
    });
  });
};

// RF-15: Confirmar entrega con código
exports.confirmarEntrega = (pedidoId, codigo) => {
  return new Promise((resolve, reject) => {
    // 1. Validar el código primero
    exports.validarCodigoEntrega(pedidoId, codigo)
      .then(validacion => {
        if (!validacion.valido) {
          return reject(new Error(validacion.mensaje));
        }
        
        // 2. Actualizar a entregado con fecha de entrega
        const sqlUpdate = `
          UPDATE pedidos 
          SET estado = 'entregado', fecha_entrega = NOW() 
          WHERE id = ? AND codigo_entrega = ?
        `;
        
        db.query(sqlUpdate, [pedidoId, codigo], (err, result) => {
          if (err) return reject(err);
          
          // 3. Registrar en historial
          const sqlHistorial = `
            INSERT INTO historial_estados_pedido 
            (pedido_id, estado_anterior, estado_nuevo, observaciones) 
            VALUES (?, 'en_camino_cliente', 'entregado', 'Entrega confirmada con código')
          `;
          
          db.query(sqlHistorial, [pedidoId], (err) => {
            if (err) console.error('Error registrando historial de entrega:', err);
            resolve({ success: true, mensaje: 'Entrega confirmada exitosamente' });
          });
        });
      })
      .catch(err => reject(err));
  });
};

// RF-14: Obtener historial de estados de un pedido
exports.getHistorialEstados = (pedidoId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id,
        pedido_id,
        estado_anterior,
        estado_nuevo,
        observaciones,
        fecha_cambio
      FROM historial_estados_pedido
      WHERE pedido_id = ?
      ORDER BY fecha_cambio ASC
    `;
    db.query(sql, [pedidoId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
