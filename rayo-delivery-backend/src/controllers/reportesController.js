const db = require('../config/db');

// Reporte de ventas por periodo
exports.ventasPorPeriodo = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
        }

        const sql = `
            SELECT 
                DATE(created_at) as fecha,
                COUNT(*) as total_pedidos,
                SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as pedidos_entregados,
                SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as pedidos_cancelados,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN total ELSE 0 END), 0) as total_ventas,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN envio ELSE 0 END), 0) as total_envios,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN subtotal ELSE 0 END), 0) as total_subtotal
            FROM pedidos
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY fecha ASC
        `;

        const [results] = await db.promise().query(sql, [fecha_inicio, fecha_fin]);
        res.json(results);
    } catch (err) {
        console.error('Error en ventasPorPeriodo:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Pedidos por hora del día
exports.pedidosPorHora = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
        }

        const sql = `
            SELECT 
                HOUR(created_at) as hora,
                COUNT(*) as cantidad_pedidos,
                COALESCE(AVG(CASE WHEN estado = 'entregado' THEN total ELSE NULL END), 0) as promedio_venta
            FROM pedidos
            WHERE created_at BETWEEN ? AND ?
            GROUP BY HOUR(created_at)
            ORDER BY hora ASC
        `;

        const [results] = await db.promise().query(sql, [fecha_inicio, fecha_fin]);
        res.json(results);
    } catch (err) {
        console.error('Error en pedidosPorHora:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Rendimiento de motorizados
exports.rendimientoMotorizados = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
        }

        const sql = `
            SELECT 
                u.id as motorizado_id,
                u.nombre as motorizado_nombre,
                u.placa,
                COUNT(p.id) as total_entregas,
                SUM(CASE WHEN p.estado = 'entregado' THEN 1 ELSE 0 END) as entregas_exitosas,
                SUM(CASE WHEN p.estado = 'cancelado' THEN 1 ELSE 0 END) as entregas_canceladas,
                COALESCE(SUM(CASE WHEN p.estado = 'entregado' THEN p.total ELSE 0 END), 0) as total_generado
            FROM usuarios u
            LEFT JOIN pedidos p ON p.motorizado_id = u.id 
                AND p.created_at BETWEEN ? AND ?
            WHERE u.rol = 'motorizado'
            GROUP BY u.id, u.nombre, u.placa
            ORDER BY total_entregas DESC
        `;

        const [results] = await db.promise().query(sql, [fecha_inicio, fecha_fin]);
        res.json(results);
    } catch (err) {
        console.error('Error en rendimientoMotorizados:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Tiempos promedio de entrega
exports.tiemposEntrega = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
        }

        const sql = `
            SELECT 
                DATE(p.created_at) as fecha,
                COUNT(CASE WHEN p.estado = 'entregado' THEN 1 END) as pedidos_entregados,
                COALESCE(AVG(
                    CASE 
                        WHEN p.estado = 'entregado' AND p.fecha_entrega IS NOT NULL 
                        THEN TIMESTAMPDIFF(MINUTE, p.created_at, p.fecha_entrega)
                        ELSE NULL 
                    END
                ), 0) as tiempo_promedio_minutos
            FROM pedidos p
            WHERE p.created_at BETWEEN ? AND ?
                AND p.estado = 'entregado'
            GROUP BY DATE(p.created_at)
            ORDER BY fecha ASC
        `;

        const [results] = await db.promise().query(sql, [fecha_inicio, fecha_fin]);
        res.json(results);
    } catch (err) {
        console.error('Error en tiemposEntrega:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Resumen general
exports.resumenGeneral = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
        }

        const sql = `
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as pedidos_entregados,
                SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as pedidos_cancelados,
                SUM(CASE WHEN estado IN ('registrado', 'asignado', 'en_camino') THEN 1 ELSE 0 END) as pedidos_activos,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN total ELSE 0 END), 0) as ventas_totales,
                COALESCE(AVG(CASE WHEN estado = 'entregado' THEN total ELSE NULL END), 0) as ticket_promedio,
                COUNT(DISTINCT usuario_id) as clientes_unicos,
                COUNT(DISTINCT motorizado_id) as motorizados_activos
            FROM pedidos
            WHERE created_at BETWEEN ? AND ?
        `;

        const [results] = await db.promise().query(sql, [fecha_inicio, fecha_fin]);
        res.json(results[0]);
    } catch (err) {
        console.error('Error en resumenGeneral:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = exports;
