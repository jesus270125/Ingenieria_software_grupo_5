const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const db = require('../config/db');
const util = require('util');

const execPromise = util.promisify(exec);

// Directorio donde se guardarán los backups
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Política de retención: mantener backups de los últimos N días
const RETENTION_DAYS = 30;

/**
 * Asegura que el directorio de backups existe
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Obtiene las credenciales de la base de datos desde las variables de entorno
 */
function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rayo_delivery',
    port: process.env.DB_PORT || 3306
  };
}

/**
 * Genera un nombre de archivo para el backup
 */
function generateBackupFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `backup_${year}${month}${day}_${hours}${minutes}${seconds}.sql`;
}

/**
 * Verifica si mysqldump está disponible en el sistema
 */
async function checkMysqldumpAvailable() {
  try {
    await execPromise('mysqldump --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Realiza el backup de la base de datos usando mysqldump
 * @param {string} tipo - 'manual' o 'automatico'
 * @returns {Promise<Object>} Información del backup creado
 */
async function createBackup(tipo = 'automatico') {
  try {
    // Verificar si mysqldump está disponible
    const mysqldumpAvailable = await checkMysqldumpAvailable();
    if (!mysqldumpAvailable) {
      const errorMsg = 'mysqldump no está disponible en el sistema. ' +
        'Instala MySQL/MariaDB y agrega el directorio bin al PATH del sistema. ' +
        'Ejemplo: C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin';
      console.warn('⚠️ ' + errorMsg);
      await logBackup(tipo, 'error_mysqldump', 0, errorMsg);
      throw new Error(errorMsg);
    }

    ensureBackupDirectory();
    
    const config = getDbConfig();
    const fileName = generateBackupFileName();
    const filePath = path.join(BACKUP_DIR, fileName);
    
    // Construir comando mysqldump
    // Se agregan opciones críticas para bases de datos en la nube (TiDB, RDS, etc.)
    let command = `mysqldump -h ${config.host} -P ${config.port} -u ${config.user}`;
    
    if (config.password) {
      command += ` -p"${config.password}"`;
    }

    // Si es remoto (nube), agregamos configuraciones de compatibilidad
    if (config.host !== 'localhost' && config.host !== '127.0.0.1') {
       command += ' --ssl-mode=REQUIRED';   // TiDB requiere conexión segura
       command += ' --set-gtid-purged=OFF'; // Evita error de permisos SUPER/GTID
       command += ' --column-statistics=0'; // Evita error en mysqldump 8+ con algunas nubes
    }

    command += ` ${config.database} > "${filePath}"`;
    
    console.log('Ejecutando backup de base de datos...');
    
    // Ejecutar mysqldump
    await execPromise(command);
    
    // Verificar que el archivo se creó
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo de backup no se creó correctamente');
    }
    
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    // Registrar en backup_logs
    await logBackup(tipo, fileName, sizeInMB, 'exitoso');
    
    console.log(`Backup creado exitosamente: ${fileName} (${sizeInMB} MB)`);
    
    return {
      success: true,
      fileName,
      filePath,
      size: sizeInMB,
      tipo,
      fecha: new Date()
    };
  } catch (error) {
    console.error('Error creando backup:', error);
    await logBackup(tipo, 'error', 0, `Error: ${error.message}`);
    throw error;
  }
}

/**
 * Registra el backup en la tabla backup_logs
 */
function logBackup(tipo, fileName, size, descripcion) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO backup_logs (tipo, descripcion) VALUES (?, ?)';
    const desc = `${descripcion} - Archivo: ${fileName} - Tamaño: ${size}MB`;
    
    db.query(sql, [tipo, desc], (err, result) => {
      if (err) {
        console.error('Error registrando backup en BD:', err);
        return reject(err);
      }
      resolve(result);
    });
  });
}

/**
 * Lista todos los backups disponibles
 * @returns {Promise<Array>} Lista de backups con información
 */
async function listBackups() {
  try {
    ensureBackupDirectory();
    
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = [];
    
    for (const file of files) {
      if (file.endsWith('.sql') || file.endsWith('.zip')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        backups.push({
          fileName: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          fecha: stats.mtime,
          path: filePath
        });
      }
    }
    
    // Ordenar por fecha descendente (más reciente primero)
    backups.sort((a, b) => b.fecha - a.fecha);
    
    return backups;
  } catch (error) {
    console.error('Error listando backups:', error);
    throw error;
  }
}

/**
 * Elimina backups antiguos según la política de retención
 * @returns {Promise<number>} Número de archivos eliminados
 */
async function cleanOldBackups() {
  try {
    ensureBackupDirectory();
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (RETENTION_DAYS * 24 * 60 * 60 * 1000));
    
    const files = fs.readdirSync(BACKUP_DIR);
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.sql') || file.endsWith('.zip')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Backup antiguo eliminado: ${file}`);
        }
      }
    }
    
    if (deletedCount > 0) {
      await logBackup('limpieza', 'limpieza', 0, `${deletedCount} backups antiguos eliminados`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error limpiando backups antiguos:', error);
    throw error;
  }
}

/**
 * Restaura la base de datos desde un archivo de backup
 * @param {string} fileName - Nombre del archivo de backup a restaurar
 * @returns {Promise<Object>} Resultado de la restauración
 */
async function restoreBackup(fileName) {
  try {
    const filePath = path.join(BACKUP_DIR, fileName);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error('Archivo de backup no encontrado');
    }
    
    const config = getDbConfig();
    
    // Construir comando mysql para restaurar
    let command = `mysql -h ${config.host} -P ${config.port} -u ${config.user}`;
    if (config.password) {
      command += ` -p"${config.password}"`;
    }
    command += ` ${config.database} < "${filePath}"`;
    
    console.log('Restaurando base de datos desde backup...');
    
    // Ejecutar restauración
    await execPromise(command);
    
    // Registrar en backup_logs
    await logBackup('restauracion', fileName, 0, 'Restauración exitosa');
    
    console.log(`Base de datos restaurada exitosamente desde: ${fileName}`);
    
    return {
      success: true,
      fileName,
      fecha: new Date()
    };
  } catch (error) {
    console.error('Error restaurando backup:', error);
    await logBackup('restauracion', fileName, 0, `Error: ${error.message}`);
    throw error;
  }
}

/**
 * Descarga un archivo de backup
 * @param {string} fileName - Nombre del archivo a descargar
 * @returns {string} Ruta completa del archivo
 */
function getBackupFilePath(fileName) {
  const filePath = path.join(BACKUP_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Archivo de backup no encontrado');
  }
  
  return filePath;
}

/**
 * Obtiene el historial de backups desde la BD
 * @returns {Promise<Array>} Historial de backups
 */
function getBackupHistory() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM backup_logs ORDER BY fecha DESC LIMIT 50';
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error obteniendo historial:', err);
        return reject(err);
      }
      resolve(results);
    });
  });
}

/**
 * Elimina un backup específico
 * @param {string} fileName - Nombre del archivo a eliminar
 */
async function deleteBackup(fileName) {
  try {
    const filePath = path.join(BACKUP_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Archivo de backup no encontrado');
    }
    
    fs.unlinkSync(filePath);
    await logBackup('eliminacion', fileName, 0, 'Backup eliminado manualmente');
    
    return { success: true, message: 'Backup eliminado correctamente' };
  } catch (error) {
    console.error('Error eliminando backup:', error);
    throw error;
  }
}

module.exports = {
  createBackup,
  listBackups,
  cleanOldBackups,
  restoreBackup,
  getBackupFilePath,
  getBackupHistory,
  deleteBackup,
  BACKUP_DIR
};
