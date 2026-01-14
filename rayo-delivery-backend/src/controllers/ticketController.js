const TicketModel = require('../models/ticketModel');

const TicketController = {
  // RF-28: Crear nuevo ticket de soporte
  crear: async (req, res) => {
    try {
      const { asunto, categoria, descripcion, prioridad } = req.body;
      const usuario_id = req.user.id;

      if (!asunto || !categoria || !descripcion) {
        return res.status(400).json({ 
          error: 'Asunto, categoría y descripción son requeridos' 
        });
      }

      const ticketId = await TicketModel.create({
        usuario_id,
        asunto,
        categoria,
        descripcion,
        prioridad: prioridad || 'media'
      });

      res.status(201).json({
        success: true,
        message: 'Ticket creado exitosamente',
        ticketId
      });
    } catch (error) {
      console.error('Error creando ticket:', error);
      res.status(500).json({ error: 'Error al crear ticket' });
    }
  },

  // RF-28: Obtener todos los tickets (admin)
  listarTodos: async (req, res) => {
    try {
      const tickets = await TicketModel.getAll();
      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Error listando tickets:', error);
      res.status(500).json({ error: 'Error al listar tickets' });
    }
  },

  // RF-28: Obtener tickets del usuario actual
  listarMis: async (req, res) => {
    try {
      const usuario_id = req.user.id;
      const tickets = await TicketModel.getByUsuario(usuario_id);
      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Error listando mis tickets:', error);
      res.status(500).json({ error: 'Error al listar tickets' });
    }
  },

  // RF-28: Obtener ticket por ID
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const ticket = await TicketModel.getById(id);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }

      // Verificar permisos: solo el creador o admin pueden ver
      if (ticket.usuario_id !== req.user.id && req.user.rol !== 'administrador') {
        return res.status(403).json({ error: 'No tienes permiso para ver este ticket' });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error obteniendo ticket:', error);
      res.status(500).json({ error: 'Error al obtener ticket' });
    }
  },

  // RF-28: Actualizar estado del ticket (admin)
  actualizarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, respuesta_admin } = req.body;

      if (!estado) {
        return res.status(400).json({ error: 'El estado es requerido' });
      }

      const validEstados = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
      if (!validEstados.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      const success = await TicketModel.updateEstado(id, estado, respuesta_admin);

      if (!success) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }

      res.json({
        success: true,
        message: 'Estado actualizado correctamente'
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  },

  // RF-28: Asignar ticket a administrador
  asignar: async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_id } = req.body;

      if (!admin_id) {
        return res.status(400).json({ error: 'ID de administrador requerido' });
      }

      const success = await TicketModel.asignar(id, admin_id);

      if (!success) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }

      res.json({
        success: true,
        message: 'Ticket asignado correctamente'
      });
    } catch (error) {
      console.error('Error asignando ticket:', error);
      res.status(500).json({ error: 'Error al asignar ticket' });
    }
  },

  // RF-28: Actualizar prioridad (admin)
  actualizarPrioridad: async (req, res) => {
    try {
      const { id } = req.params;
      const { prioridad } = req.body;

      if (!prioridad) {
        return res.status(400).json({ error: 'La prioridad es requerida' });
      }

      const validPrioridades = ['baja', 'media', 'alta', 'urgente'];
      if (!validPrioridades.includes(prioridad)) {
        return res.status(400).json({ error: 'Prioridad inválida' });
      }

      const success = await TicketModel.updatePrioridad(id, prioridad);

      if (!success) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }

      res.json({
        success: true,
        message: 'Prioridad actualizada correctamente'
      });
    } catch (error) {
      console.error('Error actualizando prioridad:', error);
      res.status(500).json({ error: 'Error al actualizar prioridad' });
    }
  },

  // RF-28: Responder ticket (admin)
  responder: async (req, res) => {
    try {
      const { id } = req.params;
      const { respuesta } = req.body;
      const admin_id = req.user.id;

      if (!respuesta) {
        return res.status(400).json({ error: 'La respuesta es requerida' });
      }

      const success = await TicketModel.responder(id, respuesta, admin_id);

      if (!success) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }

      res.json({
        success: true,
        message: 'Respuesta enviada correctamente'
      });
    } catch (error) {
      console.error('Error respondiendo ticket:', error);
      res.status(500).json({ error: 'Error al responder ticket' });
    }
  },

  // RF-28: Obtener estadísticas (admin)
  estadisticas: async (req, res) => {
    try {
      const stats = await TicketModel.getEstadisticas();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
};

module.exports = TicketController;
