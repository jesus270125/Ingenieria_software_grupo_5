const IncidenciaModel = require('../models/incidenciaModel');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subir fotos de incidencias
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'incidencia-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
  }
}).single('foto');

const IncidenciaController = {
  // Crear una nueva incidencia
  crear: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { pedido_id, tipo_incidencia, descripcion } = req.body;
        const usuario_id = req.user.id;

        // Validaciones
        if (!pedido_id || !tipo_incidencia || !descripcion) {
          return res.status(400).json({ 
            error: 'Pedido, tipo de incidencia y descripción son requeridos' 
          });
        }

        const tiposValidos = ['demora', 'mal_estado', 'perdida', 'otro'];
        if (!tiposValidos.includes(tipo_incidencia)) {
          return res.status(400).json({ 
            error: 'Tipo de incidencia inválido' 
          });
        }

        const incidenciaData = {
          pedido_id,
          usuario_id,
          tipo_incidencia,
          descripcion,
          foto_url: req.file ? req.file.filename : null
        };

        const incidenciaId = await IncidenciaModel.create(incidenciaData);
        
        res.status(201).json({
          success: true,
          message: 'Incidencia reportada exitosamente',
          incidenciaId
        });
      } catch (error) {
        console.error('Error al crear incidencia:', error);
        res.status(500).json({ error: 'Error al reportar la incidencia' });
      }
    });
  },

  // Obtener todas las incidencias (solo admin)
  getAll: async (req, res) => {
    try {
      const incidencias = await IncidenciaModel.getAll();
      res.json(incidencias);
    } catch (error) {
      console.error('Error al obtener incidencias:', error);
      res.status(500).json({ error: 'Error al obtener incidencias' });
    }
  },

  // Obtener incidencias del usuario autenticado
  getMisIncidencias: async (req, res) => {
    try {
      const usuario_id = req.user.id;
      const incidencias = await IncidenciaModel.getByUsuario(usuario_id);
      res.json(incidencias);
    } catch (error) {
      console.error('Error al obtener mis incidencias:', error);
      res.status(500).json({ error: 'Error al obtener incidencias' });
    }
  },

  // Obtener incidencias por pedido
  getByPedido: async (req, res) => {
    try {
      const { pedidoId } = req.params;
      const incidencias = await IncidenciaModel.getByPedido(pedidoId);
      res.json(incidencias);
    } catch (error) {
      console.error('Error al obtener incidencias del pedido:', error);
      res.status(500).json({ error: 'Error al obtener incidencias' });
    }
  },

  // Responder a una incidencia (solo admin)
  responder: async (req, res) => {
    try {
      const { id } = req.params;
      const { respuesta, estado } = req.body;

      if (!respuesta || !estado) {
        return res.status(400).json({ 
          error: 'Respuesta y estado son requeridos' 
        });
      }

      const estadosValidos = ['pendiente', 'en_revision', 'resuelto'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido' 
        });
      }

      const actualizado = await IncidenciaModel.updateRespuesta(id, respuesta, estado);
      
      if (actualizado) {
        res.json({ 
          success: true,
          message: 'Respuesta enviada exitosamente' 
        });
      } else {
        res.status(404).json({ error: 'Incidencia no encontrada' });
      }
    } catch (error) {
      console.error('Error al responder incidencia:', error);
      res.status(500).json({ error: 'Error al responder la incidencia' });
    }
  },

  // Obtener estadísticas (solo admin)
  getEstadisticas: async (req, res) => {
    try {
      const stats = await IncidenciaModel.getEstadisticas();
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
};

module.exports = IncidenciaController;
