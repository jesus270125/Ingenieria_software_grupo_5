const db = require("../config/db");

exports.createLocal = (data) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO locales (nombre, direccion, categoria, imagen, hora_apertura, hora_cierre)
        VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            data.nombre,
            data.direccion,
            data.categoria,
            data.imagen,
            data.hora_apertura,
            data.hora_cierre
        ], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

exports.getLocales = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM locales`;
        db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

exports.getLocalById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM locales WHERE id = ?`;
        db.query(sql, [id], (err, results) => {
            if (err) reject(err);
            else resolve(results && results.length ? results[0] : null);
        });
    });
};

exports.updateLocal = (id, data) => {
    return new Promise((resolve, reject) => {
        const sql = `
        UPDATE locales
        SET nombre=?, direccion=?, categoria=?, imagen=?, hora_apertura=?, hora_cierre=?
        WHERE id=?
        `;
        db.query(sql, [
            data.nombre,
            data.direccion,
            data.categoria,
            data.imagen,
            data.hora_apertura,
            data.hora_cierre,
            id
        ], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};
