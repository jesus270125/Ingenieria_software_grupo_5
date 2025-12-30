const db = require("../config/db");

exports.registrarCambio = (tipo, referenciaId, descripcion, usuario) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO catalogo_versiones (tipo, referencia_id, descripcion, usuario)
        VALUES (?, ?, ?, ?)
        `;
        db.query(sql, [tipo, referenciaId, descripcion, usuario], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

exports.listar = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM catalogo_versiones ORDER BY fecha DESC`;
        db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
