const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token)
        return res.status(401).json({ error: 'Token no enviado' });

    const tokenLimpio = token.replace("Bearer ", "");

    jwt.verify(tokenLimpio, process.env.JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Token inválido' });

        req.user = user; // { id, rol }
        next();
    });
};
