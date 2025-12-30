const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// Ruta exclusiva para CLIENTES
router.get('/cliente', auth, verifyRole(['cliente']), (req, res) => {
    res.json({ message: "Bienvenido cliente" });
});

// Ruta exclusiva para MOTORIZADOS
router.get('/motorizado', auth, verifyRole(['motorizado']), (req, res) => {
    res.json({ message: "Bienvenido motorizado" });
});

// Ruta exclusiva para ADMINISTRADORES
router.get('/admin', auth, verifyRole(['administrador']), (req, res) => {
    res.json({ message: "Bienvenido admin" });
});

module.exports = router;
