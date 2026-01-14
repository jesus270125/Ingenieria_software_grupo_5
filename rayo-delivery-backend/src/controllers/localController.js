const Local = require("../models/localModel");
const Version = require("../models/versionModel");

const multer = require('multer');
const path = require('path');

// Configuración de Multer para locales
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'local-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
exports.uploadMiddleware = upload.single('imagen');

// Crear un local
exports.create = async (req, res) => {
    try {
        const data = req.body;
        // Si se subió imagen, usar su nombre
        if (req.file) {
            data.imagen = req.file.filename;
        }

        const result = await Local.createLocal(data);

        // RF-30: Registrar cambio con snapshot completo
        const datosNuevos = {
            nombre: data.nombre,
            direccion: data.direccion,
            categoria: data.categoria,
            imagen: data.imagen || null,
            hora_apertura: data.hora_apertura,
            hora_cierre: data.hora_cierre
        };

        await Version.registrarCambio(
            "local",
            result.insertId,
            "CREACION",
            `Creación de local ${data.nombre}`,
            null, // No hay datos anteriores en creación
            datosNuevos,
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

        // RF-30: Obtener datos anteriores antes de actualizar
        const localAnterior = await Local.getLocalById(id);
        if (!localAnterior) {
            return res.status(404).json({ error: 'Local no encontrado' });
        }

        const datosAnteriores = {
            nombre: localAnterior.nombre,
            direccion: localAnterior.direccion,
            categoria: localAnterior.categoria,
            imagen: localAnterior.imagen,
            hora_apertura: localAnterior.hora_apertura,
            hora_cierre: localAnterior.hora_cierre
        };

        // Si se sube un archivo nuevo, actualizar imagen
        if (req.file) {
            data.imagen = req.file.filename;
        } else if (data.imagen_actual) {
            // Si no se sube archivo pero viene imagen_actual, preservarla
            data.imagen = data.imagen_actual;
            delete data.imagen_actual;
        } else {
            // Si no hay archivo ni imagen_actual, conservar la imagen anterior
            data.imagen = localAnterior.imagen;
        }

        await Local.updateLocal(id, data);

        // RF-30: Registrar cambio con snapshots
        const datosNuevos = {
            nombre: data.nombre,
            direccion: data.direccion,
            categoria: data.categoria,
            imagen: data.imagen,
            hora_apertura: data.hora_apertura,
            hora_cierre: data.hora_cierre
        };

        await Version.registrarCambio(
            "local",
            id,
            "EDICION",
            `Actualización de local ${data.nombre}`,
            datosAnteriores,
            datosNuevos,
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

