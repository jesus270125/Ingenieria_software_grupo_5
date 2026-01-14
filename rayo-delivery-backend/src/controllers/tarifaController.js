const tarifaService = require('../services/tarifaService');

/**
 * POST /api/tarifas/calcular
 * Calcula la tarifa de envío basada en coordenadas origen y destino
 * RF-19: Gestión de tarifas y costos de envío
 */
exports.calcularTarifa = async (req, res) => {
  try {
    const { latOrigen, lonOrigen, latDestino, lonDestino } = req.body;
    
    // Validar que vengan todas las coordenadas
    if (!latOrigen || !lonOrigen || !latDestino || !lonDestino) {
      return res.status(400).json({ 
        error: 'Se requieren latOrigen, lonOrigen, latDestino y lonDestino' 
      });
    }
    
    const resultado = await tarifaService.calcularTarifaEnvio(
      parseFloat(latOrigen),
      parseFloat(lonOrigen),
      parseFloat(latDestino),
      parseFloat(lonDestino)
    );
    
    res.json(resultado);
  } catch (error) {
    console.error('Error en calcularTarifa:', error);
    res.status(500).json({ error: 'Error calculando tarifa de envío' });
  }
};

/**
 * GET /api/tarifas/configuracion
 * Obtiene la configuración actual de tarifas
 */
exports.getConfiguracion = async (req, res) => {
  try {
    const config = await tarifaService.obtenerConfiguracionTarifas();
    res.json(config);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error obteniendo configuración de tarifas' });
  }
};
