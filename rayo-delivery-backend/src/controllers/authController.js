
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

exports.registerUser = (req, res) => {
    const { nombre, dni_ruc, telefono, direccion, correo, password, rol, foto, placa, licencia } = req.body;

    if (!correo || !password || !rol)
        return res.status(400).json({ error: "Faltan datos obligatorios" });

    userModel.findByEmail(correo, (err, results) => {
        if (results.length > 0)
            return res.status(400).json({ error: "El correo ya está registrado" });

        // Encriptar contraseña
        bcrypt.hash(password, 10, (err, hash) => {
            const data = {
                nombre, dni_ruc, telefono, direccion, correo,
                password: hash, rol, foto, placa, licencia
            };

            userModel.createUser(data, (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Error en BD" });
                }
                return res.json({ message: "Usuario registrado correctamente" });
            });
        });
    });
};
exports.login = (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password)
        return res.status(400).json({ error: "Correo y contraseña son obligatorios" });

    userModel.findByEmail(correo, (err, results) => {
        if (results.length === 0)
            return res.status(404).json({ error: "Usuario no encontrado" });

        const user = results[0];

        bcrypt.compare(password, user.password, (err, ok) => {
            if (!ok)
                return res.status(400).json({ error: "Contraseña incorrecta" });

            // Generar token
            const token = jwt.sign(
                { id: user.id, rol: user.rol },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.json({
                message: "Login correcto",
                token,
                rol: user.rol,
                nombre: user.nombre
            });
        });
    });
};

const nodemailer = require('nodemailer');

exports.sendRecoveryCode = async (req, res) => {
    const { correo } = req.body;

    userModel.findByEmail(correo, async (err, results) => {
        if (results.length === 0)
            return res.status(404).json({ error: "Correo no encontrado" });

        // Generar código
        const codigo = Math.floor(100000 + Math.random() * 900000);

        // Enviar correo
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "tuCorreo@gmail.com",
                pass: "tuClave"
            }
        });

        await transporter.sendMail({
            from: "Soporte Rayo Delivery",
            to: correo,
            subject: "Código de recuperación",
            text: `Tu código es: ${codigo}`
        });

        return res.json({ message: "Código enviado", codigo });
    });
};
exports.resetPassword = (req, res) => {
    const { correo, nuevaPassword } = req.body;

    bcrypt.hash(nuevaPassword, 10, (err, hash) => {
        const sql = `UPDATE usuarios SET password=? WHERE correo=?`;
        db.query(sql, [hash, correo], (err, result) => {
            if (err) return res.status(500).json({ error: "Error en BD" });

            return res.json({ message: "Contraseña actualizada" });
        });
    });
};
