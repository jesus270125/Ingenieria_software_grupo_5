const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');
const evaluacionController = require('../controllers/evaluacionController');

// RF-22: Crear evaluación (Solo Cliente)
router.post('/', auth, verifyRole('cliente'), evaluacionController.create);

// RF-22: Obtener mis evaluaciones (Cliente)
router.get('/mis-evaluaciones', auth, verifyRole('cliente'), evaluacionController.getMisEvaluaciones);

// RF-22: Verificar si puede evaluar un pedido
router.get('/puede-evaluar/:pedidoId', auth, evaluacionController.puedeEvaluar);

// RF-22: Obtener evaluaciones de un motorizado
router.get('/motorizado/:id', auth, evaluacionController.getByMotorizado);

// RF-22: Obtener todas las evaluaciones (Solo Admin)
router.get('/', auth, verifyRole('administrador'), evaluacionController.getAll);

// RF-22: Responder evaluación (Solo Admin)
router.put('/:id/responder', auth, verifyRole('administrador'), evaluacionController.responder);

module.exports = router;
