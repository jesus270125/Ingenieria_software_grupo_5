
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const motorizadoController = require('../controllers/motorizadoController');

// Actualizar disponibilidad
router.put('/disponibilidad', auth, motorizadoController.updateDisponibilidad);

// Actualizar ubicación
router.post('/actualizar', auth, motorizadoController.updateUbicacion); // UbicacionService calls /actualizar

module.exports = router;
