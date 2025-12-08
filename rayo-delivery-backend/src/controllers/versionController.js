const Version = require("../models/versionModel");

exports.list = async (req, res) => {
    try {
        const versiones = await Version.listar();
        res.json(versiones);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener versiones" });
    }
};
