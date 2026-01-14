const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Pedido = require('../models/pedidoModel');

// Confirm fake card payment: body { orderId }
router.post('/confirm', auth, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId requerido' });

    const pedido = await Pedido.getPedidoById(orderId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.usuario_id !== userId && req.user.rol !== 'administrador') return res.status(403).json({ error: 'No autorizado' });

    await Pedido.updateEstadoPago(orderId, 'pagado');
    await Pedido.updateEstado(orderId, 'pagado');

    res.json({ message: 'Pago simulado confirmado', orderId });
  } catch (err) {
    console.error('fake confirm error', err);
    res.status(500).json({ error: 'Error confirmando pago' });
  }
});

module.exports = router;
