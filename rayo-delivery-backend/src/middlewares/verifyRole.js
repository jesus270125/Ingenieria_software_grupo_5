module.exports = function(rolesPermitidos) {
    return (req, res, next) => {
        const rol = req.user.rol;

        if (!rolesPermitidos.includes(rol)) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        next();
    };
}
