const db = require('../config/db');

const PromocionModel = {
  // Crear nueva promoción
  create: (promocionData) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO promociones 
        (codigo, descripcion, tipo_descuento, valor, fecha_inicio, fecha_fin, estado, uso_maximo, monto_minimo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(query, [
        promocionData.codigo,
        promocionData.descripcion,
        promocionData.tipo_descuento,
        promocionData.valor,
        promocionData.fecha_inicio,
        promocionData.fecha_fin,
        promocionData.estado || 'activa',
        promocionData.uso_maximo || null,
        promocionData.monto_minimo || 0
      ], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Obtener todas las promociones (Admin)
  getAll: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, codigo, descripcion, tipo_descuento, valor,
          fecha_inicio, fecha_fin, estado, uso_maximo, 
          usos_actuales, monto_minimo, creado_en, actualizado_en
        FROM promociones 
        ORDER BY creado_en DESC
      `;
      db.query(query, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // Obtener promociones activas (Cliente)
  getActivas: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, codigo, descripcion, tipo_descuento, valor,
          fecha_inicio, fecha_fin, uso_maximo, usos_actuales, monto_minimo
        FROM promociones 
        WHERE estado = 'activa' 
          AND fecha_inicio <= NOW() 
          AND fecha_fin >= NOW()
          AND (uso_maximo IS NULL OR usos_actuales < uso_maximo)
        ORDER BY creado_en DESC
      `;
      db.query(query, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // Validar código promocional
  validarCodigo: (codigo, montoTotal) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, codigo, descripcion, tipo_descuento, valor,
          fecha_inicio, fecha_fin, estado, uso_maximo, 
          usos_actuales, monto_minimo
        FROM promociones 
        WHERE codigo = ?
      `;
      db.query(query, [codigo], (err, rows) => {
        if (err) return reject(err);
        
        if (rows.length === 0) {
          return resolve({ valido: false, mensaje: 'Código no encontrado' });
        }

        const promocion = rows[0];
        const now = new Date();
        const fechaInicio = new Date(promocion.fecha_inicio);
        const fechaFin = new Date(promocion.fecha_fin);

        // Validaciones
        if (promocion.estado !== 'activa') {
          return resolve({ valido: false, mensaje: 'Código inactivo' });
        }

        if (now < fechaInicio) {
          return resolve({ valido: false, mensaje: 'Código aún no vigente' });
        }

        if (now > fechaFin) {
          return resolve({ valido: false, mensaje: 'Código expirado' });
        }

        if (promocion.uso_maximo !== null && promocion.usos_actuales >= promocion.uso_maximo) {
          return resolve({ valido: false, mensaje: 'Código agotado' });
        }

        if (montoTotal < promocion.monto_minimo) {
          return resolve({ 
            valido: false, 
            mensaje: `Monto mínimo requerido: S/ ${promocion.monto_minimo}` 
          });
        }

        // Calcular descuento
        let descuento = 0;
        if (promocion.tipo_descuento === 'porcentaje') {
          descuento = (parseFloat(montoTotal) * parseFloat(promocion.valor)) / 100;
        } else {
          descuento = parseFloat(promocion.valor);
        }

        // El descuento no puede ser mayor al total
        if (descuento > parseFloat(montoTotal)) {
          descuento = parseFloat(montoTotal);
        }

        resolve({
          valido: true,
          promocion: {
            id: promocion.id,
            codigo: promocion.codigo,
            descripcion: promocion.descripcion,
            tipo_descuento: promocion.tipo_descuento,
            valor: promocion.valor
          },
          descuento: parseFloat(parseFloat(descuento).toFixed(2))
        });
      });
    });
  },

  // Incrementar uso de promoción
  incrementarUso: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE promociones 
        SET usos_actuales = usos_actuales + 1 
        WHERE id = ?
      `;
      db.query(query, [id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Obtener por ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM promociones WHERE id = ?`;
      db.query(query, [id], (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      });
    });
  },

  // Actualizar promoción
  update: (id, promocionData) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE promociones 
        SET codigo = ?, descripcion = ?, tipo_descuento = ?, valor = ?,
            fecha_inicio = ?, fecha_fin = ?, estado = ?, uso_maximo = ?, monto_minimo = ?
        WHERE id = ?
      `;
      db.query(query, [
        promocionData.codigo,
        promocionData.descripcion,
        promocionData.tipo_descuento,
        promocionData.valor,
        promocionData.fecha_inicio,
        promocionData.fecha_fin,
        promocionData.estado,
        promocionData.uso_maximo || null,
        promocionData.monto_minimo || 0,
        id
      ], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Cambiar estado
  cambiarEstado: (id, estado) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE promociones 
        SET estado = ? 
        WHERE id = ?
      `;
      db.query(query, [estado, id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Eliminar promoción
  delete: (id) => {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM promociones WHERE id = ?`;
      db.query(query, [id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Estadísticas de uso
  getEstadisticas: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
          SUM(CASE WHEN estado = 'inactiva' THEN 1 ELSE 0 END) as inactivas,
          SUM(CASE WHEN estado = 'expirada' THEN 1 ELSE 0 END) as expiradas,
          SUM(usos_actuales) as total_usos
        FROM promociones
      `;
      db.query(query, (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      });
    });
  }
};

module.exports = PromocionModel;
