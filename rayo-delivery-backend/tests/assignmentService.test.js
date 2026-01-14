/**
 * TEST UNITARIO - RIESGO 2: Asignación Incorrecta de Repartidores
 * 
 * Este test valida que el sistema asigne correctamente motorizados a los pedidos
 * basándose en criterios de disponibilidad, estado de cuenta y carga de trabajo.
 * 
 * Escenarios cubiertos:
 * 1. Asignación a motorizado disponible con menor carga
 * 2. No asignar si no hay motorizados disponibles
 * 3. No asignar motorizados con estado_cuenta inactivo
 * 4. No asignar motorizados con disponible = 0
 * 5. Balanceo de carga entre múltiples motorizados
 * 6. Actualización correcta del estado del pedido
 * 7. Validación de rol de motorizado
 */

const assignmentService = require('../src/services/assignmentService');
const db = require('../src/config/db');

// Mock de la base de datos
jest.mock('../src/config/db');

describe('RIESGO 2: Asignación Incorrecta de Repartidores - assignmentService', () => {
  
  let mockQuery;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock de db.query
    mockQuery = jest.fn();
    db.query = mockQuery;
  });

  // ========================================================================
  // TEST 1: Asignación exitosa a motorizado con menor carga
  // ========================================================================
  describe('Asignación exitosa', () => {
    
    test('debe asignar pedido a motorizado disponible con menor carga', async () => {
      const pedidoId = 100;
      
      // Mock: Primera query devuelve motorizado con ID 5 y carga 2
      mockQuery.mockImplementationOnce((sql, callback) => {
        const motorizados = [
          { id: 5, carga_trabajo: 2 }
        ];
        callback(null, motorizados);
      });

      // Mock: Segunda query actualiza el pedido
      mockQuery.mockImplementationOnce((sql, params, callback) => {
        expect(params[0]).toBe(5); // motorizado_id
        expect(params[1]).toBe(100); // pedido_id
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(pedidoId);

      expect(resultado).toBe(5);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test('debe asignar al motorizado con menor carga cuando hay varios disponibles', async () => {
      const pedidoId = 101;
      
      // Mock: Devuelve el de menor carga (ordenado ASC)
      mockQuery.mockImplementationOnce((sql, callback) => {
        const motorizados = [
          { id: 3, carga_trabajo: 1 }, // Este debe ser asignado
        ];
        callback(null, motorizados);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(pedidoId);

      expect(resultado).toBe(3);
    });

    test('debe actualizar el estado del pedido a "asignado"', async () => {
      const pedidoId = 102;
      
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 7, carga_trabajo: 0 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        // Verificar que la query incluye estado = 'asignado'
        expect(sql).toContain("estado = 'asignado'");
        callback(null, { affectedRows: 1 });
      });

      await assignmentService.asignarMotorizadoAutomaticamente(pedidoId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  // ========================================================================
  // TEST 2: No hay motorizados disponibles
  // ========================================================================
  describe('Sin motorizados disponibles', () => {
    
    test('debe retornar null si no hay motorizados disponibles', async () => {
      const pedidoId = 103;
      
      // Mock: No hay motorizados
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, []); // Array vacío
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(pedidoId);

      expect(resultado).toBeNull();
      expect(mockQuery).toHaveBeenCalledTimes(1); // Solo la primera query
    });

    test('no debe actualizar el pedido si no hay motorizados', async () => {
      const pedidoId = 104;
      
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, []);
      });

      await assignmentService.asignarMotorizadoAutomaticamente(pedidoId);

      // Verificar que NO se llama la segunda query (UPDATE)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================================================
  // TEST 3: Filtros de disponibilidad
  // ========================================================================
  describe('Validación de criterios de disponibilidad', () => {
    
    test('la query debe filtrar solo motorizados con rol "motorizado"', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        expect(sql).toContain("rol = 'motorizado'");
        callback(null, []);
      });

      await assignmentService.asignarMotorizadoAutomaticamente(105);
    });

    test('la query debe filtrar solo motorizados con estado_cuenta "activo"', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        expect(sql).toContain("estado_cuenta = 'activo'");
        callback(null, []);
      });

      await assignmentService.asignarMotorizadoAutomaticamente(106);
    });

    test('la query debe filtrar solo motorizados con disponible = 1', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        expect(sql).toContain("disponible = 1");
        callback(null, []);
      });

      await assignmentService.asignarMotorizadoAutomaticamente(107);
    });

    test('la query debe excluir pedidos entregados y cancelados del conteo', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        expect(sql).toContain("NOT IN ('entregado', 'cancelado')");
        callback(null, []);
      });

      await assignmentService.asignarMotorizadoAutomaticamente(108);
    });

    test('la query debe ordenar por carga_trabajo ASC', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        expect(sql).toContain("ORDER BY carga_trabajo ASC");
        callback(null, []);
      });

      await assignmentService.asignarMotorizadoAutomaticamente(109);
    });

    test('la query debe limitar a 1 resultado', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        expect(sql).toContain("LIMIT 1");
        callback(null, []);
      });

      await assignmentService.asignarMotorizadoAutomaticamente(110);
    });
  });

  // ========================================================================
  // TEST 4: Balanceo de carga
  // ========================================================================
  describe('Balanceo de carga de trabajo', () => {
    
    test('debe priorizar motorizado sin pedidos asignados (carga 0)', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        const motorizados = [
          { id: 10, carga_trabajo: 0 } // Sin pedidos
        ];
        callback(null, motorizados);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(111);

      expect(resultado).toBe(10);
    });

    test('debe asignar correctamente cuando el motorizado tiene carga máxima', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        const motorizados = [
          { id: 11, carga_trabajo: 10 } // Mucha carga pero es el único disponible
        ];
        callback(null, motorizados);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(112);

      expect(resultado).toBe(11); // Igual debe asignarse
    });
  });

  // ========================================================================
  // TEST 5: Manejo de errores de base de datos
  // ========================================================================
  describe('Manejo de errores', () => {
    
    test('debe rechazar promesa si hay error en la consulta de motorizados', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(new Error('DB Connection Error'), null);
      });

      await expect(
        assignmentService.asignarMotorizadoAutomaticamente(113)
      ).rejects.toThrow('DB Connection Error');
    });

    test('debe rechazar promesa si hay error al actualizar el pedido', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 12, carga_trabajo: 1 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(new Error('Update Failed'), null);
      });

      await expect(
        assignmentService.asignarMotorizadoAutomaticamente(114)
      ).rejects.toThrow('Update Failed');
    });

    test('debe manejar respuesta inesperada de la base de datos', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, null); // Respuesta null inesperada
      });

      // Debe lanzar error al intentar acceder a .length
      await expect(
        assignmentService.asignarMotorizadoAutomaticamente(115)
      ).rejects.toThrow();
    });
  });

  // ========================================================================
  // TEST 6: Validación de parámetros
  // ========================================================================
  describe('Validación de parámetros', () => {
    
    test('debe usar el pedidoId correcto en la actualización', async () => {
      const pedidoId = 999;
      
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 13, carga_trabajo: 0 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        expect(params).toEqual([13, 999]); // [motorizado_id, pedido_id]
        callback(null, { affectedRows: 1 });
      });

      await assignmentService.asignarMotorizadoAutomaticamente(pedidoId);
    });
  });

  // ========================================================================
  // TEST 7: Consistencia de datos
  // ========================================================================
  describe('Consistencia de asignación', () => {
    
    test('debe asignar el motorizado_id retornado por la query', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 42, carga_trabajo: 3 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        expect(params[0]).toBe(42); // El ID debe coincidir
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(116);

      expect(resultado).toBe(42);
    });

    test('debe retornar el ID del motorizado asignado', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 100, carga_trabajo: 0 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(117);

      expect(typeof resultado).toBe('number');
      expect(resultado).toBe(100);
    });
  });

  // ========================================================================
  // TEST 8: Escenarios de carga real
  // ========================================================================
  describe('Escenarios de carga real', () => {
    
    test('debe funcionar con motorizado recién registrado (sin pedidos previos)', async () => {
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 50, carga_trabajo: 0 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(118);

      expect(resultado).toBe(50);
    });

    test('debe considerar solo pedidos NO entregados ni cancelados en el conteo', async () => {
      // Este test verifica que la query hace el JOIN correctamente
      mockQuery.mockImplementationOnce((sql, callback) => {
        // Simular que el motorizado tiene 2 pedidos en curso
        expect(sql).toContain("LEFT JOIN pedidos p ON");
        callback(null, [{ id: 51, carga_trabajo: 2 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      await assignmentService.asignarMotorizadoAutomaticamente(119);
    });
  });

  // ========================================================================
  // TEST 9: Casos extremos
  // ========================================================================
  describe('Casos extremos', () => {
    
    test('debe manejar múltiples motorizados con la misma carga', async () => {
      // Cuando hay empate, la BD retorna el primero (por LIMIT 1)
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 20, carga_trabajo: 5 }]); // El primero del empate
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const resultado = await assignmentService.asignarMotorizadoAutomaticamente(120);

      expect(resultado).toBe(20);
    });

    test('debe funcionar con ID de pedido muy grande', async () => {
      const pedidoIdGrande = 999999999;
      
      mockQuery.mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 30, carga_trabajo: 0 }]);
      });

      mockQuery.mockImplementationOnce((sql, params, callback) => {
        expect(params[1]).toBe(pedidoIdGrande);
        callback(null, { affectedRows: 1 });
      });

      await assignmentService.asignarMotorizadoAutomaticamente(pedidoIdGrande);
    });
  });
});
