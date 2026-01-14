const db = require('../config/db');

/**
 * Asigna automáticamente un motorizado a un pedido basado en disponibilidad y carga de trabajo.
 * Criterio: Motorizado activo con MENOS pedidos en curso (estado != 'entregado').
 * @param {number} pedidoId - ID del pedido a asignar
 * @returns {Promise<number|null>} - ID del motorizado asignado o null si no hay disponibles
 */
exports.asignarMotorizadoAutomaticamente = async (pedidoId) => {
    return new Promise((resolve, reject) => {
        // 1. Buscar motorizados activos, disponibles y contar sus pedidos pendientes
        const sql = `
            SELECT u.id, COUNT(p.id) as carga_trabajo
            FROM usuarios u
            LEFT JOIN pedidos p ON u.id = p.motorizado_id AND p.estado NOT IN ('entregado', 'cancelado')
            WHERE u.rol = 'motorizado' AND u.estado_cuenta = 'activo' AND u.disponible = 1
            GROUP BY u.id
            ORDER BY carga_trabajo ASC
            LIMIT 1;
        `;

        db.query(sql, (err, motorizados) => {
            if (err) return reject(err);

            if (motorizados.length === 0) {
                console.log("No hay motorizados disponibles para asignar.");
                return resolve(null);
            }

            const motorizadoElegido = motorizados[0].id;
            console.log(`Asignando pedido ${pedidoId} al motorizado ${motorizadoElegido} (Carga: ${motorizados[0].carga_trabajo})`);

            // 2. Actualizar el pedido
            const updateSql = `UPDATE pedidos SET motorizado_id = ?, estado = 'asignado' WHERE id = ?`;
            db.query(updateSql, [motorizadoElegido, pedidoId], (updateErr, result) => {
                if (updateErr) return reject(updateErr);
                resolve(motorizadoElegido);
            });
        });
    });
};
