const Search = require("../models/searchModel");

exports.buscar = async (req, res) => {
    try {
        const { nombre, categoria } = req.query;
        const results = await Search.searchProducts(nombre, categoria);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en la búsqueda" });
    }
};
