
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const pedidoController = require('../controllers/pedidoController');

// Crear pedido
router.post('/', auth, pedidoController.createPedido);

// Listar pedidos del usuario autenticado (Cliente)
router.get('/', auth, pedidoController.getPedidosByUser);

// Listar pedidos asignados (Motorizado) - NEW
router.get('/asignados', auth, pedidoController.getPedidosAsignados);

// Detalle de pedido (Moved down to avoid conflict with /asignados if param is generic)
router.get('/:id', auth, pedidoController.getPedidoById);

// Update status (Motorizado)
router.put('/:id/estado', auth, pedidoController.updateEstadoPedido);

// Manual Assignment (Admin)
router.put('/:id/asignar', auth, pedidoController.asignarManual);

module.exports = router;

