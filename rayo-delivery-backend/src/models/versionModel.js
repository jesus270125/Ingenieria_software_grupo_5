const db = require("../config/db");

// RF-30: Registrar cambio con snapshot completo de datos
exports.registrarCambio = (tipo, referenciaId, accion, descripcion, datosAnteriores, datosNuevos, usuario) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO catalogo_versiones (tipo, referencia_id, accion, descripcion, datos_anteriores, datos_nuevos, usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const datosAntJSON = datosAnteriores ? JSON.stringify(datosAnteriores) : null;
        const datosNuevJSON = datosNuevos ? JSON.stringify(datosNuevos) : null;
        
        db.query(sql, [tipo, referenciaId, accion, descripcion, datosAntJSON, datosNuevJSON, usuario], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// Listar todas las versiones
exports.listar = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM catalogo_versiones ORDER BY fecha DESC`;
        db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// RF-30: Obtener una versión específica por ID
exports.obtenerPorId = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM catalogo_versiones WHERE id = ?`;
        db.query(sql, [id], (err, results) => {
            if (err) reject(err);
            else resolve(results && results.length ? results[0] : null);
        });
    });
};

// RF-30: Revertir a una versión anterior
exports.revertir = async (versionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Obtener la versión
            const version = await exports.obtenerPorId(versionId);
            if (!version) {
                return reject(new Error('Versión no encontrada'));
            }
            
            if (!version.datos_anteriores) {
                return reject(new Error('Esta versión no tiene datos anteriores para restaurar'));
            }

            const datosAnteriores = JSON.parse(version.datos_anteriores);
            const tipo = version.tipo;
            const referenciaId = version.referencia_id;

            let sql = '';
            let params = [];

            if (tipo === 'producto') {
                sql = `
                    UPDATE productos 
                    SET nombre = ?, descripcion = ?, precio = ?, imagen = ?
                    WHERE id = ?
                `;
                params = [
                    datosAnteriores.nombre,
                    datosAnteriores.descripcion,
                    datosAnteriores.precio,
                    datosAnteriores.imagen,
                    referenciaId
                ];
            } else if (tipo === 'local') {
                sql = `
                    UPDATE locales 
                    SET nombre = ?, direccion = ?, categoria = ?, imagen = ?, hora_apertura = ?, hora_cierre = ?
                    WHERE id = ?
                `;
                params = [
                    datosAnteriores.nombre,
                    datosAnteriores.direccion,
                    datosAnteriores.categoria,
                    datosAnteriores.imagen,
                    datosAnteriores.hora_apertura,
                    datosAnteriores.hora_cierre,
                    referenciaId
                ];
            } else {
                return reject(new Error('Tipo de versión no soportado'));
            }

            db.query(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        } catch (error) {
            reject(error);
        }
    });
};
