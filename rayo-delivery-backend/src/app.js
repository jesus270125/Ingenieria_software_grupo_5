require("dotenv").config();
console.log("JWT_SECRET cargado:", process.env.JWT_SECRET);

const express = require("express");
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Pedido = require('./models/pedidoModel');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Importar rutas
const localRoutes = require("./routes/localRoutes");
const productoRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const motorizadoRoutes = require("./routes/motorizadoRoutes");
const searchRoutes = require("./routes/searchRoutes");
const versionRoutes = require("./routes/versionRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const fakePaymentRoutes = require("./routes/fakePaymentRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const configRoutes = require("./routes/configRoutes");
const reportesRoutes = require("./routes/reportesRoutes");
const tarifaRoutes = require("./routes/tarifaRoutes");
const evaluacionRoutes = require("./routes/evaluacionRoutes");
const incidenciaRoutes = require("./routes/incidenciaRoutes");
const promocionRoutes = require("./routes/promocionRoutes");
const backupRoutes = require("./routes/backupRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


// Montar rutas con prefijo /api
app.use("/api/locales", localRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use("/api/motorizado", motorizadoRoutes);
app.use("/buscar", searchRoutes);
app.use('/api/versiones', versionRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments/fake', fakePaymentRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/config', configRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/tarifas', tarifaRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/promociones', promocionRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Servir carpeta de uploads de forma estática (para ver las fotos)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = process.env.PORT || 4000;

// Crear servidor HTTP y socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// Autenticación en handshake de socket: el cliente puede enviar { auth: { token } }
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    const headerToken = socket.handshake.headers && socket.handshake.headers.authorization;
    const raw = token || (headerToken ? headerToken.replace('Bearer ', '') : null);
    if (!raw) return next(); // no authentication, allow connection but without user

    jwt.verify(raw, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('Socket auth failed', err.message);
        return next();
      }
      socket.user = user; // attach user for later checks
      return next();
    });
  } catch (e) {
    console.warn('Socket auth error', e);
    return next();
  }
});

io.on('connection', (socket) => {
  console.log('Socket conectado:', socket.id, 'user:', socket.user ? socket.user.id : 'anon');

  // Si el usuario es motorizado, únelo a su sala personal para notificaciones directas
  try {
    if (socket.user && (socket.user.rol === 'motorizado' || socket.user.role === 'motorizado')) {
      const room = `motorizado_${socket.user.id}`;
      socket.join(room);
      console.log(`Socket ${socket.id} unido a sala ${room}`);
    }
  } catch (e) { console.warn('Error al unir motorizado a sala:', e); }

  socket.on('join_pedido', ({ token, pedidoId }) => {
    if (!pedidoId) return;

    const proceedWithUser = async (user) => {
      try {
        const pedido = await Pedido.getPedidoById(pedidoId);
        if (!pedido) return console.log('join_pedido: pedido no encontrado', pedidoId);

        const isOwner = pedido.usuario_id === user.id;
        const isAssignedMot = pedido.motorizado_id === user.id;
        const isAdmin = user.rol === 'administrador' || user.rol === 'admin';

        if (isOwner || isAssignedMot || isAdmin) {
          const room = `pedido_${pedidoId}`;
          socket.join(room);
          console.log(`Socket ${socket.id} se unió a ${room}`);
        } else {
          console.log(`Socket ${socket.id} no autorizado para unirse a pedido_${pedidoId}`);
        }
      } catch (e) {
        console.warn('Error al verificar pedido en join_pedido', e);
      }
    };

    if (socket.user) {
      proceedWithUser(socket.user);
      return;
    }

    // Si no estaba autenticado en handshake, intenta con token pasado en evento
    if (!token) return;
    const tokenLimpio = token.replace('Bearer ', '');
    jwt.verify(tokenLimpio, process.env.JWT_SECRET, (err, user) => {
      if (err) return console.log('join_pedido: token inválido');
      proceedWithUser(user);
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket desconectado:', socket.id);
  });
});

// ==========================================
// RF-27: CONFIGURACIÓN DE BACKUPS AUTOMÁTICOS
// ==========================================
const cron = require('node-cron');
const backupService = require('./services/backupService');

// Programar backup diario a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Ejecutando backup automático diario...');
  try {
    await backupService.createBackup('automatico');
    console.log('Backup automático completado');
    
    // Limpiar backups antiguos después del backup
    const deleted = await backupService.cleanOldBackups();
    if (deleted > 0) {
      console.log(`Limpieza automática: ${deleted} backups antiguos eliminados`);
    }
  } catch (error) {
    console.error('Error en backup automático:', error);
  }
}, {
  timezone: "America/Lima" // Ajusta a tu zona horaria
});

console.log('Backup automático programado para las 2:00 AM diariamente');

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
