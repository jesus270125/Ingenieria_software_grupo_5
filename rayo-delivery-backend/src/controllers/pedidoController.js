
const Pedido = require('../models/pedidoModel');
const User = require('../models/userModel');

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

    // RF10: Asignación automática
    let motorizadoId = null;
    let estado = 'registrado';

    try {
      const motorizado = await User.findAvailableMotorizado();
      if (motorizado) {
        motorizadoId = motorizado.id;
        estado = 'asignado';
      }
    } catch (e) {
      console.warn('Error buscando motorizado:', e);
    }

    const pedidoData = {
      usuario_id: usuarioId,
      subtotal,
      envio,
      total,
      direccion,
      metodo_pago,
      estado,
      motorizado_id: motorizadoId
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

    res.status(201).json({ message: 'Pedido creado', id: pedidoId, estado, motorizado_id: motorizadoId });
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
    const userRole = req.user && req.user.rol;

    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const pedidoId = req.params.id;
    const pedido = await Pedido.getPedidoById(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Seguridad: Dueño, Admin o Motorizado (si es el asignado)
    const isOwner = pedido.usuario_id === usuarioId;
    const isAdmin = userRole === 'administrador' || userRole === 'admin';
    const isAssigned = userRole === 'motorizado' && pedido.motorizado_id === usuarioId;

    if (!isOwner && !isAdmin && !isAssigned)
      return res.status(403).json({ error: 'No autorizado' });

    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

// --- New Methods ---

exports.getPedidosAsignados = async (req, res) => {
  try {
    const motorizadoId = req.user.id;
    // Verify role
    if (req.user.rol !== 'motorizado') return res.status(403).json({ error: 'No es motorizado' });

    const pedidos = await Pedido.getPedidosByMotorizado(motorizadoId);
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo pedidos asignados' });
  }
};

exports.updateEstadoPedido = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const { estado } = req.body;
    const motorizadoId = req.user.id;

    // Validar transiciones si es necesario (RF14)
    const pedido = await Pedido.getPedidoById(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (pedido.motorizado_id !== motorizadoId && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado para modificar este pedido' });
    }

    await Pedido.updateEstado(pedidoId, estado);
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando estado' });
  }
};

exports.asignarManual = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const { motorizado_id } = req.body;

    // Validation: Only Admin
    const role = req.user ? req.user.rol : '';
    if (role !== 'admin' && role !== 'administrador') {
      return res.status(403).json({ error: 'Solo administradores pueden asignar manualmente' });
    }

    await Pedido.assignMotorizado(pedidoId, motorizado_id);
    res.json({ message: 'Motorizado asignado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al asignar motorizado' });
  }
};

