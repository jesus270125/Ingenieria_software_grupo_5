
const User = require('../models/userModel');

exports.updateDisponibilidad = async (req, res) => {
    try {
        const userId = req.user.id;
        const { disponible } = req.body;

        // Assuming userModel has updateDisponibilidad or generic update
        // We will implement updateDisponibilidad in userModel next
        await User.updateDisponibilidad(userId, disponible);

        res.json({ message: 'Disponibilidad actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar disponibilidad' });
    }
};

exports.updateUbicacion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lat, lng } = req.body;

        await User.updateUbicacion(userId, lat, lng);

        // Emitir actualización vía Socket.IO para clientes en tiempo real
        try {
            const io = req.app.get('io');
            if (io) {
                // Si se nos envía un pedido asociado, emitimos solo a la sala de ese pedido
                const pedidoId = req.body.pedidoId;
                if (pedidoId) {
                    io.to(`pedido_${pedidoId}`).emit('ubicacion_actualizada', { userId, lat, lng });
                } else {
                    io.emit('ubicacion_actualizada', { userId, lat, lng });
                }
            }
        } catch (e) {
            console.warn('No se pudo emitir evento socket:', e);
        }

        res.json({ message: 'Ubicación actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar ubicación' });
    }
};

// RF-11: Listar todos los motorizados (para reasignación)
exports.listAll = async (req, res) => {
    try {
        const motorizados = await User.getMotorizados();
        res.json(motorizados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener motorizados' });
    }
};

// RF-21: Obtener perfil del motorizado (incluye disponibilidad)
exports.getPerfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            id: user.id,
            nombre: user.nombre,
            correo: user.correo,
            telefono: user.telefono,
            disponible: user.disponible || 0,
            placa: user.placa,
            rol: user.rol
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};

exports.updateEstado = async (req, res) => {
    try {
        let { id, estado } = req.body;
        // Basic validation
        if (!id || !estado) {
            return res.status(400).json({ error: 'Faltan parámetros' });
        }

        // Mapeo defensivo para evitar error de base de datos si el frontend envía 'suspendido'
        if (estado === 'suspendido') {
            estado = 'inactivo';
        } else if (estado === 'activado') { // Por si acaso
            estado = 'activo';
        }

        await User.updateEstadoCuenta(id, estado);
        res.json({ message: `Estado actualizado a ${estado}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar estado del motorizado' });
    }
};
