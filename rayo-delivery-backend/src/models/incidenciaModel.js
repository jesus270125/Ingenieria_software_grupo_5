const db = require('../config/db');

const IncidenciaModel = {
  // Crear una nueva incidencia
  create: (incidenciaData) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO incidencias (pedido_id, usuario_id, tipo_incidencia, descripcion, foto_url)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        query,
        [
          incidenciaData.pedido_id,
          incidenciaData.usuario_id,
          incidenciaData.tipo_incidencia,
          incidenciaData.descripcion,
          incidenciaData.foto_url || null
        ],
        (err, results) => {
          if (err) return reject(err);
          resolve(results.insertId);
        }
      );
    });
  },

  // Obtener todas las incidencias (para admin)
  getAll: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          i.*,
          p.id as numero_pedido,
          u.nombre as usuario_nombre,
          u.correo as usuario_correo,
          m.nombre as motorizado_nombre
        FROM incidencias i
        LEFT JOIN pedidos p ON i.pedido_id = p.id
        LEFT JOIN usuarios u ON i.usuario_id = u.id
        LEFT JOIN usuarios m ON p.motorizado_id = m.id
        ORDER BY i.fecha_creacion DESC
      `;
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Obtener incidencias por usuario (cliente o motorizado)
  getByUsuario: (usuarioId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          i.*,
          p.id as numero_pedido,
          m.nombre as motorizado_nombre
        FROM incidencias i
        LEFT JOIN pedidos p ON i.pedido_id = p.id
        LEFT JOIN usuarios m ON p.motorizado_id = m.id
        WHERE i.usuario_id = ?
        ORDER BY i.fecha_creacion DESC
      `;
      db.query(query, [usuarioId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Obtener incidencias por pedido
  getByPedido: (pedidoId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          i.*,
          u.nombre as usuario_nombre
        FROM incidencias i
        LEFT JOIN usuarios u ON i.usuario_id = u.id
        WHERE i.pedido_id = ?
        ORDER BY i.fecha_creacion DESC
      `;
      db.query(query, [pedidoId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Obtener incidencia por ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          i.*,
          p.id as numero_pedido,
          u.nombre as usuario_nombre,
          u.correo as usuario_correo
        FROM incidencias i
        LEFT JOIN pedidos p ON i.pedido_id = p.id
        LEFT JOIN usuarios u ON i.usuario_id = u.id
        WHERE i.id = ?
      `;
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  },

  // Actualizar respuesta del admin y cambiar estado
  updateRespuesta: (id, respuesta, estado) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE incidencias 
        SET respuesta_admin = ?, estado = ?
        WHERE id = ?
      `;
      db.query(query, [respuesta, estado, id], (err, results) => {
        if (err) return reject(err);
        resolve(results.affectedRows > 0);
      });
    });
  },

  // Verificar si ya existe una incidencia para un pedido del mismo usuario
  existeIncidencia: (pedidoId, usuarioId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM incidencias 
        WHERE pedido_id = ? AND usuario_id = ?
      `;
      db.query(query, [pedidoId, usuarioId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count > 0);
      });
    });
  },

  // Obtener estadísticas de incidencias (para dashboard admin)
  getEstadisticas: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN estado = 'en_revision' THEN 1 ELSE 0 END) as en_revision,
          SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
          SUM(CASE WHEN tipo_incidencia = 'demora' THEN 1 ELSE 0 END) as demoras,
          SUM(CASE WHEN tipo_incidencia = 'mal_estado' THEN 1 ELSE 0 END) as mal_estado,
          SUM(CASE WHEN tipo_incidencia = 'perdida' THEN 1 ELSE 0 END) as perdidas,
          SUM(CASE WHEN tipo_incidencia = 'otro' THEN 1 ELSE 0 END) as otros
        FROM incidencias
      `;
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }
};

module.exports = IncidenciaModel;
