
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');
const motorizadoController = require('../controllers/motorizadoController');

// RF-11: Listar todos los motorizados (Solo Admin)
router.get('/list', auth, verifyRole('administrador'), motorizadoController.listAll);

// RF-21: Obtener perfil del motorizado
router.get('/perfil', auth, motorizadoController.getPerfil);

// Actualizar disponibilidad
router.put('/disponibilidad', auth, motorizadoController.updateDisponibilidad);

// Actualizar ubicación
router.post('/actualizar', auth, motorizadoController.updateUbicacion); // UbicacionService calls /actualizar

// Cambiar estado (suspender/activar)
router.put('/estado', auth, verifyRole('administrador'), motorizadoController.updateEstado);

module.exports = router;
