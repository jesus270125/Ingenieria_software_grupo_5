const Product = require("../models/productModel");
const Version = require("../models/versionModel");

// Crear producto
exports.create = async (req, res) => {
    try {
        const data = req.body;
        const result = await Product.createProduct(data);

        // Registrar cambio en la versión
        await Version.registrarCambio(
            "producto",
            result.insertId,
            `Creación de producto ${data.nombre}`,
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

        await Product.updateProduct(id, data);

        // Registrar cambio en la versión
        await Version.registrarCambio(
            "producto",
            id,
            `Actualización de producto ${data.nombre}`,
            req.user.email
        );

        res.json({ message: "Producto actualizado" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar producto" });
    }
};

