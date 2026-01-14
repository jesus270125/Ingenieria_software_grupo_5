const express = require('express');
const router = express.Router();
const IncidenciaController = require('../controllers/incidenciaController');
const authMiddleware = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// Rutas protegidas - requieren autenticación

// Crear una nueva incidencia (cliente o motorizado)
router.post('/', authMiddleware, IncidenciaController.crear);

// Obtener mis incidencias (usuario autenticado)
router.get('/mis-incidencias', authMiddleware, IncidenciaController.getMisIncidencias);

// Obtener incidencias por pedido
router.get('/pedido/:pedidoId', authMiddleware, IncidenciaController.getByPedido);

// Rutas solo para administradores

// Obtener todas las incidencias
router.get('/', authMiddleware, verifyRole(['administrador']), IncidenciaController.getAll);

// Responder a una incidencia
router.put('/:id/responder', authMiddleware, verifyRole(['administrador']), IncidenciaController.responder);

// Obtener estadísticas
router.get('/estadisticas', authMiddleware, verifyRole(['administrador']), IncidenciaController.getEstadisticas);

module.exports = router;
