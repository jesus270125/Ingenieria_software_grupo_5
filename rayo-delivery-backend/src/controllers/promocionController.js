const PromocionModel = require('../models/promocionModel');

const PromocionController = {
  // Crear nueva promoción (Admin)
  crear: async (req, res) => {
    try {
      const { codigo, descripcion, tipo_descuento, valor, fecha_inicio, fecha_fin, estado, uso_maximo, monto_minimo } = req.body;

      // Validaciones
      if (!codigo || !descripcion || !tipo_descuento || !valor || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos obligatorios deben estar completos' 
        });
      }

      if (tipo_descuento === 'porcentaje' && (valor < 0 || valor > 100)) {
        return res.status(400).json({ 
          success: false, 
          message: 'El porcentaje debe estar entre 0 y 100' 
        });
      }

      if (tipo_descuento === 'monto_fijo' && valor < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'El monto fijo debe ser mayor a 0' 
        });
      }

      const result = await PromocionModel.create({
        codigo: codigo.toUpperCase().trim(),
        descripcion,
        tipo_descuento,
        valor,
        fecha_inicio,
        fecha_fin,
        estado,
        uso_maximo,
        monto_minimo
      });

      res.json({ 
        success: true, 
        message: 'Promoción creada exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('Error al crear promoción:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          message: 'El código ya existe' 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear promoción' 
      });
    }
  },

  // Obtener todas las promociones (Admin)
  getAll: async (req, res) => {
    try {
      const promociones = await PromocionModel.getAll();
      res.json({ success: true, promociones });
    } catch (error) {
      console.error('Error al obtener promociones:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener promociones' 
      });
    }
  },

  // Obtener promociones activas (Cliente)
  getActivas: async (req, res) => {
    try {
      const promociones = await PromocionModel.getActivas();
      res.json({ success: true, promociones });
    } catch (error) {
      console.error('Error al obtener promociones activas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener promociones activas' 
      });
    }
  },

  // Validar código promocional (Cliente)
  validarCodigo: async (req, res) => {
    try {
      const { codigo, montoTotal } = req.body;

      if (!codigo || !montoTotal) {
        return res.status(400).json({ 
          success: false, 
          message: 'Código y monto total son requeridos' 
        });
      }

      const resultado = await PromocionModel.validarCodigo(codigo.toUpperCase().trim(), parseFloat(montoTotal));

      if (!resultado.valido) {
        return res.status(400).json({ 
          success: false, 
          message: resultado.mensaje 
        });
      }

      res.json({ 
        success: true, 
        promocion: resultado.promocion,
        descuento: resultado.descuento
      });
    } catch (error) {
      console.error('Error al validar código:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al validar código' 
      });
    }
  },

  // Obtener por ID (Admin)
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const promocion = await PromocionModel.getById(id);
      
      if (!promocion) {
        return res.status(404).json({ 
          success: false, 
          message: 'Promoción no encontrada' 
        });
      }

      res.json({ success: true, promocion });
    } catch (error) {
      console.error('Error al obtener promoción:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener promoción' 
      });
    }
  },

  // Actualizar promoción (Admin)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { codigo, descripcion, tipo_descuento, valor, fecha_inicio, fecha_fin, estado, uso_maximo, monto_minimo } = req.body;

      // Validaciones
      if (!codigo || !descripcion || !tipo_descuento || !valor || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos obligatorios deben estar completos' 
        });
      }

      if (tipo_descuento === 'porcentaje' && (valor < 0 || valor > 100)) {
        return res.status(400).json({ 
          success: false, 
          message: 'El porcentaje debe estar entre 0 y 100' 
        });
      }

      await PromocionModel.update(id, {
        codigo: codigo.toUpperCase().trim(),
        descripcion,
        tipo_descuento,
        valor,
        fecha_inicio,
        fecha_fin,
        estado,
        uso_maximo,
        monto_minimo
      });

      res.json({ 
        success: true, 
        message: 'Promoción actualizada exitosamente' 
      });
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          message: 'El código ya existe' 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar promoción' 
      });
    }
  },

  // Cambiar estado (Admin)
  cambiarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!['activa', 'inactiva', 'expirada'].includes(estado)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Estado inválido' 
        });
      }

      await PromocionModel.cambiarEstado(id, estado);

      res.json({ 
        success: true, 
        message: 'Estado actualizado exitosamente' 
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cambiar estado' 
      });
    }
  },

  // Eliminar promoción (Admin)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await PromocionModel.delete(id);

      res.json({ 
        success: true, 
        message: 'Promoción eliminada exitosamente' 
      });
    } catch (error) {
      console.error('Error al eliminar promoción:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar promoción' 
      });
    }
  },

  // Obtener estadísticas (Admin)
  getEstadisticas: async (req, res) => {
    try {
      const estadisticas = await PromocionModel.getEstadisticas();
      res.json({ success: true, estadisticas });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener estadísticas' 
      });
    }
  }
};

module.exports = PromocionController;
