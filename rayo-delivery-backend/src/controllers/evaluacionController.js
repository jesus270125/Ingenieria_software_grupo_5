const Evaluacion = require('../models/evaluacionModel');

// RF-22: Crear evaluación
exports.create = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const { pedido_id, motorizado_id, calificacion, comentario } = req.body;

        // Validaciones
        if (!pedido_id || !motorizado_id || !calificacion) {
            return res.status(400).json({ error: 'Faltan datos obligatorios: pedido_id, motorizado_id, calificacion' });
        }

        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5' });
        }

        // Verificar que el pedido no haya sido evaluado previamente
        const yaEvaluado = await Evaluacion.existeEvaluacion(pedido_id);
        if (yaEvaluado) {
            return res.status(400).json({ error: 'Este pedido ya ha sido evaluado' });
        }

        const data = {
            pedido_id,
            cliente_id: clienteId,
            motorizado_id,
            calificacion,
            comentario: comentario || null
        };

        const evaluacionId = await Evaluacion.create(data);

        res.json({ 
            message: 'Evaluación registrada correctamente',
            evaluacionId 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar la evaluación' });
    }
};

// RF-22: Obtener evaluaciones de un motorizado
exports.getByMotorizado = async (req, res) => {
    try {
        const { id } = req.params;
        const evaluaciones = await Evaluacion.getByMotorizado(id);
        
        // Calcular promedio
        const stats = await Evaluacion.getPromedioMotorizado(id);
        
        res.json({ 
            evaluaciones,
            promedio: stats.promedio ? parseFloat(stats.promedio).toFixed(2) : 0,
            total: stats.total_evaluaciones
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
};

// RF-22: Obtener todas las evaluaciones (Admin)
exports.getAll = async (req, res) => {
    try {
        const evaluaciones = await Evaluacion.getAll();
        res.json(evaluaciones);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
};

// RF-22: Responder evaluación (Admin)
exports.responder = async (req, res) => {
    try {
        const { id } = req.params;
        const { respuesta, accion } = req.body;

        if (!respuesta) {
            return res.status(400).json({ error: 'La respuesta es obligatoria' });
        }

        await Evaluacion.updateRespuestaAdmin(id, respuesta, accion || null);

        res.json({ message: 'Respuesta registrada correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al responder evaluación' });
    }
};

// RF-22: Verificar si un pedido puede ser evaluado
exports.puedeEvaluar = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const yaEvaluado = await Evaluacion.existeEvaluacion(pedidoId);
        
        res.json({ puedeEvaluar: !yaEvaluado });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al verificar evaluación' });
    }
};

// RF-22: Obtener evaluaciones del cliente (sus propias evaluaciones)
exports.getMisEvaluaciones = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const evaluaciones = await Evaluacion.getByCliente(clienteId);
        
        res.json(evaluaciones);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
};
