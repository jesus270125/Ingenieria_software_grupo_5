const db = require('../config/db');

/**
 * Calcula la distancia en km entre dos coordenadas usando fórmula de Haversine
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Obtiene la configuración de tarifas desde la BD
 */
function obtenerConfiguracionTarifas() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT clave, valor FROM configuracion 
       WHERE clave IN ('tarifa_base_envio', 'tarifa_por_km', 'radio_entrega_km', 'lat_local_principal', 'lon_local_principal')`,
      (err, rows) => {
        if (err) return reject(err);
        
        const config = {};
        rows.forEach(row => {
          config[row.clave] = row.valor;
        });
        
        resolve({
          tarifaBase: parseFloat(config.tarifa_base_envio) || 5.00,
          tarifaPorKm: parseFloat(config.tarifa_por_km) || 1.50,
          radioEntrega: parseFloat(config.radio_entrega_km) || 10.0,
          latLocal: parseFloat(config.lat_local_principal) || -13.6336,
          lonLocal: parseFloat(config.lon_local_principal) || -72.8814
        });
      }
    );
  });
}

/**
 * Calcula la tarifa de envío según la distancia
 * RF-19: Tarifa fija dentro del radio, incremento por km fuera del radio
 */
async function calcularTarifaEnvio(latOrigen, lonOrigen, latDestino, lonDestino) {
  try {
    // Obtener configuración
    const { tarifaBase, tarifaPorKm, radioEntrega } = await obtenerConfiguracionTarifas();
    
    // Calcular distancia
    const distancia = calcularDistancia(latOrigen, lonOrigen, latDestino, lonDestino);
    
    let tarifa = tarifaBase;
    let detalles = {
      distancia: distancia.toFixed(2),
      tarifaBase,
      radioEntrega,
      tarifaPorKm,
      kmExtra: 0,
      cargoExtra: 0
    };
    
    // Si excede el radio, cobrar por km adicional
    if (distancia > radioEntrega) {
      const kmExtra = distancia - radioEntrega;
      const cargoExtra = kmExtra * tarifaPorKm;
      tarifa = tarifaBase + cargoExtra;
      
      detalles.kmExtra = kmExtra.toFixed(2);
      detalles.cargoExtra = cargoExtra.toFixed(2);
    }
    
    return {
      tarifa: parseFloat(tarifa.toFixed(2)),
      distanciaKm: parseFloat(distancia.toFixed(2)),
      detalles
    };
  } catch (error) {
    console.error('Error calculando tarifa:', error);
    throw error;
  }
}

/**
 * Calcula tarifa desde el local principal hasta coordenadas del cliente
 */
async function calcularTarifaDesdeLocal(latCliente, lonCliente) {
  const { latLocal, lonLocal } = await obtenerConfiguracionTarifas();
  return await calcularTarifaEnvio(latLocal, lonLocal, latCliente, lonCliente);
}

module.exports = {
  calcularTarifaEnvio,
  calcularTarifaDesdeLocal,
  calcularDistancia,
  obtenerConfiguracionTarifas
};
