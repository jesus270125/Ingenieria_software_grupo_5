const Pedido = require('../models/pedidoModel');

const METODOS_VALIDOS = ['Efectivo', 'Yape', 'Plin'];

exports.createPedido = async (req, res) => {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const {
      productos,
      subtotal,
      envio,
      total,
      direccion,
      metodo_pago
    } = req.body;

    // Validaciones básicas
    if (!Array.isArray(productos) || productos.length === 0)
      return res.status(400).json({ error: 'Productos requeridos' });

    if (typeof subtotal !== 'number' || typeof envio !== 'number' || typeof total !== 'number')
      return res.status(400).json({ error: 'Totales inválidos' });

    if (!direccion || typeof direccion !== 'string')
      return res.status(400).json({ error: 'Dirección requerida' });

    if (!METODOS_VALIDOS.includes(metodo_pago))
      return res.status(400).json({ error: 'Método de pago inválido' });

    // Validar cada producto
    for (const p of productos) {
      if (typeof p.cantidad !== 'number' || typeof p.precio_unitario !== 'number')
        return res.status(400).json({ error: 'Producto con cantidad o precio inválido' });
    }

    const pedidoData = {
      usuario_id: usuarioId,
      subtotal,
      envio,
      total,
      direccion,
      metodo_pago,
      estado: 'registrado'
    };

    const pedidoId = await Pedido.createPedido(pedidoData);

    // Preparar detalles
    const detalles = productos.map(p => ({
      producto_id: p.id || null,
      nombre: p.nombre || p.titulo || null,
      cantidad: p.cantidad,
      precio_unitario: p.precio_unitario
    }));

    await Pedido.createDetalles(pedidoId, detalles);

    res.status(201).json({ message: 'Pedido creado', id: pedidoId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
};

exports.getPedidosByUser = async (req, res) => {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const pedidos = await Pedido.getPedidosByUser(usuarioId);
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

exports.getPedidoById = async (req, res) => {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const pedidoId = req.params.id;
    const pedido = await Pedido.getPedidoById(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Asegurar que el usuario sólo pueda ver sus propios pedidos
    if (pedido.usuario_id !== usuarioId && req.user.rol !== 'admin')
      return res.status(403).json({ error: 'No autorizado' });

    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};
