/**
 * RIESGO 5: Inconsistencia de datos en la base de datos
 * 
 * Escenarios de prueba:
 * 1. Transacciones: Asegurar atomicidad en operaciones críticas
 * 2. Integridad referencial: Validar relaciones FK entre tablas
 * 3. Validación de datos: Prevenir datos inconsistentes
 * 4. Concurrencia: Manejar actualizaciones simultáneas
 * 5. Rollback: Revertir operaciones fallidas
 */

const db = require('../src/config/db');
const orderModel = require('../src/models/orderModel');
const pedidoModel = require('../src/models/pedidoModel');
const assignmentService = require('../src/services/assignmentService');

// Mock de la base de datos
jest.mock('../src/config/db');

describe('RIESGO 5: Inconsistencia de datos - Transacciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe crear pedido con transacción (commit exitoso)', async () => {
    const mockConnection = {
      beginTransaction: jest.fn((cb) => cb(null)),
      query: jest.fn((sql, params, cb) => {
        if (sql.includes('INSERT INTO pedidos')) {
          cb(null, { insertId: 100 });
        } else if (sql.includes('INSERT INTO detalle_pedidos')) {
          cb(null, { affectedRows: 2 });
        }
      }),
      commit: jest.fn((cb) => cb(null)),
      rollback: jest.fn((cb) => cb())
    };

    db.beginTransaction = mockConnection.beginTransaction;
    db.query = mockConnection.query;
    db.commit = mockConnection.commit;
    db.rollback = mockConnection.rollback;

    const orderData = {
      usuario_id: 1,
      subtotal: 50,
      envio: 5,
      total: 55,
      direccion: 'Av. Test 123',
      metodo_pago: 'Efectivo',
      latitude: -12.0464,
      longitude: -77.0428
    };

    const items = [
      { product: { id: 1, nombre: 'Pollo', precio: 25 }, quantity: 2 }
    ];

    const pedidoId = await orderModel.createOrder(orderData, items);

    expect(pedidoId).toBe(100);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
  });

  test('debe hacer rollback si falla la inserción de detalles', async () => {
    const mockConnection = {
      beginTransaction: jest.fn((cb) => cb(null)),
      query: jest.fn((sql, params, cb) => {
        if (sql.includes('INSERT INTO pedidos')) {
          cb(null, { insertId: 100 });
        } else if (sql.includes('INSERT INTO detalle_pedidos')) {
          cb(new Error('Error en detalle_pedidos'));
        }
      }),
      commit: jest.fn((cb) => cb(null)),
      rollback: jest.fn((cb) => cb())
    };

    db.beginTransaction = mockConnection.beginTransaction;
    db.query = mockConnection.query;
    db.commit = mockConnection.commit;
    db.rollback = mockConnection.rollback;

    const orderData = {
      usuario_id: 1,
      subtotal: 50,
      envio: 5,
      total: 55,
      direccion: 'Av. Test 123',
      metodo_pago: 'Efectivo',
      latitude: -12.0464,
      longitude: -77.0428
    };

    const items = [
      { product: { id: 999, nombre: 'Producto Inválido', precio: 25 }, quantity: 2 }
    ];

    await expect(orderModel.createOrder(orderData, items)).rejects.toThrow('Error en detalle_pedidos');

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.commit).not.toHaveBeenCalled();
  });

  test('debe hacer rollback si falla beginTransaction', async () => {
    const mockConnection = {
      beginTransaction: jest.fn((cb) => cb(new Error('Error iniciando transacción'))),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn((cb) => cb())
    };

    db.beginTransaction = mockConnection.beginTransaction;
    db.query = mockConnection.query;
    db.commit = mockConnection.commit;
    db.rollback = mockConnection.rollback;

    const orderData = {
      usuario_id: 1,
      subtotal: 50,
      envio: 5,
      total: 55,
      direccion: 'Av. Test 123',
      metodo_pago: 'Efectivo'
    };

    const items = [
      { product: { id: 1, nombre: 'Pollo', precio: 25 }, quantity: 2 }
    ];

    await expect(orderModel.createOrder(orderData, items)).rejects.toThrow('Error iniciando transacción');

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.query).not.toHaveBeenCalled();
    expect(mockConnection.rollback).toHaveBeenCalled();
  });
});

describe('RIESGO 5: Inconsistencia de datos - Integridad Referencial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe validar que usuario_id existe antes de crear pedido', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('INSERT INTO pedidos')) {
        // Simular error de FK constraint
        cb({ code: 'ER_NO_REFERENCED_ROW_2', sqlMessage: 'Foreign key constraint fails' });
      }
    });

    const pedidoData = {
      usuario_id: 9999, // ID inexistente
      subtotal: 50,
      envio: 5,
      total: 55,
      direccion: 'Av. Test 123',
      metodo_pago: 'Efectivo',
      estado: 'registrado'
    };

    await expect(pedidoModel.createPedido(pedidoData)).rejects.toMatchObject({
      code: 'ER_NO_REFERENCED_ROW_2'
    });
  });

  test('debe validar que motorizado_id existe antes de asignar', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT estado FROM pedidos')) {
        cb(null, [{ estado: 'registrado' }]);
      } else if (sql.includes('UPDATE pedidos SET motorizado_id')) {
        cb({ code: 'ER_NO_REFERENCED_ROW_2', sqlMessage: 'Foreign key constraint fails' });
      }
    });

    await expect(pedidoModel.assignMotorizado(100, 9999)).rejects.toMatchObject({
      code: 'ER_NO_REFERENCED_ROW_2'
    });
  });

  test('debe validar que producto_id existe antes de insertar detalles', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('INSERT INTO detalle_pedidos')) {
        cb({ code: 'ER_NO_REFERENCED_ROW_2', sqlMessage: 'Cannot add or update a child row' });
      }
    });

    const detalles = [
      { producto_id: 9999, nombre: 'Producto Fantasma', cantidad: 1, precio_unitario: 10 }
    ];

    await expect(pedidoModel.createDetalles(100, detalles)).rejects.toMatchObject({
      code: 'ER_NO_REFERENCED_ROW_2'
    });
  });

  test('debe permitir pedido sin motorizado (null FK válido)', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('INSERT INTO pedidos')) {
        cb(null, { insertId: 200 });
      } else if (sql.includes('INSERT INTO historial_estados_pedido')) {
        cb(null, { affectedRows: 1 });
      }
    });

    const pedidoData = {
      usuario_id: 1,
      subtotal: 50,
      envio: 5,
      total: 55,
      direccion: 'Av. Test 123',
      metodo_pago: 'Efectivo',
      motorizado_id: null, // FK NULL válido
      estado: 'registrado'
    };

    const pedidoId = await pedidoModel.createPedido(pedidoData);

    expect(pedidoId).toBe(200);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pedidos'),
      expect.arrayContaining([null]), // motorizado_id null
      expect.any(Function)
    );
  });
});

describe('RIESGO 5: Inconsistencia de datos - Validación de Datos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe prevenir subtotal negativo', async () => {
    db.query = jest.fn((sql, params, cb) => {
      const subtotal = params[1];
      if (subtotal < 0) {
        cb({ code: 'ER_CHECK_CONSTRAINT_VIOLATED', sqlMessage: 'Check constraint failed' });
      }
    });

    const pedidoData = {
      usuario_id: 1,
      subtotal: -50, // Valor inválido
      envio: 5,
      total: -45,
      direccion: 'Av. Test 123',
      metodo_pago: 'Efectivo'
    };

    await expect(pedidoModel.createPedido(pedidoData)).rejects.toMatchObject({
      code: 'ER_CHECK_CONSTRAINT_VIOLATED'
    });
  });

  test('debe prevenir cantidad de productos negativa o cero', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('INSERT INTO detalle_pedidos')) {
        const values = params[0];
        const cantidad = values[0][3]; // cantidad está en posición 3
        if (cantidad <= 0) {
          cb({ code: 'ER_CHECK_CONSTRAINT_VIOLATED', sqlMessage: 'Cantidad debe ser positiva' });
        }
      }
    });

    const detalles = [
      { producto_id: 1, nombre: 'Pollo', cantidad: 0, precio_unitario: 25 }
    ];

    await expect(pedidoModel.createDetalles(100, detalles)).rejects.toMatchObject({
      code: 'ER_CHECK_CONSTRAINT_VIOLATED'
    });
  });

  test('debe validar estados permitidos en pedidos', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT estado FROM pedidos')) {
        cb(null, [{ estado: 'registrado' }]);
      } else if (sql.includes('UPDATE pedidos SET estado')) {
        const estado = params[0];
        const estadosValidos = ['registrado', 'asignado', 'en_preparacion', 'en_camino_restaurante', 'en_camino_cliente', 'entregado', 'cancelado'];
        if (!estadosValidos.includes(estado)) {
          cb({ code: 'ER_CHECK_CONSTRAINT_VIOLATED', sqlMessage: 'Estado no permitido' });
        }
      }
    });

    await expect(pedidoModel.updateEstado(100, 'estado_invalido')).rejects.toMatchObject({
      code: 'ER_CHECK_CONSTRAINT_VIOLATED'
    });
  });

  test('debe validar formato de dirección (no vacía)', async () => {
    db.query = jest.fn((sql, params, cb) => {
      const direccion = params[4];
      if (!direccion || direccion.trim() === '') {
        cb({ code: 'ER_NO_DEFAULT_FOR_FIELD', sqlMessage: 'Dirección requerida' });
      }
    });

    const pedidoData = {
      usuario_id: 1,
      subtotal: 50,
      envio: 5,
      total: 55,
      direccion: '', // Vacía
      metodo_pago: 'Efectivo'
    };

    await expect(pedidoModel.createPedido(pedidoData)).rejects.toMatchObject({
      code: 'ER_NO_DEFAULT_FOR_FIELD'
    });
  });
});

describe('RIESGO 5: Inconsistencia de datos - Concurrencia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe manejar asignación concurrente de motorizado al mismo pedido', async () => {
    let callCount = 0;
    
    // Mock completo de db.query
    const originalQuery = db.query;
    db.query = jest.fn((sql, params, cb) => {
      // Verificar si params es función (sin parámetros, callback como segundo arg)
      const callback = typeof params === 'function' ? params : cb;
      
      if (sql.includes('SELECT u.id, COUNT')) {
        callback(null, [{ id: 5, carga_trabajo: 2 }]);
      } else if (sql.includes('UPDATE pedidos SET motorizado_id')) {
        callCount++;
        if (callCount === 1) {
          callback(null, { affectedRows: 1 });
        } else {
          callback(null, { affectedRows: 0 });
        }
      }
    });

    const motorizado1 = await assignmentService.asignarMotorizadoAutomaticamente(100);
    expect(motorizado1).toBe(5);

    const motorizado2 = await assignmentService.asignarMotorizadoAutomaticamente(100);
    expect(motorizado2).toBe(5);
    
    db.query = originalQuery;
  });

  test('debe prevenir doble confirmación de entrega', async () => {
    let confirmacionCount = 0;
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT id, codigo_entrega, estado')) {
        confirmacionCount++;
        if (confirmacionCount === 1) {
          // Primera validación: pedido en_camino_cliente
          cb(null, [{ id: 100, codigo_entrega: '123456', estado: 'en_camino_cliente' }]);
        } else {
          // Segunda validación: pedido ya entregado
          cb(null, [{ id: 100, codigo_entrega: '123456', estado: 'entregado' }]);
        }
      } else if (sql.includes('UPDATE pedidos') && sql.includes('fecha_entrega')) {
        cb(null, { affectedRows: 1 });
      } else if (sql.includes('INSERT INTO historial_estados_pedido')) {
        cb(null, { affectedRows: 1 });
      }
    });

    // Primera confirmación
    const resultado1 = await pedidoModel.confirmarEntrega(100, '123456');
    expect(resultado1.success).toBe(true);

    // Segunda confirmación (concurrente o duplicada)
    await expect(pedidoModel.confirmarEntrega(100, '123456')).rejects.toThrow('Este pedido ya fue entregado');
  });

  test('debe manejar actualización simultánea de carga_trabajo de motorizado', async () => {
    let queryCount = 0;

    const originalQuery = db.query;
    db.query = jest.fn((sql, params, cb) => {
      const callback = typeof params === 'function' ? params : cb;
      
      if (sql.includes('SELECT u.id, COUNT')) {
        queryCount++;
        callback(null, [{ id: 5, carga_trabajo: 2 }]);
      } else if (sql.includes('UPDATE pedidos SET motorizado_id')) {
        callback(null, { affectedRows: 1 });
      }
    });

    const motorizado1 = await assignmentService.asignarMotorizadoAutomaticamente(100);
    const motorizado2 = await assignmentService.asignarMotorizadoAutomaticamente(101);

    expect(motorizado1).toBe(5);
    expect(motorizado2).toBe(5);
    expect(queryCount).toBe(2);
    
    db.query = originalQuery;
  });
});

describe('RIESGO 5: Inconsistencia de datos - Historial de Estados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe registrar historial aunque falle (no bloquear operación principal)', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT estado FROM pedidos')) {
        cb(null, [{ estado: 'asignado' }]);
      } else if (sql.includes('UPDATE pedidos SET estado')) {
        cb(null, { affectedRows: 1 });
      } else if (sql.includes('INSERT INTO historial_estados_pedido')) {
        // Fallo en el historial (no debe revertir actualización principal)
        cb(new Error('Error en historial_estados_pedido'));
      }
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const resultado = await pedidoModel.updateEstado(100, 'en_preparacion');

    expect(resultado).toBeDefined(); // La operación principal no falló
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error registrando historial'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  test('debe registrar estado_anterior correctamente en historial', async () => {
    let historialParams = null;

    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT estado FROM pedidos')) {
        cb(null, [{ estado: 'asignado' }]);
      } else if (sql.includes('UPDATE pedidos SET estado')) {
        cb(null, { affectedRows: 1, codigo_entrega: null });
      } else if (sql.includes('INSERT INTO historial_estados_pedido')) {
        historialParams = params;
        cb(null, { affectedRows: 1 });
      }
    });

    await pedidoModel.updateEstado(100, 'en_preparacion', 'Iniciando preparación');

    expect(historialParams).toEqual([
      100,              // pedido_id
      'asignado',       // estado_anterior
      'en_preparacion', // estado_nuevo
      'Iniciando preparación' // observaciones
    ]);
  });

  test('debe generar observación con código de entrega cuando aplica', async () => {
    let historialParams = null;

    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT estado FROM pedidos')) {
        cb(null, [{ estado: 'en_camino_restaurante' }]);
      } else if (sql.includes('UPDATE pedidos SET estado')) {
        cb(null, { affectedRows: 1, codigo_entrega: '123456' });
      } else if (sql.includes('INSERT INTO historial_estados_pedido')) {
        historialParams = params;
        cb(null, { affectedRows: 1 });
      }
    });

    await pedidoModel.updateEstado(100, 'en_camino_cliente', 'Saliendo a entrega');

    expect(historialParams[3]).toContain('Código de entrega generado');
    expect(historialParams[3]).toContain('Saliendo a entrega');
  });
});

describe('RIESGO 5: Inconsistencia de datos - Validación de Relaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe obtener detalles vacíos si no hay productos asociados', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT * FROM pedidos WHERE id')) {
        cb(null, [{ id: 100, usuario_id: 1, total: 55 }]);
      } else if (sql.includes('SELECT * FROM detalle_pedidos')) {
        cb(null, []); // Sin detalles
      } else if (sql.includes('SELECT nombre, direccion, telefono FROM usuarios')) {
        cb(null, [{ nombre: 'Juan', direccion: 'Av. Test 123', telefono: '987654321' }]);
      }
    });

    const pedido = await pedidoModel.getPedidoById(100);

    expect(pedido).toBeDefined();
    expect(pedido.detalles).toEqual([]);
    expect(pedido.items).toEqual([]);
  });

  test('debe manejar producto sin local asociado (FK null)', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT * FROM pedidos WHERE id')) {
        cb(null, [{ id: 100, usuario_id: 1, total: 55 }]);
      } else if (sql.includes('SELECT * FROM detalle_pedidos')) {
        cb(null, [{ producto_id: 1, nombre: 'Pollo', cantidad: 2, precio_unitario: 25, total: 50 }]);
      } else if (sql.includes('SELECT nombre, direccion, telefono FROM usuarios')) {
        cb(null, [{ nombre: 'Juan', direccion: 'Av. Test 123', telefono: '987654321' }]);
      } else if (sql.includes('SELECT l.nombre, l.direccion FROM productos')) {
        // Producto sin local asociado
        cb(null, []);
      }
    });

    const pedido = await pedidoModel.getPedidoById(100);

    expect(pedido.restaurante).toBe('Restaurante'); // Valor por defecto
    expect(pedido.direccion_restaurante).toBe('Sin dirección');
  });

  test('debe manejar error en consulta de usuario (datos parciales)', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('SELECT * FROM pedidos WHERE id')) {
        cb(null, [{ id: 100, usuario_id: 1, direccion: 'Av. Pedido 456', total: 55 }]);
      } else if (sql.includes('SELECT * FROM detalle_pedidos')) {
        cb(null, [{ producto_id: 1, nombre: 'Pollo', cantidad: 2, precio_unitario: 25, total: 50 }]);
      } else if (sql.includes('SELECT nombre, direccion, telefono FROM usuarios')) {
        // Usuario no encontrado o error
        cb(new Error('Usuario eliminado'));
      }
    });

    await expect(pedidoModel.getPedidoById(100)).rejects.toThrow('Usuario eliminado');
  });

  test('debe crear detalle sin producto_id (producto eliminado, solo nombre)', async () => {
    db.query = jest.fn((sql, params, cb) => {
      if (sql.includes('INSERT INTO detalle_pedidos')) {
        cb(null, { affectedRows: 1 });
      }
    });

    const detalles = [
      { producto_id: null, nombre: 'Producto Histórico', cantidad: 1, precio_unitario: 15 }
    ];

    const resultado = await pedidoModel.createDetalles(100, detalles);

    expect(resultado).toBeDefined();
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO detalle_pedidos'),
      [[[100, null, 'Producto Histórico', 1, 15, 15]]], // Array de arrays de valores
      expect.any(Function)
    );
  });
});
