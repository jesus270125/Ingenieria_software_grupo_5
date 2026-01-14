const express = require('express');
const router = express.Router();
const tarifaController = require('../controllers/tarifaController');
const verifyToken = require('../middlewares/auth');

// POST /api/tarifas/calcular - Calcular tarifa de envío
router.post('/calcular', verifyToken, tarifaController.calcularTarifa);

// GET /api/tarifas/configuracion - Obtener configuración
router.get('/configuracion', verifyToken, tarifaController.getConfiguracion);

module.exports = router;
