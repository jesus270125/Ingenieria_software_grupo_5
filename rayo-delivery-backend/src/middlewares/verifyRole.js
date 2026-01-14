module.exports = function(rolesPermitidos) {
    // Normalize input: allow a single role string or an array of roles
    const allowed = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

    return (req, res, next) => {
        const rolRaw = req.user && (req.user.rol || req.user.role || req.user.roles);
        const rol = (rolRaw || '') + '';

        // Compare case-insensitive and trimmed
        const rolNorm = rol.toLowerCase().trim();

        const allowedNorm = allowed.map(r => (r || '') + '').map(r => r.toLowerCase().trim());

        if (!allowedNorm.includes(rolNorm)) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        next();
    };
}
