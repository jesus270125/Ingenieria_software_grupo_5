const db = require('../config/db');

// Obtener estadísticas generales del dashboard
const getStats = async (req, res) => {
  try {
    // Pedidos de hoy
    const [pedidosHoy] = await db.promise().query(
      'SELECT COUNT(*) as count FROM pedidos WHERE DATE(created_at) = CURDATE()'
    );

    // Total de pedidos
    const [pedidosTotal] = await db.promise().query('SELECT COUNT(*) as count FROM pedidos');

    // Ventas de hoy
    const [ventasHoy] = await db.promise().query(
      'SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE DATE(created_at) = CURDATE() AND estado NOT IN ("cancelado")'
    );

    // Ventas del mes
    const [ventasMes] = await db.promise().query(
      'SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND estado NOT IN ("cancelado")'
    );

    // Motorizados activos (usuarios con rol motorizado y estado activo)
    const [motorizadosActivos] = await db.promise().query(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol = "motorizado" AND estado_cuenta = "activo"'
    );

    // Total motorizados
    const [motorizadosTotal] = await db.promise().query(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol = "motorizado"'
    );

    // Clientes nuevos (últimos 7 días)
    const [clientesNuevos] = await db.promise().query(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol = "cliente" AND fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
    );

    // Total clientes
    const [clientesTotal] = await db.promise().query(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol = "cliente"'
    );

    // Estados de pedidos
    const [pedidosPendientes] = await db.promise().query(
      'SELECT COUNT(*) as count FROM pedidos WHERE estado = "pendiente"'
    );

    const [pedidosEnCurso] = await db.promise().query(
      'SELECT COUNT(*) as count FROM pedidos WHERE estado IN ("en_camino", "recogido", "asignado")'
    );

    const [pedidosCompletados] = await db.promise().query(
      'SELECT COUNT(*) as count FROM pedidos WHERE estado = "entregado"'
    );

    const [pedidosCancelados] = await db.promise().query(
      'SELECT COUNT(*) as count FROM pedidos WHERE estado = "cancelado"'
    );

    res.json({
      pedidosHoy: pedidosHoy[0].count,
      pedidosTotal: pedidosTotal[0].count,
      ventasHoy: parseFloat(ventasHoy[0].total),
      ventasMes: parseFloat(ventasMes[0].total),
      motorizadosActivos: motorizadosActivos[0].count,
      motorizadosTotal: motorizadosTotal[0].count,
      clientesNuevos: clientesNuevos[0].count,
      clientesTotal: clientesTotal[0].count,
      pedidosPendientes: pedidosPendientes[0].count,
      pedidosEnCurso: pedidosEnCurso[0].count,
      pedidosCompletados: pedidosCompletados[0].count,
      pedidosCancelados: pedidosCancelados[0].count
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Tendencia de pedidos por días
const getPedidosTendencia = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;

    const [rows] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(DATE(created_at), '%d/%m') as fecha,
        COUNT(*) as cantidad
      FROM pedidos
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(DATE(created_at), '%d/%m')
      ORDER BY fecha ASC
    `, [dias]);

    res.json({
      labels: rows.map(r => r.fecha),
      data: rows.map(r => r.cantidad)
    });
  } catch (error) {
    console.error('Error al obtener tendencia de pedidos:', error);
    res.status(500).json({ error: 'Error al obtener tendencia de pedidos' });
  }
};

// Tendencia de ventas por días
const getVentasTendencia = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;

    const [rows] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(DATE(created_at), '%d/%m') as fecha,
        COALESCE(SUM(total), 0) as total
      FROM pedidos
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND estado NOT IN ('cancelado')
      GROUP BY DATE_FORMAT(DATE(created_at), '%d/%m')
      ORDER BY fecha ASC
    `, [dias]);

    res.json({
      labels: rows.map(r => r.fecha),
      data: rows.map(r => parseFloat(r.total))
    });
  } catch (error) {
    console.error('Error al obtener tendencia de ventas:', error);
    res.status(500).json({ error: 'Error al obtener tendencia de ventas' });
  }
};

// Top productos más vendidos
const getTopProductos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const [rows] = await db.promise().query(`
      SELECT 
        p.id as id,
        p.nombre,
        COUNT(dp.id) as cantidad,
        SUM(dp.total) as total
      FROM detalle_pedidos dp
      JOIN productos p ON dp.producto_id = p.id
      JOIN pedidos ped ON dp.pedido_id = ped.id
      WHERE ped.estado NOT IN ('cancelado')
        AND ped.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id, p.nombre
      ORDER BY cantidad DESC
      LIMIT ?
    `, [limit]);

    res.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      cantidad: r.cantidad,
      total: parseFloat(r.total || 0)
    })));
  } catch (error) {
    console.error('Error al obtener top productos:', error);
    res.status(500).json({ error: 'Error al obtener top productos' });
  }
};

// Top locales con más pedidos
const getTopLocales = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const [rows] = await db.promise().query(`
      SELECT 
        l.id as id,
        l.nombre,
        COUNT(DISTINCT ped.id) as cantidad,
        SUM(ped.total) as total
      FROM pedidos ped
      JOIN detalle_pedidos dp ON ped.id = dp.pedido_id
      JOIN productos p ON dp.producto_id = p.id
      JOIN locales l ON p.local_id = l.id
      WHERE ped.estado NOT IN ('cancelado')
        AND ped.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY l.id, l.nombre
      ORDER BY cantidad DESC
      LIMIT ?
    `, [limit]);

    res.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      cantidad: r.cantidad,
      total: parseFloat(r.total || 0)
    })));
  } catch (error) {
    console.error('Error al obtener top locales:', error);
    res.status(500).json({ error: 'Error al obtener top locales' });
  }
};

// Actividad reciente
const getActividadReciente = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [rows] = await db.promise().query(`
      SELECT 
        id,
        'pedido' as tipo,
        CONCAT('Pedido #', id, ' - ', estado) as descripcion,
        DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as fecha,
        estado
      FROM pedidos
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    res.status(500).json({ error: 'Error al obtener actividad reciente' });
  }
};

// Estados de pedidos para gráfica
const getEstadosPedidos = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        CASE 
          WHEN estado = 'pendiente' THEN 'Pendientes'
          WHEN estado IN ('en_camino', 'recogido', 'asignado') THEN 'En Curso'
          WHEN estado = 'entregado' THEN 'Completados'
          WHEN estado = 'cancelado' THEN 'Cancelados'
        END as estado,
        COUNT(*) as cantidad
      FROM pedidos
      GROUP BY CASE 
        WHEN estado = 'pendiente' THEN 'Pendientes'
        WHEN estado IN ('en_camino', 'recogido', 'asignado') THEN 'En Curso'
        WHEN estado = 'entregado' THEN 'Completados'
        WHEN estado = 'cancelado' THEN 'Cancelados'
      END
    `);

    res.json({
      labels: rows.map(r => r.estado),
      data: rows.map(r => r.cantidad)
    });
  } catch (error) {
    console.error('Error al obtener estados de pedidos:', error);
    res.status(500).json({ error: 'Error al obtener estados de pedidos' });
  }
};

module.exports = {
  getStats,
  getPedidosTendencia,
  getVentasTendencia,
  getTopProductos,
  getTopLocales,
  getActividadReciente,
  getEstadosPedidos
};
