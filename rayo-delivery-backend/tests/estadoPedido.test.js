/**
 * TEST UNITARIO - RIESGO 3: Falta de Seguimiento del Estado del Pedido
 * 
 * Este test valida que el sistema mantenga un seguimiento correcto de los estados
 * de los pedidos con historial completo y transiciones válidas.
 * 
 * Escenarios cubiertos:
 * 1. Actualización correcta de estados
 * 2. Registro en historial de estados (RF-14)
 * 3. Generación de código de entrega (RF-15)
 * 4. Validación de código de entrega
 * 5. Confirmación de entrega con código
 * 6. Transiciones de estado válidas
 * 7. Obtención de historial completo
 * 8. Validación de permisos por rol
 */

const pedidoController = require('../src/controllers/pedidoController');
const Pedido = require('../src/models/pedidoModel');

// Mocks
jest.mock('../src/models/pedidoModel');

describe('RIESGO 3: Falta de Seguimiento del Estado del Pedido', () => {
  
  let req, res, mockIo;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock de Socket.IO
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    // Mock de request básico
    req = {
      user: { id: 5, rol: 'motorizado' },
      params: { id: '100' },
      body: { estado: 'en_camino_cliente' },
      app: {
        get: jest.fn().mockReturnValue(mockIo)
      }
    };

    // Mock de response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  // ========================================================================
  // TEST 1: Actualización de estados
  // ========================================================================
  describe('Actualización de estados - pedidoController.updateEstadoPedido', () => {
    
    test('debe actualizar el estado del pedido correctamente', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'asignado'
      });

      Pedido.updateEstado.mockResolvedValue({
        affectedRows: 1,
        codigo_entrega: null
      });

      await pedidoController.updateEstadoPedido(req, res);

      expect(Pedido.updateEstado).toHaveBeenCalledWith('100', 'en_camino_cliente');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado actualizado',
        codigo_entrega: null
      });
    });

    test('debe rechazar si el pedido no existe', async () => {
      Pedido.getPedidoById.mockResolvedValue(null);

      await pedidoController.updateEstadoPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Pedido no encontrado' });
    });

    test('debe rechazar si el motorizado no es el asignado', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 99, // Diferente al usuario actual
        estado: 'asignado'
      });

      await pedidoController.updateEstadoPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autorizado para modificar este pedido'
      });
    });

    test('debe permitir a admin actualizar cualquier pedido', async () => {
      req.user.rol = 'admin';
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 99, // Diferente al admin
        estado: 'asignado'
      });

      Pedido.updateEstado.mockResolvedValue({
        affectedRows: 1,
        codigo_entrega: null
      });

      await pedidoController.updateEstadoPedido(req, res);

      expect(Pedido.updateEstado).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Estado actualizado'
      }));
    });

    test('debe emitir evento Socket.IO al actualizar estado', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'asignado'
      });

      Pedido.updateEstado.mockResolvedValue({
        affectedRows: 1,
        codigo_entrega: null
      });

      await pedidoController.updateEstadoPedido(req, res);

      expect(mockIo.to).toHaveBeenCalledWith('pedido_100');
      expect(mockIo.emit).toHaveBeenCalledWith('pedido:estado_actualizado', 
        expect.objectContaining({
          pedidoId: '100',
          estado: 'en_camino_cliente'
        })
      );
    });
  });

  // ========================================================================
  // TEST 2: Generación de código de entrega (RF-15)
  // ========================================================================
  describe('Generación de código de entrega', () => {
    
    test('debe retornar código de entrega cuando el estado es en_camino_cliente', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'asignado'
      });

      Pedido.updateEstado.mockResolvedValue({
        affectedRows: 1,
        codigo_entrega: '123456' // Código generado
      });

      await pedidoController.updateEstadoPedido(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado actualizado',
        codigo_entrega: '123456'
      });
    });

    test('debe emitir código de entrega en el evento Socket.IO', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'asignado'
      });

      Pedido.updateEstado.mockResolvedValue({
        affectedRows: 1,
        codigo_entrega: '654321'
      });

      await pedidoController.updateEstadoPedido(req, res);

      expect(mockIo.emit).toHaveBeenCalledWith('pedido:estado_actualizado',
        expect.objectContaining({
          codigo_entrega: '654321'
        })
      );
    });
  });

  // ========================================================================
  // TEST 3: Confirmación de entrega con código (RF-15)
  // ========================================================================
  describe('Confirmación de entrega - pedidoController.confirmarEntrega', () => {
    
    beforeEach(() => {
      req.body = { codigo: '123456' };
    });

    test('debe confirmar entrega con código válido', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'en_camino_cliente',
        codigo_entrega: '123456'
      });

      Pedido.confirmarEntrega.mockResolvedValue({
        success: true,
        mensaje: 'Entrega confirmada exitosamente'
      });

      await pedidoController.confirmarEntrega(req, res);

      expect(Pedido.confirmarEntrega).toHaveBeenCalledWith('100', '123456');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        mensaje: 'Entrega confirmada exitosamente'
      });
    });

    test('debe rechazar si no se proporciona código', async () => {
      req.body.codigo = '';

      await pedidoController.confirmarEntrega(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Código de entrega requerido'
      });
    });

    test('debe rechazar si el pedido no existe', async () => {
      Pedido.getPedidoById.mockResolvedValue(null);

      await pedidoController.confirmarEntrega(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Pedido no encontrado'
      });
    });

    test('debe rechazar si el motorizado no es el asignado', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 99,
        estado: 'en_camino_cliente'
      });

      await pedidoController.confirmarEntrega(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autorizado para confirmar este pedido'
      });
    });

    test('debe rechazar si el código es incorrecto', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'en_camino_cliente'
      });

      Pedido.confirmarEntrega.mockRejectedValue(new Error('Código incorrecto'));

      await pedidoController.confirmarEntrega(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Código incorrecto'
      });
    });

    test('debe rechazar si el pedido ya está entregado', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'entregado'
      });

      Pedido.confirmarEntrega.mockRejectedValue(
        new Error('Este pedido ya fue entregado')
      );

      await pedidoController.confirmarEntrega(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Este pedido ya fue entregado'
      });
    });

    test('debe emitir evento de entrega confirmada', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'en_camino_cliente'
      });

      Pedido.confirmarEntrega.mockResolvedValue({
        success: true,
        mensaje: 'Entrega confirmada exitosamente'
      });

      await pedidoController.confirmarEntrega(req, res);

      expect(mockIo.to).toHaveBeenCalledWith('pedido_100');
      expect(mockIo.emit).toHaveBeenCalledWith('pedido:estado_actualizado',
        expect.objectContaining({
          pedidoId: '100',
          estado: 'entregado'
        })
      );
    });

    test('debe permitir a admin confirmar cualquier pedido', async () => {
      req.user.rol = 'admin';
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 99,
        estado: 'en_camino_cliente'
      });

      Pedido.confirmarEntrega.mockResolvedValue({
        success: true,
        mensaje: 'Entrega confirmada exitosamente'
      });

      await pedidoController.confirmarEntrega(req, res);

      expect(Pedido.confirmarEntrega).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });

  // ========================================================================
  // TEST 4: Historial de estados (RF-14)
  // ========================================================================
  describe('Historial de estados - pedidoController.getHistorialEstados', () => {
    
    test('debe obtener historial completo de estados', async () => {
      req.user = { id: 1, rol: 'cliente' };
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        usuario_id: 1,
        motorizado_id: 5,
        estado: 'entregado'
      });

      const historialMock = [
        {
          id: 1,
          pedido_id: 100,
          estado_anterior: null,
          estado_nuevo: 'registrado',
          observaciones: null,
          fecha_cambio: '2026-01-12 10:00:00'
        },
        {
          id: 2,
          pedido_id: 100,
          estado_anterior: 'registrado',
          estado_nuevo: 'asignado',
          observaciones: 'Asignado a motorizado 5',
          fecha_cambio: '2026-01-12 10:05:00'
        },
        {
          id: 3,
          pedido_id: 100,
          estado_anterior: 'asignado',
          estado_nuevo: 'en_camino_local',
          observaciones: null,
          fecha_cambio: '2026-01-12 10:15:00'
        },
        {
          id: 4,
          pedido_id: 100,
          estado_anterior: 'en_camino_local',
          estado_nuevo: 'en_camino_cliente',
          observaciones: 'Código de entrega generado',
          fecha_cambio: '2026-01-12 10:30:00'
        },
        {
          id: 5,
          pedido_id: 100,
          estado_anterior: 'en_camino_cliente',
          estado_nuevo: 'entregado',
          observaciones: 'Entrega confirmada con código',
          fecha_cambio: '2026-01-12 11:00:00'
        }
      ];

      Pedido.getHistorialEstados.mockResolvedValue(historialMock);

      await pedidoController.getHistorialEstados(req, res);

      expect(Pedido.getHistorialEstados).toHaveBeenCalledWith('100');
      expect(res.json).toHaveBeenCalledWith(historialMock);
      expect(res.json.mock.calls[0][0]).toHaveLength(5);
    });

    test('debe rechazar si el pedido no existe', async () => {
      req.user = { id: 1, rol: 'cliente' };
      
      Pedido.getPedidoById.mockResolvedValue(null);

      await pedidoController.getHistorialEstados(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Pedido no encontrado'
      });
    });

    test('debe rechazar si el usuario no tiene permisos', async () => {
      req.user = { id: 99, rol: 'cliente' };
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        usuario_id: 1, // Diferente usuario
        motorizado_id: 5,
        estado: 'entregado'
      });

      await pedidoController.getHistorialEstados(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autorizado para ver este historial'
      });
    });

    test('debe permitir al cliente ver su propio historial', async () => {
      req.user = { id: 1, rol: 'cliente' };
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        usuario_id: 1,
        motorizado_id: 5,
        estado: 'entregado'
      });

      Pedido.getHistorialEstados.mockResolvedValue([]);

      await pedidoController.getHistorialEstados(req, res);

      expect(Pedido.getHistorialEstados).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe permitir al motorizado asignado ver el historial', async () => {
      req.user = { id: 5, rol: 'motorizado' };
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        usuario_id: 1,
        motorizado_id: 5,
        estado: 'entregado'
      });

      Pedido.getHistorialEstados.mockResolvedValue([]);

      await pedidoController.getHistorialEstados(req, res);

      expect(Pedido.getHistorialEstados).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe permitir al admin ver cualquier historial', async () => {
      req.user = { id: 999, rol: 'admin' };
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        usuario_id: 1,
        motorizado_id: 5,
        estado: 'entregado'
      });

      Pedido.getHistorialEstados.mockResolvedValue([]);

      await pedidoController.getHistorialEstados(req, res);

      expect(Pedido.getHistorialEstados).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe retornar array vacío si no hay cambios de estado', async () => {
      req.user = { id: 1, rol: 'cliente' };
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        usuario_id: 1,
        motorizado_id: null,
        estado: 'registrado'
      });

      Pedido.getHistorialEstados.mockResolvedValue([]);

      await pedidoController.getHistorialEstados(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  // ========================================================================
  // TEST 5: Manejo de errores
  // ========================================================================
  describe('Manejo de errores del sistema', () => {
    
    test('debe manejar error al actualizar estado', async () => {
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'asignado'
      });

      Pedido.updateEstado.mockRejectedValue(new Error('DB Error'));

      await pedidoController.updateEstadoPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error actualizando estado'
      });
    });

    test('debe manejar error al obtener historial', async () => {
      req.user = { id: 1, rol: 'cliente' };
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        usuario_id: 1,
        motorizado_id: 5
      });

      Pedido.getHistorialEstados.mockRejectedValue(new Error('DB Error'));

      await pedidoController.getHistorialEstados(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error obteniendo historial de estados'
      });
    });

    test('debe continuar si Socket.IO no está disponible', async () => {
      req.app.get = jest.fn().mockReturnValue(null);
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'asignado'
      });

      Pedido.updateEstado.mockResolvedValue({
        affectedRows: 1,
        codigo_entrega: null
      });

      await pedidoController.updateEstadoPedido(req, res);

      // Debe actualizar el estado aunque Socket.IO falle
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado actualizado',
        codigo_entrega: null
      });
    });
  });

  // ========================================================================
  // TEST 6: Validación de transiciones de estado
  // ========================================================================
  describe('Transiciones válidas de estado', () => {
    
    test('debe permitir transición de registrado a asignado', async () => {
      req.body.estado = 'asignado';
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'registrado'
      });

      Pedido.updateEstado.mockResolvedValue({ affectedRows: 1 });

      await pedidoController.updateEstadoPedido(req, res);

      expect(Pedido.updateEstado).toHaveBeenCalledWith('100', 'asignado');
    });

    test('debe permitir transición de asignado a en_camino_local', async () => {
      req.body.estado = 'en_camino_local';
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'asignado'
      });

      Pedido.updateEstado.mockResolvedValue({ affectedRows: 1 });

      await pedidoController.updateEstadoPedido(req, res);

      expect(Pedido.updateEstado).toHaveBeenCalledWith('100', 'en_camino_local');
    });

    test('debe permitir transición a cancelado desde cualquier estado', async () => {
      req.body.estado = 'cancelado';
      
      Pedido.getPedidoById.mockResolvedValue({
        id: 100,
        motorizado_id: 5,
        estado: 'en_camino_cliente'
      });

      Pedido.updateEstado.mockResolvedValue({ affectedRows: 1 });

      await pedidoController.updateEstadoPedido(req, res);

      expect(Pedido.updateEstado).toHaveBeenCalledWith('100', 'cancelado');
    });
  });
});
