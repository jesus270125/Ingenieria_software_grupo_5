const db = require('../config/db');

exports.findByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM usuarios WHERE correo = ?';
        db.query(sql, [email], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

exports.createUser = (user) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO usuarios 
        (nombre, dni_ruc, telefono, direccion, correo, password, rol, placa, licencia, foto, estado_cuenta, disponible, lat, lng) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', 1, NULL, NULL)`;

        db.query(sql, [
            user.nombre,
            user.dni_ruc,
            user.telefono,
            user.direccion,
            user.correo,
            user.password,
            user.rol || 'cliente',
            user.placa,
            user.licencia,
            user.foto
        ], (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
};


exports.findById = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

exports.updateUser = (id, datos) => {
    return new Promise((resolve, reject) => {
        const campos = [];
        const valores = [];

        if (datos.nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(datos.nombre);
        }
        if (datos.telefono !== undefined) {
            campos.push('telefono = ?');
            valores.push(datos.telefono);
        }
        if (datos.direccion !== undefined) {
            campos.push('direccion = ?');
            valores.push(datos.direccion);
        }

        if (campos.length === 0) {
            return resolve({ message: 'No hay datos para actualizar' });
        }

        valores.push(id);
        const sql = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
        
        db.query(sql, valores, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// --- New Methods for Motorizado ---

exports.updateDisponibilidad = (id, disponible) => {
    return new Promise((resolve, reject) => {
        // Map boolean to 'activo'/'inactivo' or 1/0 depending on schema. 
        // For simplicity assuming we added a 'disponible' column (tinyint).
        // If not, we might reuse 'estado_cuenta' if appropriate, but better separate.
        // I will assume ALTER TABLE executed.
        const sql = 'UPDATE usuarios SET disponible = ? WHERE id = ?';
        db.query(sql, [disponible ? 1 : 0, id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

exports.updateUbicacion = (id, lat, lng) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE usuarios SET lat = ?, lng = ? WHERE id = ?';
        db.query(sql, [lat, lng, id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

exports.findAvailableMotorizado = () => {
    return new Promise((resolve, reject) => {
        // Simple assignment: pick first available
        const sql = 'SELECT * FROM usuarios WHERE rol = "motorizado" AND disponible = 1 LIMIT 1';
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

// --- Recuperación de Contraseña ---

exports.saveRecoveryCode = (userId, code, expires) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE usuarios SET recovery_code = ?, recovery_expires = ? WHERE id = ?';
        db.query(sql, [code, expires, userId], (err, result) => {
            if (err) return reject(err);
            console.log('💾 Código guardado en BD:', { userId, code, expires, updated: result.affectedRows });
            resolve(result);
        });
    });
};

exports.verifyRecoveryCode = (email, code) => {
    return new Promise((resolve, reject) => {
        // Busca usuario con ese email, código coincidente y que NO haya expirado
        const sql = 'SELECT * FROM usuarios WHERE correo = ? AND recovery_code = ? AND recovery_expires > NOW()';
        db.query(sql, [email, code], (err, results) => {
            if (err) return reject(err);
            
            console.log('🔎 Verificando código:', { 
                email, 
                codeReceived: code, 
                found: results.length > 0,
                user: results.length > 0 ? { 
                    codeInDB: results[0].recovery_code, 
                    expires: results[0].recovery_expires 
                } : null
            });
            
            resolve(results.length > 0); // True si encontró coincidencias
        });
    });
};

exports.updatePassword = (email, hash) => {
    return new Promise((resolve, reject) => {
        // Actualiza pass y limpia el código para que no se pueda reusar
        const sql = 'UPDATE usuarios SET password = ?, recovery_code = NULL, recovery_expires = NULL WHERE correo = ?';
        db.query(sql, [hash, email], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// RF-11: Obtener lista de motorizados (para reasignación)
exports.getMotorizados = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, nombre, telefono, placa, disponible, estado_cuenta 
            FROM usuarios 
            WHERE rol = 'motorizado' 
            ORDER BY nombre ASC
        `;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

exports.updateEstadoCuenta = (id, estado) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE usuarios SET estado_cuenta = ? WHERE id = ?';
        db.query(sql, [estado, id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Refresh token storage
exports.saveRefreshToken = (userId, token, expires) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)';
        db.query(sql, [token, userId, expires], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

exports.findRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM refresh_tokens WHERE token = ?';
        db.query(sql, [token], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

exports.deleteRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM refresh_tokens WHERE token = ?';
        db.query(sql, [token], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};
