const Product = require("../models/productModel");
const Version = require("../models/versionModel");
const multer = require('multer');
const path = require('path');

// Configuración de Multer para productos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
exports.uploadMiddleware = upload.single('imagen');

// Listar todos los productos
exports.listAll = async (req, res) => {
    try {
        const products = await Product.getAllProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener productos" });
    }
};

// Crear producto
exports.create = async (req, res) => {
    try {
        const data = req.body;

        if (req.file) {
            data.imagen = req.file.filename;
        }

        const result = await Product.createProduct(data);

        // RF-30: Registrar cambio con snapshot completo
        const datosNuevos = {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precio: data.precio,
            imagen: data.imagen || null,
            local_id: data.local_id
        };

        await Version.registrarCambio(
            "producto",
            result.insertId,
            "CREACION",
            `Creación de producto ${data.nombre}`,
            null, // No hay datos anteriores en creación
            datosNuevos,
            req.user.email
        );

        res.json({ message: "Producto creado", id: result.insertId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error al crear producto" });
    }
};

// Listar productos por local
exports.listByLocal = async (req, res) => {
    try {
        const localId = req.params.localId;
        const products = await Product.getProductsByLocal(localId);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener productos" });
    }
};

// Editar producto
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        // RF-30: Obtener datos anteriores antes de actualizar
        const productoAnterior = await Product.getProductById(id);
        if (!productoAnterior) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const datosAnteriores = {
            nombre: productoAnterior.nombre,
            descripcion: productoAnterior.descripcion,
            precio: productoAnterior.precio,
            imagen: productoAnterior.imagen
        };

        if (req.file) {
            data.imagen = req.file.filename;
        }

        await Product.updateProduct(id, data);

        // RF-30: Registrar cambio con snapshots
        const datosNuevos = {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precio: data.precio,
            imagen: data.imagen || productoAnterior.imagen
        };

        await Version.registrarCambio(
            "producto",
            id,
            "EDICION",
            `Actualización de producto ${data.nombre}`,
            datosAnteriores,
            datosNuevos,
            req.user.email
        );

        res.json({ message: "Producto actualizado" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar producto" });
    }
};

// Eliminar producto
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        
        // RF-30: Obtener datos antes de eliminar
        const productoAnterior = await Product.getProductById(id);
        if (!productoAnterior) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const datosAnteriores = {
            nombre: productoAnterior.nombre,
            descripcion: productoAnterior.descripcion,
            precio: productoAnterior.precio,
            imagen: productoAnterior.imagen
        };

        await Product.deleteProduct(id);

        // RF-30: Registrar cambio con snapshot
        await Version.registrarCambio(
            "producto",
            id,
            "ELIMINACION",
            `Eliminación de producto ${productoAnterior.nombre}`,
            datosAnteriores,
            null, // No hay datos nuevos en eliminación
            req.user.email
        );

        res.json({ message: "Producto eliminado" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar producto" });
    }
};

// Público: Listar solo activos
exports.listByLocalPublic = async (req, res) => {
    try {
        const localId = req.params.localId;
        const products = await Product.getActiveProductsByLocal(localId);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener productos" });
    }
};

// Búsqueda de productos
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]); // Si no hay query, devuelve vacio

        const products = await Product.searchProducts(q);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en la búsqueda" });
    }
};

