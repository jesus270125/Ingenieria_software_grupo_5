const express = require('express');
const router = express.Router();
const PromocionController = require('../controllers/promocionController');
const authMiddleware = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// Rutas públicas/cliente (requieren autenticación)
router.get('/activas', authMiddleware, PromocionController.getActivas);
router.post('/validar', authMiddleware, PromocionController.validarCodigo);

// Rutas admin
router.post('/', authMiddleware, verifyRole(['administrador']), PromocionController.crear);
router.get('/', authMiddleware, verifyRole(['administrador']), PromocionController.getAll);
router.get('/estadisticas', authMiddleware, verifyRole(['administrador']), PromocionController.getEstadisticas);
router.get('/:id', authMiddleware, verifyRole(['administrador']), PromocionController.getById);
router.put('/:id', authMiddleware, verifyRole(['administrador']), PromocionController.update);
router.patch('/:id/estado', authMiddleware, verifyRole(['administrador']), PromocionController.cambiarEstado);
router.delete('/:id', authMiddleware, verifyRole(['administrador']), PromocionController.delete);

module.exports = router;
