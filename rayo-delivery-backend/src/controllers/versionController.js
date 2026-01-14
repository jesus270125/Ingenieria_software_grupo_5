const Version = require("../models/versionModel");

exports.list = async (req, res) => {
    try {
        const versiones = await Version.listar();
        res.json(versiones);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener versiones" });
    }
};

// RF-30: Revertir a una versión anterior
exports.revertir = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'ID de versión requerido' });
        }

        // Obtener la versión para verificar
        const version = await Version.obtenerPorId(id);
        if (!version) {
            return res.status(404).json({ error: 'Versión no encontrada' });
        }

        // Realizar la reversión
        await Version.revertir(id);

        // Registrar la acción de reversión
        const datosNuevos = version.datos_anteriores ? JSON.parse(version.datos_anteriores) : null;
        const datosAnteriores = version.datos_nuevos ? JSON.parse(version.datos_nuevos) : null;
        
        await Version.registrarCambio(
            version.tipo,
            version.referencia_id,
            'REVERSION',
            `Reversión a versión anterior (ID: ${id})`,
            datosAnteriores,
            datosNuevos,
            req.user.email
        );

        res.json({ 
            success: true, 
            message: 'Versión revertida correctamente',
            tipo: version.tipo,
            referencia_id: version.referencia_id
        });
    } catch (err) {
        console.error('Error al revertir versión:', err);
        res.status(500).json({ 
            error: err.message || "Error al revertir versión" 
        });
    }
};
