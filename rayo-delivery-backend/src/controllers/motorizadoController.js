
const User = require('../models/userModel');

exports.updateDisponibilidad = async (req, res) => {
    try {
        const userId = req.user.id;
        const { disponible } = req.body;

        // Assuming userModel has updateDisponibilidad or generic update
        // We will implement updateDisponibilidad in userModel next
        await User.updateDisponibilidad(userId, disponible);

        res.json({ message: 'Disponibilidad actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar disponibilidad' });
    }
};

exports.updateUbicacion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lat, lng } = req.body;

        await User.updateUbicacion(userId, lat, lng);

        res.json({ message: 'Ubicación actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar ubicación' });
    }
};
