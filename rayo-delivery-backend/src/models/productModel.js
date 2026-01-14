
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
        INSERT INTO productos (local_id, nombre, descripcion, precio, imagen, estado)
        VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            data.local_id,
            data.nombre,
            data.descripcion,
            data.precio,
            data.imagen,
            data.estado || 'activo'
        ], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// Listar productos por local (Solo activos para clientes, o todos? Depende del uso. 
// Asumiremos que esta funcion es publica, asi que solo activos.
// Pero el Admin usa otra? El Admin usa listByLocal tambien?)
// Mejor: Dejamos select * y filtramos en controller o visualmente?
// Lo correcto: Publico -> Solo activos. Admin -> Todos.
// Crearé getProductsByLocalPublic y getProductsByLocalAdmin si es necesario.
// Por ahora, modifiquemos getProductsByLocal para devolver todo y el filtro se hace fuera o creamos uno nuevo.
// Mantenemos getProductsByLocal devolviendo TODO para el admin panel.
exports.getProductsByLocal = (localId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM productos WHERE local_id = ?`;
        db.query(sql, [localId], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Metodo nuevo para clientes (solo activos)
exports.getActiveProductsByLocal = (localId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM productos WHERE local_id = ? AND estado = 'activo'`;
        db.query(sql, [localId], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// RF-30: Obtener producto por ID (para versionado)
exports.getProductById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM productos WHERE id = ?`;
        db.query(sql, [id], (err, results) => {
            if (err) reject(err);
            else resolve(results && results.length ? results[0] : null);
        });
    });
};

exports.searchProducts = (term) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, l.nombre as local_nombre 
            FROM productos p
            JOIN locales l ON p.local_id = l.id
            WHERE p.nombre LIKE ? AND p.estado = 'activo'
        `;
        db.query(sql, [`%${term}%`], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Editar producto
exports.updateProduct = (id, data) => {
    return new Promise((resolve, reject) => {
        const sql = `
        UPDATE productos SET nombre=?, descripcion=?, precio=?, imagen=?, estado=?
        WHERE id = ?
        `;
        db.query(sql, [
            data.nombre,
            data.descripcion,
            data.precio,
            data.imagen,
            data.estado, // Pasaremos estado explicitamente
            id
        ], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

exports.deleteProduct = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM productos WHERE id = ?';
        db.query(sql, [id], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};
