const db = require('../config/db');

// Obtener todas las configuraciones
exports.getAll = async (req, res) => {
    try {
        const sql = 'SELECT * FROM configuracion ORDER BY clave ASC';
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error al obtener configuraciones:', err);
                return res.status(500).json({ error: 'Error al obtener configuraciones' });
            }
            res.json(results);
        });
    } catch (err) {
        console.error('Error en getAll:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener una configuración por clave
exports.getByKey = async (req, res) => {
    try {
        const { clave } = req.params;
        const sql = 'SELECT * FROM configuracion WHERE clave = ?';
        
        db.query(sql, [clave], (err, results) => {
            if (err) {
                console.error('Error al obtener configuración:', err);
                return res.status(500).json({ error: 'Error al obtener configuración' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'Configuración no encontrada' });
            }
            
            res.json(results[0]);
        });
    } catch (err) {
        console.error('Error en getByKey:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar una configuración
exports.update = async (req, res) => {
    try {
        const { clave } = req.params;
        const { valor } = req.body;
        
        if (valor === undefined || valor === null) {
            return res.status(400).json({ error: 'El valor es requerido' });
        }
        
        const sql = 'UPDATE configuracion SET valor = ? WHERE clave = ?';
        
        db.query(sql, [valor.toString(), clave], (err, result) => {
            if (err) {
                console.error('Error al actualizar configuración:', err);
                return res.status(500).json({ error: 'Error al actualizar configuración' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Configuración no encontrada' });
            }
            
            res.json({ message: 'Configuración actualizada correctamente', clave, valor });
        });
    } catch (err) {
        console.error('Error en update:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar múltiples configuraciones
exports.updateMultiple = async (req, res) => {
    try {
        const { configuraciones } = req.body;
        
        if (!Array.isArray(configuraciones) || configuraciones.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de configuraciones' });
        }
        
        // Validar formato
        for (const config of configuraciones) {
            if (!config.clave || config.valor === undefined) {
                return res.status(400).json({ error: 'Cada configuración debe tener clave y valor' });
            }
        }
        
        // Actualizar cada una
        const promises = configuraciones.map(config => {
            return new Promise((resolve, reject) => {
                const sql = 'UPDATE configuracion SET valor = ? WHERE clave = ?';
                db.query(sql, [config.valor.toString(), config.clave], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        });
        
        await Promise.all(promises);
        
        res.json({ message: 'Configuraciones actualizadas correctamente', total: configuraciones.length });
    } catch (err) {
        console.error('Error en updateMultiple:', err);
        res.status(500).json({ error: 'Error al actualizar configuraciones' });
    }
};

module.exports = exports;
