
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
        (nombre, dni_ruc, telefono, direccion, correo, password, rol, placa, licencia, estado_cuenta, disponible, lat, lng) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', 1, NULL, NULL)`;

        db.query(sql, [
            user.nombre,
            user.dni_ruc,
            user.telefono,
            user.direccion,
            user.correo,
            user.password,
            user.rol || 'cliente',
            user.placa,
            user.licencia
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
