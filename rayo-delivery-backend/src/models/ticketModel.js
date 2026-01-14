const db = require('../config/db');

const TicketModel = {
  // Crear un nuevo ticket
  create: (ticketData) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO tickets_soporte (usuario_id, asunto, categoria, descripcion, prioridad)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        query,
        [
          ticketData.usuario_id,
          ticketData.asunto,
          ticketData.categoria,
          ticketData.descripcion,
          ticketData.prioridad || 'media'
        ],
        (err, results) => {
          if (err) return reject(err);
          resolve(results.insertId);
        }
      );
    });
  },

  // Obtener todos los tickets (admin)
  getAll: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          t.*,
          u.nombre as usuario_nombre,
          u.correo as usuario_correo,
          u.telefono as usuario_telefono,
          a.nombre as asignado_nombre
        FROM tickets_soporte t
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        LEFT JOIN usuarios a ON t.asignado_a = a.id
        ORDER BY 
          FIELD(t.estado, 'abierto', 'en_proceso', 'resuelto', 'cerrado'),
          FIELD(t.prioridad, 'urgente', 'alta', 'media', 'baja'),
          t.fecha_creacion DESC
      `;
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Obtener tickets por usuario
  getByUsuario: (usuarioId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          t.*,
          a.nombre as asignado_nombre
        FROM tickets_soporte t
        LEFT JOIN usuarios a ON t.asignado_a = a.id
        WHERE t.usuario_id = ?
        ORDER BY t.fecha_creacion DESC
      `;
      db.query(query, [usuarioId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Obtener ticket por ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          t.*,
          u.nombre as usuario_nombre,
          u.correo as usuario_correo,
          u.telefono as usuario_telefono,
          a.nombre as asignado_nombre
        FROM tickets_soporte t
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        LEFT JOIN usuarios a ON t.asignado_a = a.id
        WHERE t.id = ?
      `;
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }

        const ticket = results[0];
        
        // Obtener respuestas del ticket
        const respuestasQuery = `
          SELECT 
            r.id,
            r.respuesta,
            r.fecha_creacion,
            u.nombre as usuario_nombre,
            u.rol as usuario_rol
          FROM ticket_respuestas r
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          WHERE r.ticket_id = ?
          ORDER BY r.fecha_creacion ASC
        `;
        
        db.query(respuestasQuery, [id], (err, respuestas) => {
          if (err) return reject(err);
          ticket.respuestas = respuestas || [];
          resolve(ticket);
        });
      });
    });
  },

  // Actualizar estado del ticket
  updateEstado: (id, estado, respuestaAdmin = null) => {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE tickets_soporte SET estado = ?';
      const params = [estado];

      if (respuestaAdmin) {
        query += ', respuesta_admin = ?';
        params.push(respuestaAdmin);
      }

      if (estado === 'resuelto' || estado === 'cerrado') {
        query += ', fecha_resolucion = NOW()';
      }

      query += ' WHERE id = ?';
      params.push(id);

      db.query(query, params, (err, results) => {
        if (err) return reject(err);
        resolve(results.affectedRows > 0);
      });
    });
  },

  // Asignar ticket a un administrador
  asignar: (id, adminId) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE tickets_soporte 
        SET asignado_a = ?, estado = 'en_proceso'
        WHERE id = ?
      `;
      db.query(query, [adminId, id], (err, results) => {
        if (err) return reject(err);
        resolve(results.affectedRows > 0);
      });
    });
  },

  // Actualizar prioridad
  updatePrioridad: (id, prioridad) => {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE tickets_soporte SET prioridad = ? WHERE id = ?';
      db.query(query, [prioridad, id], (err, results) => {
        if (err) return reject(err);
        resolve(results.affectedRows > 0);
      });
    });
  },

  // Responder ticket
  responder: (id, respuesta, adminId) => {
    return new Promise((resolve, reject) => {
      // Insertar la respuesta en la tabla de respuestas
      const insertQuery = `
        INSERT INTO ticket_respuestas (ticket_id, usuario_id, respuesta)
        VALUES (?, ?, ?)
      `;
      
      db.query(insertQuery, [id, adminId, respuesta], (err, results) => {
        if (err) return reject(err);
        
        // Actualizar el estado del ticket y asignarlo si no está asignado
        const updateQuery = `
          UPDATE tickets_soporte 
          SET asignado_a = COALESCE(asignado_a, ?),
              estado = CASE 
                WHEN estado = 'abierto' THEN 'en_proceso'
                ELSE estado
              END
          WHERE id = ?
        `;
        
        db.query(updateQuery, [adminId, id], (err2, results2) => {
          if (err2) return reject(err2);
          resolve(results2.affectedRows > 0);
        });
      });
    });
  },

  // Estadísticas de tickets
  getEstadisticas: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END) as abiertos,
          SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
          SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
          SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) as cerrados,
          SUM(CASE WHEN prioridad = 'urgente' THEN 1 ELSE 0 END) as urgentes,
          SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as alta_prioridad
        FROM tickets_soporte
      `;
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }
};

module.exports = TicketModel;
