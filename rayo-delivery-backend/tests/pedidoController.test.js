/**
 * TEST UNITARIO - RIESGO 1: Registro Incorrecto de Pedidos
 * 
 * Este test valida que el sistema registre pedidos correctamente con todas las
 * validaciones necesarias para evitar datos incorrectos o inconsistentes.
 * 
 * Escenarios cubiertos:
 * 1. Validación de productos requeridos
 * 2. Validación de subtotal numérico
 * 3. Validación de dirección requerida
 * 4. Validación de método de pago válido
 * 5. Validación de estructura de productos
 * 6. Cálculo correcto de tarifa de envío
 * 7. Validación de horarios de local (RF-29)
 * 8. Creación exitosa de pedido con datos válidos
 */

const pedidoController = require('../src/controllers/pedidoController');
const Pedido = require('../src/models/pedidoModel');
const User = require('../src/models/userModel');
const LocalModel = require('../src/models/localModel');
const tarifaService = require('../src/services/tarifaService');

// Mocks
jest.mock('../src/models/pedidoModel');
jest.mock('../src/models/userModel');
jest.mock('../src/models/localModel');
jest.mock('../src/services/tarifaService');

describe('RIESGO 1: Registro Incorrecto de Pedidos - pedidoController.createPedido', () => {
  
  let req, res;

  beforeEach(() => {
    // Reset mocks antes de cada test
    jest.clearAllMocks();

    // Mock de request básico
    req = {
      user: { id: 1, rol: 'cliente' },
      body: {
        productos: [
          { id: 1, nombre: 'Pizza', cantidad: 2, precio_unitario: 25.00 }
        ],
        subtotal: 50.00,
        envio: 5.00,
        total: 55.00,
        direccion: 'Av. Lima 123',
        metodo_pago: 'Efectivo',
        latitude: null,
        longitude: null,
        local_id: null
      }
    };

    // Mock de response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock por defecto para findAvailableMotorizado
    User.findAvailableMotorizado.mockResolvedValue(null);
  });

  // ========================================================================
  // TEST 1: Validación de productos requeridos
  // ========================================================================
  describe('Validación de productos', () => {
    
    test('debe rechazar pedido sin productos', async () => {
      req.body.productos = [];

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Productos requeridos' });
    });

    test('debe rechazar pedido con productos no array', async () => {
      req.body.productos = null;

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Productos requeridos' });
    });

    test('debe rechazar producto sin cantidad numérica', async () => {
      req.body.productos = [
        { id: 1, nombre: 'Pizza', cantidad: 'dos', precio_unitario: 25.00 }
      ];

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Producto con cantidad o precio inválido' 
      });
    });

    test('debe rechazar producto sin precio_unitario numérico', async () => {
      req.body.productos = [
        { id: 1, nombre: 'Pizza', cantidad: 2, precio_unitario: '25.00' }
      ];

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Producto con cantidad o precio inválido' 
      });
    });
  });

  // ========================================================================
  // TEST 2: Validación de subtotal
  // ========================================================================
  describe('Validación de subtotal', () => {
    
    test('debe rechazar subtotal no numérico', async () => {
      req.body.subtotal = '50.00';

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Subtotal inválido' });
    });

    test('debe aceptar subtotal numérico válido', async () => {
      req.body.subtotal = 50.00;
      
      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ========================================================================
  // TEST 3: Validación de dirección
  // ========================================================================
  describe('Validación de dirección', () => {
    
    test('debe rechazar dirección vacía', async () => {
      req.body.direccion = '';

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Dirección requerida' });
    });

    test('debe rechazar dirección null', async () => {
      req.body.direccion = null;

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Dirección requerida' });
    });

    test('debe rechazar dirección no string', async () => {
      req.body.direccion = 123;

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Dirección requerida' });
    });
  });

  // ========================================================================
  // TEST 4: Validación de método de pago
  // ========================================================================
  describe('Validación de método de pago', () => {
    
    test('debe aceptar método "Efectivo"', async () => {
      req.body.metodo_pago = 'Efectivo';
      
      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe aceptar método "Yape"', async () => {
      req.body.metodo_pago = 'Yape';
      
      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe aceptar método "Plin"', async () => {
      req.body.metodo_pago = 'Plin';
      
      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe rechazar método de pago inválido', async () => {
      req.body.metodo_pago = 'Tarjeta';

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Método de pago inválido' });
    });

    test('debe rechazar método de pago en minúsculas', async () => {
      req.body.metodo_pago = 'efectivo'; // minúsculas

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Método de pago inválido' });
    });
  });

  // ========================================================================
  // TEST 5: Cálculo de tarifa de envío (RF-19)
  // ========================================================================
  describe('Cálculo de tarifa de envío', () => {
    
    test('debe calcular tarifa con coordenadas válidas', async () => {
      req.body.latitude = -12.0464;
      req.body.longitude = -77.0428;
      
      tarifaService.calcularTarifaDesdeLocal.mockResolvedValue({
        tarifa: 8.50,
        distanciaKm: 3.2
      });

      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(tarifaService.calcularTarifaDesdeLocal).toHaveBeenCalledWith(-12.0464, -77.0428);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe usar tarifa base si falla cálculo automático', async () => {
      req.body.latitude = -12.0464;
      req.body.longitude = -77.0428;
      
      tarifaService.calcularTarifaDesdeLocal.mockRejectedValue(new Error('Error geocoding'));
      tarifaService.obtenerConfiguracionTarifas.mockResolvedValue({ tarifaBase: 5.00 });

      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(tarifaService.obtenerConfiguracionTarifas).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe usar valor de envío enviado si no hay coordenadas', async () => {
      req.body.envio = 6.00;
      
      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(tarifaService.calcularTarifaDesdeLocal).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ========================================================================
  // TEST 6: Validación de horarios de local (RF-29)
  // ========================================================================
  describe('Validación de horarios de atención del local', () => {
    
    beforeEach(() => {
      req.body.local_id = 1;
    });

    test('debe rechazar pedido fuera de horario', async () => {
      // Simular hora 22:00 con local cerrado
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('22:00');

      LocalModel.getLocalById.mockResolvedValue({
        id: 1,
        nombre: 'Local Centro',
        hora_apertura: '08:00',
        hora_cierre: '20:00'
      });

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El local está cerrado en este momento',
        horario: '08:00 - 20:00'
      });
    });

    test('debe aceptar pedido dentro de horario', async () => {
      // Simular hora 14:00 con local abierto
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('14:00');

      LocalModel.getLocalById.mockResolvedValue({
        id: 1,
        nombre: 'Local Centro',
        hora_apertura: '08:00',
        hora_cierre: '20:00'
      });

      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe permitir pedido si local_id no existe', async () => {
      LocalModel.getLocalById.mockResolvedValue(null);

      Pedido.createPedido.mockResolvedValue(1);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ========================================================================
  // TEST 7: Creación exitosa de pedido
  // ========================================================================
  describe('Creación exitosa de pedido', () => {
    
    test('debe crear pedido con datos completos válidos', async () => {
      Pedido.createPedido.mockResolvedValue(123);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(Pedido.createPedido).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: 1,
          subtotal: 50.00,
          direccion: 'Av. Lima 123',
          metodo_pago: 'Efectivo',
          estado: 'registrado'
        })
      );

      expect(Pedido.createDetalles).toHaveBeenCalledWith(123, [
        {
          producto_id: 1,
          nombre: 'Pizza',
          cantidad: 2,
          precio_unitario: 25.00
        }
      ]);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Pedido creado',
        id: 123,
        estado: 'registrado',
        motorizado_id: null
      });
    });

    test('debe asignar motorizado automáticamente si está disponible (RF-10)', async () => {
      User.findAvailableMotorizado.mockResolvedValue({ id: 5 });
      Pedido.createPedido.mockResolvedValue(124);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      expect(Pedido.createPedido).toHaveBeenCalledWith(
        expect.objectContaining({
          motorizado_id: 5,
          estado: 'asignado'
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        message: 'Pedido creado',
        id: 124,
        estado: 'asignado',
        motorizado_id: 5
      });
    });
  });

  // ========================================================================
  // TEST 8: Validación de autenticación
  // ========================================================================
  describe('Validación de autenticación', () => {
    
    test('debe rechazar pedido sin usuario autenticado', async () => {
      req.user = null;

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
    });

    test('debe rechazar pedido sin ID de usuario', async () => {
      req.user = { id: null };

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
    });
  });

  // ========================================================================
  // TEST 9: Manejo de errores
  // ========================================================================
  describe('Manejo de errores del sistema', () => {
    
    test('debe manejar error en base de datos al crear pedido', async () => {
      Pedido.createPedido.mockRejectedValue(new Error('DB Error'));

      await pedidoController.createPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear pedido' });
    });

    test('debe continuar si falla búsqueda de motorizado', async () => {
      User.findAvailableMotorizado.mockRejectedValue(new Error('DB Error'));
      Pedido.createPedido.mockResolvedValue(125);
      Pedido.createDetalles.mockResolvedValue(true);

      await pedidoController.createPedido(req, res);

      // Debe crear el pedido sin motorizado
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'registrado',
          motorizado_id: null
        })
      );
    });
  });
});
