const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const pedidoController = require('../controllers/pedidoController');

// Crear pedido
router.post('/', auth, pedidoController.createPedido);

// Listar pedidos del usuario autenticado
router.get('/', auth, pedidoController.getPedidosByUser);

// Detalle de pedido
router.get('/:id', auth, pedidoController.getPedidoById);

module.exports = router;
