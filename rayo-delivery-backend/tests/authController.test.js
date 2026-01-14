/**
 * TEST UNITARIO - RIESGO 4: Errores en el Acceso al Sistema (Autenticación)
 * 
 * Este test valida que el sistema gestione correctamente la autenticación y
 * autorización de usuarios, incluyendo registro, login, tokens y seguridad.
 * 
 * Escenarios cubiertos:
 * 1. Registro de usuarios con validaciones (RF-01)
 * 2. Login con credenciales válidas/inválidas (RF-02)
 * 3. Generación y validación de tokens JWT
 * 4. Refresh tokens para renovar sesiones
 * 5. Recuperación de contraseña con códigos (RF-03)
 * 6. Validación de roles y permisos
 * 7. Middleware de autenticación
 * 8. Cierre de sesión (logout)
 */

const authController = require('../src/controllers/authController');
const userModel = require('../src/models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/auth');

// Mocks
jest.mock('../src/models/userModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('RIESGO 4: Errores en el Acceso al Sistema (Autenticación)', () => {
  
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock de variables de entorno
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.ACCESS_TOKEN_EXPIRES = '7d';
  });

  // ========================================================================
  // TEST 1: Registro de usuarios (RF-01)
  // ========================================================================
  describe('Registro de usuarios - authController.registerUser', () => {
    
    test('debe registrar un cliente con datos válidos', async () => {
      req.body = {
        nombre: 'Juan Pérez',
        dni_ruc: '12345678',
        telefono: '987654321',
        direccion: 'Av. Lima 123',
        correo: 'juan@example.com',
        password: 'password123',
        rol: 'cliente'
      };

      userModel.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      userModel.createUser.mockResolvedValue(1);

      await authController.registerUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userModel.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Juan Pérez',
          correo: 'juan@example.com',
          password: 'hashed_password',
          rol: 'cliente'
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario registrado correctamente'
      });
    });

    test('debe rechazar registro sin datos obligatorios', async () => {
      req.body = {
        nombre: 'Juan',
        correo: 'juan@example.com'
        // Faltan campos obligatorios
      };

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Faltan datos obligatorios')
      });
    });

    test('debe rechazar correo duplicado', async () => {
      req.body = {
        nombre: 'Juan Pérez',
        dni_ruc: '12345678',
        telefono: '987654321',
        direccion: 'Av. Lima 123',
        correo: 'juan@example.com',
        password: 'password123',
        rol: 'cliente'
      };

      userModel.findByEmail.mockResolvedValue({ id: 1, correo: 'juan@example.com' });

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El correo ya está registrado'
      });
    });

    test('debe validar placa y licencia para motorizados', async () => {
      req.body = {
        nombre: 'Pedro Motorizado',
        dni_ruc: '87654321',
        telefono: '987654321',
        direccion: 'Av. Lima 456',
        correo: 'pedro@example.com',
        password: 'password123',
        rol: 'motorizado'
        // Faltan placa y licencia
      };

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Placa y Licencia')
      });
    });

    test('debe registrar motorizado con placa y licencia', async () => {
      req.body = {
        nombre: 'Pedro Motorizado',
        dni_ruc: '87654321',
        telefono: '987654321',
        direccion: 'Av. Lima 456',
        correo: 'pedro@example.com',
        password: 'password123',
        rol: 'motorizado',
        placa: 'ABC-123',
        licencia: 'Q12345678'
      };

      userModel.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      userModel.createUser.mockResolvedValue(2);

      await authController.registerUser(req, res);

      expect(userModel.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          placa: 'ABC-123',
          licencia: 'Q12345678',
          rol: 'motorizado'
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario registrado correctamente'
      });
    });

    test('debe manejar errores del servidor al registrar', async () => {
      req.body = {
        nombre: 'Juan Pérez',
        dni_ruc: '12345678',
        telefono: '987654321',
        direccion: 'Av. Lima 123',
        correo: 'juan@example.com',
        password: 'password123',
        rol: 'cliente'
      };

      userModel.findByEmail.mockRejectedValue(new Error('DB Error'));

      await authController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error en el servidor'
      });
    });
  });

  // ========================================================================
  // TEST 2: Login de usuarios (RF-02)
  // ========================================================================
  describe('Login de usuarios - authController.login', () => {
    
    test('debe hacer login con credenciales válidas', async () => {
      req.body = {
        correo: 'juan@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        correo: 'juan@example.com',
        password: 'hashed_password',
        rol: 'cliente',
        nombre: 'Juan Pérez',
        disponible: 1
      };

      userModel.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock_jwt_token');
      userModel.saveRefreshToken.mockResolvedValue(true);

      await authController.login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login correcto',
          token: 'mock_jwt_token',
          rol: 'cliente',
          usuario: expect.objectContaining({
            id: 1,
            nombre: 'Juan Pérez',
            correo: 'juan@example.com'
          })
        })
      );
    });

    test('debe rechazar login sin correo o contraseña', async () => {
      req.body = { correo: 'juan@example.com' }; // Falta password

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo y contraseña son obligatorios'
      });
    });

    test('debe rechazar login con usuario no existente', async () => {
      req.body = {
        correo: 'noexiste@example.com',
        password: 'password123'
      };

      userModel.findByEmail.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado'
      });
    });

    test('debe rechazar login con contraseña incorrecta', async () => {
      req.body = {
        correo: 'juan@example.com',
        password: 'wrong_password'
      };

      const mockUser = {
        id: 1,
        correo: 'juan@example.com',
        password: 'hashed_password'
      };

      userModel.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Contraseña incorrecta'
      });
    });

    test('debe generar refresh token al hacer login', async () => {
      req.body = {
        correo: 'juan@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        correo: 'juan@example.com',
        password: 'hashed_password',
        rol: 'cliente',
        nombre: 'Juan Pérez'
      };

      userModel.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock_jwt_token');
      userModel.saveRefreshToken.mockResolvedValue(true);

      await authController.login(req, res);

      expect(userModel.saveRefreshToken).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshToken: expect.any(String)
        })
      );
    });

    test('debe manejar errores del servidor en login', async () => {
      req.body = {
        correo: 'juan@example.com',
        password: 'password123'
      };

      userModel.findByEmail.mockRejectedValue(new Error('DB Error'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error en el servidor'
      });
    });
  });

  // ========================================================================
  // TEST 3: Recuperación de contraseña (RF-03)
  // ========================================================================
  describe('Recuperación de contraseña', () => {
    
    test('debe enviar código de recuperación a correo válido', async () => {
      req.body = { correo: 'juan@example.com' };

      const mockUser = {
        id: 1,
        correo: 'juan@example.com'
      };

      userModel.findByEmail.mockResolvedValue(mockUser);
      userModel.saveRecoveryCode.mockResolvedValue(true);

      await authController.sendRecoveryCode(req, res);

      expect(userModel.saveRecoveryCode).toHaveBeenCalledWith(
        1,
        expect.any(String), // código
        expect.any(Date) // expiración
      );
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('correo')
      });
    });

    test('debe responder genéricamente si el correo no existe', async () => {
      req.body = { correo: 'noexiste@example.com' };

      userModel.findByEmail.mockResolvedValue(null);

      await authController.sendRecoveryCode(req, res);

      // No debe revelar que el usuario no existe
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Si existe')
      });
    });

    test('debe resetear contraseña con código válido', async () => {
      req.body = {
        correo: 'juan@example.com',
        codigo: '123456',
        nuevaPassword: 'newPassword123'
      };

      userModel.verifyRecoveryCode.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new_hashed_password');
      userModel.updatePassword.mockResolvedValue(true);

      await authController.resetPassword(req, res);

      expect(userModel.verifyRecoveryCode).toHaveBeenCalledWith('juan@example.com', '123456');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(userModel.updatePassword).toHaveBeenCalledWith('juan@example.com', 'new_hashed_password');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Contraseña actualizada correctamente'
      });
    });

    test('debe rechazar código inválido o expirado', async () => {
      req.body = {
        correo: 'juan@example.com',
        codigo: '999999',
        nuevaPassword: 'newPassword123'
      };

      userModel.verifyRecoveryCode.mockResolvedValue(false);

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Código inválido o expirado'
      });
    });

    test('debe rechazar reseteo sin código o nueva contraseña', async () => {
      req.body = { correo: 'juan@example.com' }; // Faltan código y password

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Faltan datos')
      });
    });
  });

  // ========================================================================
  // TEST 4: Refresh Token
  // ========================================================================
  describe('Refresh Token - authController.refreshToken', () => {
    
    test('debe generar nuevo token con refresh token válido', async () => {
      req.body = { refreshToken: 'valid_refresh_token' };

      const mockTokenRow = {
        user_id: 1,
        expires_at: new Date(Date.now() + 86400000) // Expira en 1 día
      };

      const mockUser = {
        id: 1,
        rol: 'cliente',
        nombre: 'Juan Pérez',
        correo: 'juan@example.com'
      };

      userModel.findRefreshToken.mockResolvedValue(mockTokenRow);
      userModel.findById.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('new_access_token');

      await authController.refreshToken(req, res);

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        token: 'new_access_token'
      });
    });

    test('debe rechazar refresh token inválido', async () => {
      req.body = { refreshToken: 'invalid_token' };

      userModel.findRefreshToken.mockResolvedValue(null);

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Refresh token inválido'
      });
    });

    test('debe rechazar refresh token expirado', async () => {
      req.body = { refreshToken: 'expired_token' };

      const mockTokenRow = {
        user_id: 1,
        expires_at: new Date(Date.now() - 86400000) // Expiró hace 1 día
      };

      userModel.findRefreshToken.mockResolvedValue(mockTokenRow);
      userModel.deleteRefreshToken.mockResolvedValue(true);

      await authController.refreshToken(req, res);

      expect(userModel.deleteRefreshToken).toHaveBeenCalledWith('expired_token');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Refresh token expirado'
      });
    });

    test('debe rechazar si no se proporciona refresh token', async () => {
      req.body = {}; // Sin refreshToken

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'refreshToken requerido'
      });
    });
  });

  // ========================================================================
  // TEST 5: Logout
  // ========================================================================
  describe('Logout - authController.logout', () => {
    
    test('debe cerrar sesión y eliminar refresh token', async () => {
      req.body = { refreshToken: 'valid_refresh_token' };

      userModel.deleteRefreshToken.mockResolvedValue(true);

      await authController.logout(req, res);

      expect(userModel.deleteRefreshToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sesión cerrada'
      });
    });

    test('debe rechazar logout sin refresh token', async () => {
      req.body = {}; // Sin refreshToken

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'refreshToken requerido'
      });
    });

    test('debe manejar errores al cerrar sesión', async () => {
      req.body = { refreshToken: 'valid_refresh_token' };

      userModel.deleteRefreshToken.mockRejectedValue(new Error('DB Error'));

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno'
      });
    });
  });

  // ========================================================================
  // TEST 6: Middleware de autenticación
  // ========================================================================
  describe('Middleware de autenticación - auth.js', () => {
    
    let next;

    beforeEach(() => {
      next = jest.fn();
    });

    test('debe permitir acceso con token válido', () => {
      req.headers['authorization'] = 'Bearer valid_token';

      const mockDecodedUser = {
        id: 1,
        rol: 'cliente',
        nombre: 'Juan Pérez'
      };

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockDecodedUser);
      });

      authMiddleware(req, res, next);

      expect(req.user).toEqual(mockDecodedUser);
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar petición sin token', () => {
      // Sin header de authorization

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token no enviado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar token inválido', () => {
      req.headers['authorization'] = 'Bearer invalid_token';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Token inválido'), null);
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token inválido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe limpiar el prefijo Bearer del token', () => {
      req.headers['authorization'] = 'Bearer test_token_123';

      jwt.verify.mockImplementation((token, secret, callback) => {
        expect(token).toBe('test_token_123'); // Sin "Bearer "
        callback(null, { id: 1 });
      });

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // TEST 7: Seguridad y validaciones
  // ========================================================================
  describe('Seguridad y validaciones', () => {
    
    test('debe encriptar contraseñas al registrar', async () => {
      req.body = {
        nombre: 'Test User',
        dni_ruc: '12345678',
        telefono: '987654321',
        direccion: 'Test Address',
        correo: 'test@example.com',
        password: 'plain_password',
        rol: 'cliente'
      };

      userModel.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      userModel.createUser.mockResolvedValue(1);

      await authController.registerUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain_password', 10);
      expect(userModel.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed_password'
        })
      );
    });

    test('debe incluir información del usuario en el token JWT', async () => {
      req.body = {
        correo: 'juan@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        correo: 'juan@example.com',
        password: 'hashed_password',
        rol: 'cliente',
        nombre: 'Juan Pérez'
      };

      userModel.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      userModel.saveRefreshToken.mockResolvedValue(true);

      jwt.sign.mockImplementation((payload, secret, options) => {
        expect(payload).toEqual({
          id: 1,
          rol: 'cliente',
          nombre: 'Juan Pérez',
          email: 'juan@example.com'
        });
        return 'mock_token';
      });

      await authController.login(req, res);

      expect(jwt.sign).toHaveBeenCalled();
    });

    test('no debe revelar información sensible en errores', async () => {
      req.body = { correo: 'noexiste@example.com' };

      userModel.findByEmail.mockResolvedValue(null);

      await authController.sendRecoveryCode(req, res);

      // Mensaje genérico que no revela si el usuario existe
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Si existe')
      });
    });
  });
});
