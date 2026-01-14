const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// RF-28: Rutas para usuarios (clientes y motorizados)
router.post('/', auth, ticketController.crear);
router.get('/mis-tickets', auth, ticketController.listarMis);
router.get('/:id', auth, ticketController.obtenerPorId);

// RF-28: Rutas para administradores
router.get('/', auth, verifyRole('administrador'), ticketController.listarTodos);
router.put('/:id/estado', auth, verifyRole('administrador'), ticketController.actualizarEstado);
router.put('/:id/asignar', auth, verifyRole('administrador'), ticketController.asignar);
router.put('/:id/prioridad', auth, verifyRole('administrador'), ticketController.actualizarPrioridad);
router.post('/:id/responder', auth, verifyRole('administrador'), ticketController.responder);
router.get('/estadisticas/general', auth, verifyRole('administrador'), ticketController.estadisticas);

module.exports = router;
