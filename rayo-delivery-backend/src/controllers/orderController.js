const Order = require("../models/orderModel");
const nodemailer = require("nodemailer");
const assignmentService = require("../services/assignmentService");
const tarifaService = require("../services/tarifaService");
const PromocionModel = require("../models/promocionModel");

// Configurar transporter usando variables de entorno. Si no hay credenciales, no intentaremos enviar correo.
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    console.warn('SMTP no configurado: omitiendo envío de correos. Setear SMTP_USER y SMTP_PASS en .env para habilitar.');
}

exports.create = async (req, res) => {
    try {
        const { usuario_id, direccion, metodo_pago, items, latitude, longitude, codigo_promocional, descuento } = req.body;

        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "El carrito está vacío" });
        }

        // Calcular subtotal de forma segura en el servidor (no confiar en valores enviados por el cliente)
        let subtotalCalc = 0;
        const normalizedItems = items.map(it => {
            const prod = it.product || {};
            const price = Number(prod.precio ?? prod.price ?? 0) || 0;
            const qty = Number(it.quantity) || 0;
            const lineTotal = price * qty;
            subtotalCalc += lineTotal;
            return {
                product: {
                    id: prod.id || prod._id || null,
                    nombre: prod.nombre || prod.name || '',
                    precio: price
                },
                quantity: qty
            };
        });

        // RF-19: Calcular envío automáticamente si hay coordenadas, sino usar tarifa base
        let envioCalc = 5.00; // Valor por defecto
        
        if (latitude && longitude) {
            try {
                const resultadoTarifa = await tarifaService.calcularTarifaDesdeLocal(
                    parseFloat(latitude),
                    parseFloat(longitude)
                );
                envioCalc = resultadoTarifa.tarifa;
                console.log(`Tarifa calculada: S/ ${envioCalc} (${resultadoTarifa.distanciaKm} km)`);
            } catch (error) {
                console.error('Error calculando tarifa automática, usando base:', error);
                // Si falla, usar tarifa base de configuración
                const config = await tarifaService.obtenerConfiguracionTarifas();
                envioCalc = config.tarifaBase;
            }
        } else {
            // Sin coordenadas, usar tarifa base de configuración
            const config = await tarifaService.obtenerConfiguracionTarifas();
            envioCalc = config.tarifaBase;
        }
        
        // Aplicar descuento si existe (RF-24)
        const descuentoCalc = parseFloat(descuento) || 0;
        const totalCalc = subtotalCalc + envioCalc - descuentoCalc;

        const orderData = {
            usuario_id,
            subtotal: subtotalCalc,
            envio: envioCalc,
            total: totalCalc,
            direccion,
            metodo_pago,
            latitude: latitude || null,
            longitude: longitude || null,
            codigo_promocional: codigo_promocional || null,
            descuento: descuentoCalc
        };

        const orderId = await Order.createOrder(orderData, normalizedItems);

        // RF-24: Incrementar uso de promoción si se aplicó un código
        if (codigo_promocional && descuentoCalc > 0) {
            try {
                // Buscar la promoción por código para obtener su ID
                const resultado = await PromocionModel.validarCodigo(codigo_promocional, subtotalCalc + envioCalc);
                if (resultado.valido && resultado.promocion) {
                    await PromocionModel.incrementarUso(resultado.promocion.id);
                    console.log(`Promoción ${codigo_promocional} incrementada`);
                }
            } catch (promoErr) {
                console.error("Error incrementando uso de promoción:", promoErr);
                // No detener el pedido por esto
            }
        }

        // --- ASIGNACIÓN AUTOMÁTICA DE MOTORIZADO (RF-10) ---
        let motorizadoMsg = "Buscando motorizado...";
        let motorizadoId = null;
        try {
            motorizadoId = await assignmentService.asignarMotorizadoAutomaticamente(orderId);
            if (motorizadoId) {
                motorizadoMsg = "Motorizado asignado automáticamente.";
            } else {
                motorizadoMsg = "No hay motorizados disponibles por el momento.";
            }
        } catch (assignErr) {
            console.error("Error en asignación automática:", assignErr);
        }

        // Emitir evento en tiempo real sobre la asignación si hay socket
        try {
            const io = req.app.get('io');
            if (io && motorizadoId) {
                // Notificar al motorizado (si está conectado a su sala)
                io.to(`motorizado_${motorizadoId}`).emit('pedido:asignado', { pedidoId: orderId, motorizadoId });
                // Notificar a quienes estén viendo el pedido
                io.to(`pedido_${orderId}`).emit('pedido:asignado', { pedidoId: orderId, motorizadoId });
                // Emisión global como fallback
                io.emit('pedido:asignado', { pedidoId: orderId, motorizadoId });
            }
        } catch (e) {
            console.warn('No se pudo emitir evento de asignación:', e);
        }
        // ---------------------------------------------------

        // Enviar notificación al Cliente
        const mailOptionsCliente = {
            from: 'Rayo Delivery <231188@unamba.edu.pe>',
            to: req.user?.email || (req.body.email || ''), // Email del usuario autenticado
            subject: `Confirmación de Pedido #${orderId}`,
            html: `
                <h1>¡Gracias por tu pedido!</h1>
                <p>Tu pedido #${orderId} ha sido recibido.</p>
                <p><strong>Estado:</strong> ${motorizadoMsg}</p>
                <p><strong>Total:</strong> S/. ${orderData.total}</p>
                <p><strong>Dirección:</strong> ${orderData.direccion}</p>
            `
        };

        // Enviar notificación al Admin (simulado al mismo correo o a uno admin)
        const mailOptionsAdmin = {
            from: 'Rayo Delivery System',
            to: '231188@unamba.edu.pe', // Correo del admin
            subject: `Nuevo Pedido #${orderId}`,
            html: `
                <h1>Nuevo Pedido Registrado</h1>
                <p><strong>Cliente:</strong> ${req.user?.nombre || (req.body.nombre || 'N/A')}</p>
                <p><strong>Total:</strong> S/. ${orderData.total}</p>
                <p><strong>ID Pedido:</strong> ${orderId}</p>
                <p><strong>Asignación:</strong> ${motorizadoMsg}</p>
            `
        };

        // Enviar correos de forma asíncrona (no bloquear respuesta)
        if (transporter) {
            transporter.sendMail(mailOptionsCliente).catch(err => console.error("Error mail cliente", err));
            transporter.sendMail(mailOptionsAdmin).catch(err => console.error("Error mail admin", err));
        } else {
            console.log('Correo deshabilitado. Mensaje cliente:', mailOptionsCliente);
            console.log('Correo admin:', mailOptionsAdmin);
        }

        res.status(201).json({
            message: "Pedido creado exitosamente",
            id: orderId,
            assignmentStatus: motorizadoMsg
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear el pedido" });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.getOrdersByUser(req.user.id);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener pedidos" });
    }
};

exports.getById = async (req, res) => {
    try {
        const order = await Order.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener pedido" });
    }
};

exports.listAll = async (req, res) => { // Solo Admin
    try {
        const orders = await Order.getAllOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Error al listar pedidos" });
    }
};

// RF-11: Reasignar pedido a otro motorizado (Solo Admin)
exports.reassign = async (req, res) => {
    try {
        const { pedidoId, motorizadoId } = req.body;

        // Validaciones
        if (!pedidoId || !motorizadoId) {
            return res.status(400).json({
                error: "Se requiere pedidoId y motorizadoId"
            });
        }

        const result = await Order.reassignMotorizado(pedidoId, motorizadoId);

        // Emitir evento Socket.IO para notificación en tiempo real
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`pedido_${pedidoId}`).emit('pedido:reasignado', { pedidoId, motorizadoId, result });
                io.to(`motorizado_${motorizadoId}`).emit('pedido:reasignado', { pedidoId, motorizadoId, result });
                io.emit('pedido:reasignado', { pedidoId, motorizadoId, result });
            }
        } catch (e) { console.warn('No se pudo emitir evento de reasignación:', e); }

        res.json({
            message: "Pedido reasignado exitosamente",
            data: result
        });

    } catch (err) {
        console.error("Error al reasignar pedido:", err);
        res.status(500).json({
            error: err.message || "Error al reasignar el pedido"
        });
    }
};
