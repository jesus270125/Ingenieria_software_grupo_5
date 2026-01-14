const backupService = require('../services/backupService');
const path = require('path');

/**
 * RF-27: Crear backup manual
 * POST /api/backup/create
 */
exports.createBackup = async (req, res) => {
  try {
    const result = await backupService.createBackup('manual');
    
    res.json({
      success: true,
      message: 'Backup creado exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error en createBackup:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear backup',
      details: error.message
    });
  }
};

/**
 * RF-27: Listar todos los backups disponibles
 * GET /api/backup/list
 */
exports.listBackups = async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    res.json({
      success: true,
      data: backups,
      count: backups.length
    });
  } catch (error) {
    console.error('Error en listBackups:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar backups',
      details: error.message
    });
  }
};

/**
 * RF-27: Restaurar desde un backup
 * POST /api/backup/restore
 * Body: { fileName: 'backup_20260111_123456.sql' }
 */
exports.restoreBackup = async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del archivo es requerido'
      });
    }
    
    const result = await backupService.restoreBackup(fileName);
    
    res.json({
      success: true,
      message: 'Base de datos restaurada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error en restoreBackup:', error);
    res.status(500).json({
      success: false,
      error: 'Error al restaurar backup',
      details: error.message
    });
  }
};

/**
 * RF-27: Descargar un archivo de backup
 * GET /api/backup/download/:fileName
 */
exports.downloadBackup = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del archivo es requerido'
      });
    }
    
    const filePath = backupService.getBackupFilePath(fileName);
    
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error descargando archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error al descargar el archivo'
          });
        }
      }
    });
  } catch (error) {
    console.error('Error en downloadBackup:', error);
    res.status(500).json({
      success: false,
      error: 'Error al descargar backup',
      details: error.message
    });
  }
};

/**
 * RF-27: Eliminar un backup específico
 * DELETE /api/backup/:fileName
 */
exports.deleteBackup = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del archivo es requerido'
      });
    }
    
    const result = await backupService.deleteBackup(fileName);
    
    res.json({
      success: true,
      message: 'Backup eliminado correctamente',
      data: result
    });
  } catch (error) {
    console.error('Error en deleteBackup:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar backup',
      details: error.message
    });
  }
};

/**
 * RF-27: Limpiar backups antiguos según política de retención
 * POST /api/backup/clean
 */
exports.cleanOldBackups = async (req, res) => {
  try {
    const deletedCount = await backupService.cleanOldBackups();
    
    res.json({
      success: true,
      message: `${deletedCount} backups antiguos eliminados`,
      deletedCount
    });
  } catch (error) {
    console.error('Error en cleanOldBackups:', error);
    res.status(500).json({
      success: false,
      error: 'Error al limpiar backups antiguos',
      details: error.message
    });
  }
};

/**
 * RF-27: Obtener historial de backups desde la BD
 * GET /api/backup/history
 */
exports.getHistory = async (req, res) => {
  try {
    const history = await backupService.getBackupHistory();
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error en getHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de backups',
      details: error.message
    });
  }
};
