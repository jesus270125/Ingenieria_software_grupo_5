const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Estadísticas generales
router.get('/stats', dashboardController.getStats);

// Tendencias
router.get('/pedidos-tendencia', dashboardController.getPedidosTendencia);
router.get('/ventas-tendencia', dashboardController.getVentasTendencia);

// Rankings
router.get('/top-productos', dashboardController.getTopProductos);
router.get('/top-locales', dashboardController.getTopLocales);

// Actividad
router.get('/actividad', dashboardController.getActividadReciente);

// Estados
router.get('/estados-pedidos', dashboardController.getEstadosPedidos);

module.exports = router;
