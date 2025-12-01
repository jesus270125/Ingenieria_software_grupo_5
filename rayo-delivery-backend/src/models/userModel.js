const db = require('../config/db');

exports.createUser = (data, callback) => {
    const sql = `
        INSERT INTO usuarios 
        (nombre, dni_ruc, telefono, direccion, correo, password, rol, foto, placa, licencia) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [
        data.nombre, data.dni_ruc, data.telefono, data.direccion, data.correo,
        data.password, data.rol, data.foto, data.placa, data.licencia
    ], callback);
};

exports.findByEmail = (email, callback) => {
    db.query(`SELECT * FROM usuarios WHERE correo = ?`, [email], callback);
};
