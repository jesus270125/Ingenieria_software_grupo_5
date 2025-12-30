
// Listar todos los productos
exports.getAllProducts = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM productos`;
        db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
const db = require("../config/db");

// Crear producto
exports.createProduct = (data) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO productos (local_id, nombre, descripcion, precio, imagen)
        VALUES (?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            data.local_id,
            data.nombre,
            data.descripcion,
            data.precio,
            data.imagen
        ], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// Listar productos por local
exports.getProductsByLocal = (localId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM productos WHERE local_id = ?`;
        db.query(sql, [localId], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Editar producto
exports.updateProduct = (id, data) => {
    return new Promise((resolve, reject) => {
        const sql = `
        UPDATE productos SET nombre=?, descripcion=?, precio=?, imagen=?
        WHERE id = ?
        `;
        db.query(sql, [
            data.nombre,
            data.descripcion,
            data.precio,
            data.imagen,
            id
        ], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};
