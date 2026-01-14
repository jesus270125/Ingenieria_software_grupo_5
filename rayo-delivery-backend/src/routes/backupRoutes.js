const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const auth = require('../middlewares/auth');
const verifyRole = require('../middlewares/verifyRole');

// RF-27: Todas las rutas requieren autenticación de administrador
// Crear backup manual
router.post('/create', auth, verifyRole('administrador'), backupController.createBackup);

// Listar todos los backups
router.get('/list', auth, verifyRole('administrador'), backupController.listBackups);

// Restaurar desde un backup
router.post('/restore', auth, verifyRole('administrador'), backupController.restoreBackup);

// Descargar un backup
router.get('/download/:fileName', auth, verifyRole('administrador'), backupController.downloadBackup);

// Eliminar un backup
router.delete('/:fileName', auth, verifyRole('administrador'), backupController.deleteBackup);

// Limpiar backups antiguos
router.post('/clean', auth, verifyRole('administrador'), backupController.cleanOldBackups);

// Obtener historial de backups
router.get('/history', auth, verifyRole('administrador'), backupController.getHistory);

module.exports = router;
