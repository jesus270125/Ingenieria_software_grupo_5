
const Pedido = require('../models/pedidoModel');
const User = require('../models/userModel');
const tarifaService = require('../services/tarifaService');

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
      metodo_pago,
      latitude,
      longitude,
      local_id
    } = req.body;

    // Validaciones básicas
    if (!Array.isArray(productos) || productos.length === 0)
      return res.status(400).json({ error: 'Productos requeridos' });

    if (typeof subtotal !== 'number')
      return res.status(400).json({ error: 'Subtotal inválido' });

    if (!direccion || typeof direccion !== 'string')
      return res.status(400).json({ error: 'Dirección requerida' });

    if (!METODOS_VALIDOS.includes(metodo_pago))
      return res.status(400).json({ error: 'Método de pago inválido' });

    // RF-29: Validar horarios de atención del local
    if (local_id) {
      const LocalModel = require('../models/localModel');
      const local = await LocalModel.getLocalById(local_id);
      
      if (local) {
        const horaActual = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const abierto = horaActual >= local.hora_apertura && horaActual <= local.hora_cierre;
        
        if (!abierto) {
          return res.status(400).json({ 
            error: 'El local está cerrado en este momento',
            horario: `${local.hora_apertura} - ${local.hora_cierre}`
          });
        }
      }
    }

    // Validar cada producto
    for (const p of productos) {
      if (typeof p.cantidad !== 'number' || typeof p.precio_unitario !== 'number')
        return res.status(400).json({ error: 'Producto con cantidad o precio inválido' });
    }

    // RF-19: Calcular envío automáticamente si hay coordenadas, sino usar valor enviado o tarifa base
    let envioCalc = 5.00;
    
    if (latitude && longitude) {
      try {
        const resultadoTarifa = await tarifaService.calcularTarifaDesdeLocal(
          parseFloat(latitude),
          parseFloat(longitude)
        );
        envioCalc = resultadoTarifa.tarifa;
        console.log(`Tarifa calculada: S/ ${envioCalc} (${resultadoTarifa.distanciaKm} km)`);
      } catch (error) {
        console.error('Error calculando tarifa automática:', error);
        const config = await tarifaService.obtenerConfiguracionTarifas();
        envioCalc = config.tarifaBase;
      }
    } else if (typeof envio === 'number') {
      // Si el cliente envió un valor de envío, usarlo (compatibilidad hacia atrás)
      envioCalc = envio;
    } else {
      // Sin coordenadas ni envío, usar tarifa base de configuración
      const config = await tarifaService.obtenerConfiguracionTarifas();
      envioCalc = config.tarifaBase;
    }
    
    const totalCalc = subtotal + envioCalc;

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
      envio: envioCalc,
      total: totalCalc,
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

    const resultado = await Pedido.updateEstado(pedidoId, estado);
    
    // Emitir evento de cambio de estado al cliente vía Socket.IO
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`pedido_${pedidoId}`).emit('pedido:estado_actualizado', {
          pedidoId,
          estado,
          codigo_entrega: resultado.codigo_entrega || null,
          timestamp: new Date()
        });
      }
    } catch (e) {
      console.warn('No se pudo emitir evento de cambio de estado:', e);
    }
    
    res.json({ 
      message: 'Estado actualizado',
      codigo_entrega: resultado.codigo_entrega || null
    });
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

// RF-14: Obtener historial de estados de un pedido
exports.getHistorialEstados = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    
    // Verificar que el pedido existe
    const pedido = await Pedido.getPedidoById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Verificar permisos: el cliente dueño del pedido, el motorizado asignado, o admin
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    if (userRole !== 'admin' && userRole !== 'administrador' && 
        pedido.usuario_id !== userId && pedido.motorizado_id !== userId) {
      return res.status(403).json({ error: 'No autorizado para ver este historial' });
    }
    
    const historial = await Pedido.getHistorialEstados(pedidoId);
    res.json(historial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo historial de estados' });
  }
};
// RF-15: Confirmar entrega con código
exports.confirmarEntrega = async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const { codigo } = req.body;
    const motorizadoId = req.user.id;

    if (!codigo) {
      return res.status(400).json({ error: 'Código de entrega requerido' });
    }

    // Verificar que el pedido existe y pertenece al motorizado
    const pedido = await Pedido.getPedidoById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.motorizado_id !== motorizadoId && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado para confirmar este pedido' });
    }

    // Confirmar entrega
    const resultado = await Pedido.confirmarEntrega(pedidoId, codigo);
    
    // Emitir evento de entrega confirmada
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`pedido_${pedidoId}`).emit('pedido:estado_actualizado', {
          pedidoId,
          estado: 'entregado',
          timestamp: new Date()
        });
      }
    } catch (e) {
      console.warn('No se pudo emitir evento de entrega:', e);
    }

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Error confirmando entrega' });
  }
};