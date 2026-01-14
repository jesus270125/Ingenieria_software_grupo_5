const db = require('../config/db');

// Listar todos los clientes (Solo Admin)
exports.listClientes = async (req, res) => {
    try {
        const sql = `
            SELECT id, nombre, dni_ruc, telefono, direccion, correo, 
                   estado_cuenta, fecha_registro, lat, lng
            FROM usuarios 
            WHERE rol = 'cliente' 
            ORDER BY fecha_registro DESC
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error al listar clientes:', err);
                return res.status(500).json({ error: 'Error al obtener clientes' });
            }
            res.json(results);
        });
    } catch (err) {
        console.error('Error en listClientes:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener un cliente por ID
exports.getCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT id, nombre, dni_ruc, telefono, direccion, correo, 
                   estado_cuenta, fecha_registro, lat, lng
            FROM usuarios 
            WHERE id = ? AND rol = 'cliente'
        `;
        
        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error al obtener cliente:', err);
                return res.status(500).json({ error: 'Error al obtener cliente' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            
            res.json(results[0]);
        });
    } catch (err) {
        console.error('Error en getCliente:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar estado de cuenta de un cliente
exports.updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_cuenta } = req.body;
        
        if (!['activo', 'inactivo'].includes(estado_cuenta)) {
            return res.status(400).json({ error: 'Estado inválido. Use: activo o inactivo' });
        }
        
        const sql = 'UPDATE usuarios SET estado_cuenta = ? WHERE id = ? AND rol = "cliente"';
        
        db.query(sql, [estado_cuenta, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar estado:', err);
                return res.status(500).json({ error: 'Error al actualizar estado' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            
            res.json({ message: 'Estado actualizado correctamente', estado: estado_cuenta });
        });
    } catch (err) {
        console.error('Error en updateEstado:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener estadísticas de un cliente
exports.getEstadisticas = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                COUNT(*) as total_pedidos,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END), 0) as pedidos_completados,
                COALESCE(SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END), 0) as pedidos_cancelados,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN total ELSE 0 END), 0) as total_gastado
            FROM pedidos
            WHERE usuario_id = ?
        `;
        
        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error al obtener estadísticas:', err);
                return res.status(500).json({ error: 'Error al obtener estadísticas' });
            }
            
            res.json(results[0]);
        });
    } catch (err) {
        console.error('Error en getEstadisticas:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = exports;
