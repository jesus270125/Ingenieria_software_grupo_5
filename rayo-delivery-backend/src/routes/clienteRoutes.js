const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// Todas las rutas requieren autenticación y rol de administrador
router.get('/', auth, verifyRole('administrador'), clienteController.listClientes);
router.get('/:id', auth, verifyRole('administrador'), clienteController.getCliente);
router.patch('/:id/estado', auth, verifyRole('administrador'), clienteController.updateEstado);
router.get('/:id/estadisticas', auth, verifyRole('administrador'), clienteController.getEstadisticas);

module.exports = router;
