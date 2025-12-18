const Local = require("../models/localModel");
const Version = require("../models/versionModel");

// Crear un local
exports.create = async (req, res) => {
    try {
        const data = req.body;
        const result = await Local.createLocal(data);

        // Registrar cambio en la versión
        await Version.registrarCambio(
            "local",
            result.insertId,
            `Creación de local ${data.nombre}`,
            req.user.email
        );

        res.json({ message: "Local creado", id: result.insertId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error al crear local" });
    }
};

// Listar locales
exports.list = async (req, res) => {
    try {
        const locales = await Local.getLocales();
        
        const horaActual = new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
        });

        const localesConEstado = locales.map(local => {
            const abierto =
                horaActual >= local.hora_apertura &&
                horaActual <= local.hora_cierre;

            return {
                ...local,
                estado: abierto ? "Abierto" : "Cerrado"
            };
        });

        res.json(localesConEstado);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener locales" });
    }
};

// Editar local
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        await Local.updateLocal(id, data);

        // Registrar cambio en la versión
        await Version.registrarCambio(
            "local",
            id,
            `Actualización de local ${data.nombre}`,
            req.user.email
        );

        res.json({ message: "Local actualizado" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar local" });
    }
};

// Obtener local por id (público)
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        const local = await Local.getLocalById(id);
        if (!local) return res.status(404).json({ error: 'Local no encontrado' });
        res.json(local);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener local' });
    }
};

