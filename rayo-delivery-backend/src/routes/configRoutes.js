const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// Obtener todas las configuraciones (Admin)
router.get('/', auth, verifyRole('administrador'), configController.getAll);

// Obtener configuración por clave (Admin)
router.get('/:clave', auth, verifyRole('administrador'), configController.getByKey);

// Actualizar una configuración (Admin)
router.put('/:clave', auth, verifyRole('administrador'), configController.update);

// Actualizar múltiples configuraciones (Admin)
router.put('/', auth, verifyRole('administrador'), configController.updateMultiple);

module.exports = router;
