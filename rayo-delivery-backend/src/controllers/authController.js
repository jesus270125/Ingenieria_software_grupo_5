
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../models/userModel');

const multer = require('multer');
const path = require('path');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

exports.uploadMiddleware = upload.single('foto'); // middleware para usar en la ruta

exports.registerUser = async (req, res) => {
    // Si se subió un archivo, req.file tendrá la info.
    // Los campos de texto vienen en req.body
    const { nombre, dni_ruc, telefono, direccion, correo, password, rol, placa, licencia } = req.body;
    const foto = req.file ? req.file.filename : null;

    // 1. Validaciones Generales (RF-01)
    if (!nombre || !dni_ruc || !telefono || !direccion || !correo || !password || !rol) {
        return res.status(400).json({ error: "Faltan datos obligatorios (nombre, dni, telefono, direccion, correo, pass, rol)" });
    }

    // 2. Validaciones Específicas para Motorizado (RF-01, Criterio: validar documentación y placa)
    if (rol === 'motorizado') {
        if (!placa || !licencia) {
            return res.status(400).json({ error: "Motorizados deben registrar Placa y Licencia obligatoriamente." });
        }
        // Foto es opcional en la BD según esquema, pero el requerimiento dice "foto para motorizados".
        // Podemos hacerlo obligatorio si se desea:
        // if (!foto) return res.status(400).json({ error: "Motorizados deben subir una foto." });
    }

    try {
        const existingUser = await userModel.findByEmail(correo);
        if (existingUser)
            return res.status(400).json({ error: "El correo ya está registrado" });

        // Encriptar contraseña
        const hash = await bcrypt.hash(password, 10);

        const data = {
            nombre, dni_ruc, telefono, direccion, correo,
            password: hash, rol, foto, placa, licencia
        };

        await userModel.createUser(data);
        return res.json({ message: "Usuario registrado correctamente" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.login = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password)
        return res.status(400).json({ error: "Correo y contraseña son obligatorios" });

    try {
        const user = await userModel.findByEmail(correo);
        if (!user)
            return res.status(404).json({ error: "Usuario no encontrado" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok)
            return res.status(400).json({ error: "Contraseña incorrecta" });

        // Generar access token (corto) y refresh token (largo)
        const token = jwt.sign(
            { id: user.id, rol: user.rol, nombre: user.nombre, email: user.correo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '7d' }
        );

        // Refresh token: random string stored en DB
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const refreshExpiry = new Date(Date.now() + (process.env.REFRESH_TOKEN_DAYS ? parseInt(process.env.REFRESH_TOKEN_DAYS) : 30) * 24 * 60 * 60 * 1000);
        await userModel.saveRefreshToken(user.id, refreshToken, refreshExpiry);

        return res.json({
            message: "Login correcto",
            token,
            refreshToken,
            rol: user.rol,
            usuario: {
                id: user.id,
                rol: user.rol,
                nombre: user.nombre,
                correo: user.correo,
                disponible: user.disponible || 0
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};



const nodemailer = require('nodemailer');

exports.sendRecoveryCode = async (req, res) => {
    const { correo } = req.body;

    try {
        const genericMessage = 'Si existe una cuenta asociada, se ha enviado un correo con instrucciones.';

        const user = await userModel.findByEmail(correo);
        if (!user) {
            // No revelar existencia de usuarios: responder genérico
            return res.json({ message: genericMessage });
        }

        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        // Expiración en 15 minutos
        const expiracion = new Date(Date.now() + 15 * 60000);

        // Guardar código en BD
        try {
            await userModel.saveRecoveryCode(user.id, codigo, expiracion);
        } catch (saveErr) {
            console.error('❌ Error al guardar código:', saveErr);
            return res.status(500).json({ error: "Error al guardar código" });
        }

        // Modo desarrollo: mostrar código en consola
        console.log('═══════════════════════════════════════════════════');
        console.log(`🔐 CÓDIGO DE RECUPERACIÓN para ${correo}`);
        console.log(`📧 Código: ${codigo}`);
        console.log(`⏰ Expira: ${expiracion.toLocaleString()}`);
        console.log('═══════════════════════════════════════════════════');

        // Configurar Transporter según el servicio
        let transporter;
        let mailConfig;

        if (process.env.SMTP_SERVICE === 'ethereal') {
            // Ethereal Email - Testing (crea cuenta temporal automáticamente)
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('📧 Usando Ethereal Email (testing)');
        } else if (process.env.SMTP_HOST) {
            // SMTP personalizado (SendGrid, Mailgun, etc.)
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            console.log(`📧 Usando SMTP personalizado: ${process.env.SMTP_HOST}`);
        } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            // Gmail u otro servicio con credenciales
            transporter = nodemailer.createTransport({
                service: process.env.SMTP_SERVICE || 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            console.log(`📧 Usando servicio: ${process.env.SMTP_SERVICE || 'gmail'}`);
        } else {
            // Sin configuración SMTP - solo mostrar en consola
            console.warn('⚠️  SMTP no configurado - Código solo en consola');
            return res.json({ message: genericMessage });
        }

        try {
            const info = await transporter.sendMail({
                from: `"Soporte Rayo Delivery" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rayodelivery.com'}>`,
                to: correo,
                subject: "Código de recuperación - Rayo Delivery",
                text: `Tu código de recuperación es: ${codigo}. Expira en 15 minutos.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">Recuperación de Contraseña</h2>
                        <p>Tu código de recuperación es:</p>
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #7c3aed;">
                            ${codigo}
                        </div>
                        <p style="color: #666; margin-top: 20px;">Este código expira en 15 minutos.</p>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">Si no solicitaste este código, ignora este correo.</p>
                    </div>
                `
            });
            
            console.log('✅ Correo enviado exitosamente');
            
            // Si es Ethereal, mostrar URL de previsualización
            if (process.env.SMTP_SERVICE === 'ethereal') {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                console.log('🌐 Ver correo en: ' + previewUrl);
                console.log('   (Abre esta URL en tu navegador para ver el correo)');
            }
        } catch (sendErr) {
            console.error('❌ Error al enviar correo:', sendErr.message);
            console.log('💡 Usa el código mostrado en la consola');
            // No revelar detalles al cliente, pero seguimos devolviendo éxito
        }

        return res.json({ message: genericMessage });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al enviar el correo" });
    }
};

exports.resetPassword = async (req, res) => {
    const { correo, codigo, nuevaPassword } = req.body;

    console.log('🔍 Reset password intento:', { correo, codigo: codigo?.substring(0, 3) + '***', hasPassword: !!nuevaPassword });

    if (!codigo || !nuevaPassword) {
        return res.status(400).json({ error: "Faltan datos (código o nueva contraseña)" });
    }

    if (!correo) {
        return res.status(400).json({ error: "Falta el correo electrónico" });
    }

    try {
        // Verificar código
        const isValid = await userModel.verifyRecoveryCode(correo, codigo);
        console.log('✅ Código válido:', isValid);
        
        if (!isValid) {
            return res.status(400).json({ error: "Código inválido o expirado" });
        }

        // Si es válido, actualizar password
        const hash = await bcrypt.hash(nuevaPassword, 10);
        await userModel.updatePassword(correo, hash);

        console.log('🎉 Contraseña actualizada para:', correo);
        return res.json({ message: "Contraseña actualizada correctamente" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken requerido' });

    try {
        const tokenRow = await userModel.findRefreshToken(refreshToken);
        if (!tokenRow) return res.status(403).json({ error: 'Refresh token inválido' });

        const expiresAt = new Date(tokenRow.expires_at);
        if (expiresAt < new Date()) {
            await userModel.deleteRefreshToken(refreshToken);
            return res.status(403).json({ error: 'Refresh token expirado' });
        }

        const user = await userModel.findById(tokenRow.user_id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const newToken = jwt.sign(
            { id: user.id, rol: user.rol, nombre: user.nombre, email: user.correo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '7d' }
        );

        return res.json({ token: newToken });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
};

// Logout: eliminar refresh token
exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken requerido' });

    try {
        await userModel.deleteRefreshToken(refreshToken);
        return res.json({ message: 'Sesión cerrada' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // viene del middleware auth
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // No devolver el password
        delete user.password;
        delete user.recovery_code;
        delete user.code_expires_at;

        return res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
};

// Actualizar perfil del usuario autenticado
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, telefono, direccion } = req.body;

        const datosActualizar = {};
        if (nombre !== undefined) datosActualizar.nombre = nombre;
        if (telefono !== undefined) datosActualizar.telefono = telefono;
        if (direccion !== undefined) datosActualizar.direccion = direccion;

        if (Object.keys(datosActualizar).length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        await userModel.updateUser(userId, datosActualizar);
        return res.json({ message: 'Perfil actualizado correctamente' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
};
