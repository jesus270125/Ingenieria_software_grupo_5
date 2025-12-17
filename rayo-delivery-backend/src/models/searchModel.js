const db = require("../config/db");

// Buscar productos por nombre o categoría
exports.searchProducts = (nombre, categoria) => {
    return new Promise((resolve, reject) => {

        let sql = `SELECT * FROM productos WHERE 1=1`;
        const params = [];

        if (nombre) {
            sql += " AND nombre LIKE ?";
            params.push(`%${nombre}%`);
        }

        if (categoria) {
            sql += " AND categoria = ?";
            params.push(categoria);
        }

        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
