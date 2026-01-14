const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// Todas las rutas requieren autenticación y rol de administrador
router.get('/ventas', auth, verifyRole('administrador'), reportesController.ventasPorPeriodo);
router.get('/pedidos-hora', auth, verifyRole('administrador'), reportesController.pedidosPorHora);
router.get('/motorizados', auth, verifyRole('administrador'), reportesController.rendimientoMotorizados);
router.get('/tiempos-entrega', auth, verifyRole('administrador'), reportesController.tiemposEntrega);
router.get('/resumen', auth, verifyRole('administrador'), reportesController.resumenGeneral);

module.exports = router;
