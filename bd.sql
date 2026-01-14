CREATE DATABASE rayo_delivery;
USE rayo_delivery;
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  dni_ruc VARCHAR(20),
  telefono VARCHAR(20) NOT NULL,
  direccion VARCHAR(150),
  correo VARCHAR(100),
  password VARCHAR(255) NOT NULL,
  rol ENUM('cliente','motorizado','administrador') NOT NULL,
  foto VARCHAR(255),
  placa VARCHAR(20),
  licencia VARCHAR(20),
  estado_cuenta ENUM('activo','inactivo') DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (token),
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

SELECT * FROM usuarios;
TRUNCATE TABLE usuarios;
SELECT * FROM locales;


CREATE TABLE backup_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo VARCHAR(20),
  descripcion TEXT
);

CREATE TABLE locales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    imagen VARCHAR(255),
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    local_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
);

CREATE TABLE catalogo_versiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(20),               -- local o producto
    referencia_id INT,              -- id del local o producto modificado
    accion VARCHAR(50),             -- CREACION, EDICION, ELIMINACION
    descripcion VARCHAR(255),
    datos_anteriores JSON,          -- Snapshot completo antes del cambio
    datos_nuevos JSON,              -- Snapshot completo después del cambio
    usuario VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  envio DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  direccion VARCHAR(500) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'registrado',
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NULL,
  nombre VARCHAR(255),
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_estados_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  observaciones TEXT,
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  INDEX idx_pedido (pedido_id),
  INDEX idx_fecha (fecha_cambio)
);

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE productos;
TRUNCATE TABLE locales;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE pedidos 
ADD COLUMN codigo_entrega VARCHAR(6) NULL AFTER estado,
ADD COLUMN fecha_entrega DATETIME NULL AFTER codigo_entrega;

-- Agregar columnas para promociones (RF-24)
ALTER TABLE pedidos
ADD COLUMN codigo_promocional VARCHAR(50) NULL AFTER total,
ADD COLUMN descuento DECIMAL(10,2) DEFAULT 0 AFTER codigo_promocional;

INSERT INTO locales (nombre, direccion, categoria, hora_apertura, hora_cierre) VALUES
('La Esquina Del Sabor','Av. Principal 100','Comida rápida','08:00:00','23:00:00'),
('Café Central','Jr. Libertad 45','Cafetería','07:00:00','20:00:00'),
('Pizzería Napoli','Calle Roma 12','Pizzería','11:00:00','23:30:00'),
('Sushi Hana','Av. Japón 88','Sushi','12:00:00','22:00:00'),
('Pollería El Buen Pollo','Jr. San Martín 200','Pollería','09:00:00','22:00:00'),
('Tacos y Más','Av. México 50','Comida mexicana','10:00:00','00:00:00'),
('La Veggie','Calle Verde 7','Vegetariano','08:30:00','21:30:00'),
('Parrilla Don Pepe','Av. Fuego 77','Parrilla','12:00:00','23:59:00'),
('Bakery & Co.','Jr. Pan 9','Panadería','06:00:00','18:00:00'),
('Comida Peruana El Rincón','Plaza Mayor 3','Comida criolla','10:00:00','22:00:00');

-- Local 1
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(1,'Hamburguesa Clásica','Carne, queso, lechuga, tomate',18.50),
(1,'Papas Fritas','Porción de papas doradas',6.00),
(1,'Pollo Crispy','Tiras de pollo empanizado',14.00),
(1,'Combo Familiar','2 hamburguesas + papas + bebida',45.00),
(1,'Ensalada César','Lechuga, pollo, aderezo César',12.00),
(1,'Onion Rings','Aros de cebolla',7.00),
(1,'Malteada Vainilla','Malteada cremosa',8.50),
(1,'Hot Dog','Salchicha, salsa, cebolla',9.00),
(1,'Wrap de Pollo','Wrap con pollo y vegetales',13.00),
(1,'Bebida 500ml','Refresco 500ml',3.50);

-- Local 2
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(2,'Café Americano','Taza de café filtrado',3.00),
(2,'Cappuccino','Expreso con leche espumosa',4.50),
(2,'Latte','Expreso con leche',4.50),
(2,'Torta de Zanahoria','Porción casera',5.50),
(2,'Sándwich Club','Pavo, lechuga, tomate, mayonesa',8.50),
(2,'Croissant','Croissant mantequilla',2.80),
(2,'Bagel con Queso','Bagel tostado con queso crema',3.50),
(2,'Smoothie de Frutas','Batido natural',6.00),
(2,'Ensalada de Quinoa','Quinoa, vegetales',9.50),
(2,'Agua 500ml','Botella de agua',2.00);

-- Local 3
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(3,'Pizza Margarita','Salsa, queso, albahaca',22.00),
(3,'Pizza Pepperoni','Con pepperoni',25.00),
(3,'Pizza Hawaiana','Jamón y piña',24.00),
(3,'Calzone','Relleno de queso y jamón',18.50),
(3,'Ensalada Italiana','Vegetales frescos',10.00),
(3,'Alitas BBQ','6 unidades',12.00),
(3,'Pan de Ajo','Porción',4.50),
(3,'Bebida 1L','Refresco 1 litro',6.50),
(3,'Postre Tiramisu','Porción individual',7.50),
(3,'Pizza 4 Quesos','Mozzarella, parmesano, roquefort, gouda',26.00);

-- Local 4
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(4,'Roll California','Surimi, aguacate, pepino',16.00),
(4,'Sashimi Salmón','6 piezas',20.00),
(4,'Nigiri Atún','2 piezas',8.00),
(4,'Tempura Mixta','Camarón y verduras',14.00),
(4,'Ramen','Tazón de ramen tradicional',13.50),
(4,'Uramaki Especial','Roll especial de la casa',18.00),
(4,'Ensalada Wakame','Alga wakame',6.00),
(4,'Gyozas','4 unidades',7.00),
(4,'Sopa Miso','Tazón pequeño',3.50),
(4,'Bebida Sake 250ml','Sake tradicional',9.00);

-- Local 5
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(5,'Pollo a la Brasa (1/4)','Con papas',12.00),
(5,'Pollo a la Brasa (1/2)','Con guarnición',20.00),
(5,'Alitas Picantes','8 unidades',11.00),
(5,'Pollo al Horno','Porción individual',10.50),
(5,'Ensalada fresca','Lechuga, tomate, cebolla',6.50),
(5,'Papas a la Huancaína','Porción',7.00),
(5,'Arroz Chaufa','Porción de arroz frito',8.50),
(5,'Salsa de Aji','Porción pequeña',0.80),
(5,'Bebida 500ml','Refresco',3.00),
(5,'Combo Familiar','Pollo + papas + 2 bebidas',38.00);

-- Local 6
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(6,'Taco Pollo','Taco relleno de pollo',6.50),
(6,'Taco Carne','Taco de carne asada',7.00),
(6,'Burrito','Burrito grande',10.00),
(6,'Quesadilla','Con queso fundido',8.00),
(6,'Nachos con Queso','Porción para compartir',12.00),
(6,'Guacamole','Porción',5.50),
(6,'Salsa Picante','Porción',0.50),
(6,'Agua Fresca','Jarra pequeña',3.50),
(6,'Combo 2 Tacos','2 tacos + bebida',13.00),
(6,'Postre Churros','Porción con azúcar',4.50);

-- Local 7
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(7,'Hamburguesa Veggie','Hamburguesa de garbanzos',12.00),
(7,'Wrap Vegetal','Wrap con hummus y verduras',9.50),
(7,'Ensalada Kale','Kale, quinoa, aderezo',11.00),
(7,'Smoothie Verde','Batido detox',6.50),
(7,'Bowl de Quinoa','Quinoa, aguacate, vegetales',13.00),
(7,'Falafel (6u)','Falafel con salsa',8.00),
(7,'Sopa de Lentejas','Porción caliente',7.00),
(7,'Tostada de Aguacate','Pan integral con aguacate',7.50),
(7,'Jugo Natural','Naranja natural',3.50),
(7,'Postre Vegano','Brownie vegano',5.50);

-- Local 8
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(8,'Bife de Chorizo','Con papas y ensalada',28.00),
(8,'Anticuchos','6 unidades',14.00),
(8,'Asado de Tira','Porción grande',32.00),
(8,'Chorizo a la Parrilla','Porción',9.00),
(8,'Morcilla','Porción',8.50),
(8,'Papas Rústicas','Porción',6.50),
(8,'Ensalada Mixta','Lechuga, tomate, cebolla',7.00),
(8,'Salsa Chimichurri','Porción',1.00),
(8,'Postre Flan','Con dulce de leche',6.00),
(8,'Bebida 1L','Refresco',6.50);

-- Local 9
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(9,'Pan Baguette','Baguette tradicional',2.50),
(9,'Croissant Chocolate','Relleno de chocolate',3.20),
(9,'Donut','Donut glaseado',1.80),
(9,'Tarta de Manzana','Porción',4.50),
(9,'Brownie','Porción',3.00),
(9,'Café para llevar','Taza pequeña',2.50),
(9,'Muffin Arándanos','Muffin casero',2.80),
(9,'Sándwich Refrigerio','Jamón y queso',4.00),
(9,'Ensalada de Frutas','Porción fresca',5.00),
(9,'Jugo Natural','Naranja',3.00);

-- Local 10
INSERT INTO productos (local_id, nombre, descripcion, precio) VALUES
(10,'Lomo Saltado','Carne salteada con papas',18.00),
(10,'Ceviche Clásico','Pescado, limón, cebolla',16.50),
(10,'Aji de Gallina','Pollo en salsa cremosa',14.00),
(10,'Arroz con Mariscos','Porción generosa',20.00),
(10,'Papa a la Huancaína','Porción',7.00),
(10,'Causa Limeña','Causa rellena',9.50),
(10,'Pollo a la Brasa (completo)','Con guarnición',22.00),
(10,'Tallarines Verdes','Pasta con salsa de espinaca',12.00),
(10,'Chicha Morada','Bebida tradicional',3.50),
(10,'Suspiro a la Limeña','Postre típico',5.50);


-- ==========================================
-- ACTUALIZACIONES SPRINT 4 (EJECUTAR SI YA EXISTE LA BD)
-- ==========================================

-- 1. Actualizar tabla pedidos para soportar asignación a motorizados
-- Si da error "Duplicate column name", es que ya existen.
ALTER TABLE pedidos ADD COLUMN motorizado_id INT NULL;
ALTER TABLE pedidos ADD CONSTRAINT fk_motorizado FOREIGN KEY (motorizado_id) REFERENCES usuarios(id);

-- 2. Actualizar tabla usuarios para soportar estado y ubicación del motorizado
ALTER TABLE usuarios ADD COLUMN disponible TINYINT(1) DEFAULT 1; -- 1: Disponible, 0: No disponible
ALTER TABLE usuarios ADD COLUMN lat DOUBLE NULL;
ALTER TABLE usuarios ADD COLUMN lng DOUBLE NULL;

USE rayo_delivery;

-- Agrega columna para el código de 6 dígitos
ALTER TABLE usuarios ADD COLUMN recovery_code VARCHAR(6) NULL;

-- Agrega columna para la fecha de expiración del código
ALTER TABLE usuarios ADD COLUMN recovery_expires TIMESTAMP NULL;

USE rayo_delivery;
ALTER TABLE productos ADD COLUMN estado ENUM('activo', 'inactivo') DEFAULT 'activo';
ALTER TABLE pedidos ADD COLUMN estado_pago VARCHAR(20) DEFAULT 'pendiente' AFTER estado;

ALTER TABLE pedidos ADD COLUMN motorizado_id INT NULL;
ALTER TABLE pedidos ADD CONSTRAINT fk_motorizado FOREIGN KEY (motorizado_id) REFERENCES usuarios(id);

ALTER TABLE pedidos
  ADD COLUMN latitude DOUBLE NULL,
  ADD COLUMN longitude DOUBLE NULL;

-- ==========================================
-- RF-17: CONFIGURACIÓN DEL SISTEMA
-- ==========================================
CREATE TABLE IF NOT EXISTS configuracion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion VARCHAR(255),
  tipo ENUM('numero', 'texto', 'boolean') DEFAULT 'texto',
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuraciones por defecto
INSERT INTO configuracion (clave, valor, descripcion, tipo) VALUES
('tarifa_base_envio', '5.00', 'Tarifa base de envío en soles', 'numero'),
('tarifa_por_km', '1.50', 'Tarifa adicional por kilómetro', 'numero'),
('radio_entrega_km', '10', 'Radio máximo de entrega en kilómetros', 'numero'),
('tiempo_preparacion_min', '15', 'Tiempo estimado de preparación en minutos', 'numero'),
('permitir_pedidos_programados', 'true', 'Permitir pedidos programados', 'boolean'),
('telefono_soporte', '999999999', 'Teléfono de soporte', 'texto'),
('email_soporte', 'soporte@rayodelivery.com', 'Email de soporte', 'texto'),
('nombre_app', 'Rayo Delivery', 'Nombre de la aplicación', 'texto'),
('mensaje_bienvenida', 'Bienvenido a Rayo Delivery', 'Mensaje de bienvenida', 'texto')
ON DUPLICATE KEY UPDATE valor=valor;

-- ==========================================
-- RF-22: EVALUACIONES Y COMENTARIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS evaluaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  cliente_id INT NOT NULL,
  motorizado_id INT NOT NULL,
  calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  respuesta_admin TEXT,
  accion_tomada VARCHAR(255),
  fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta TIMESTAMP NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (motorizado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_motorizado (motorizado_id),
  INDEX idx_pedido (pedido_id),
  INDEX idx_calificacion (calificacion)
);

-- ==========================================
-- RF-23: REGISTRO DE INCIDENCIAS
-- ==========================================
CREATE TABLE IF NOT EXISTS incidencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo_incidencia ENUM('demora', 'mal_estado', 'perdida', 'otro') NOT NULL,
  descripcion TEXT NOT NULL,
  foto_url VARCHAR(255),
  estado ENUM('pendiente', 'en_revision', 'resuelto') DEFAULT 'pendiente',
  respuesta_admin TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_pedido (pedido_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_estado (estado),
  INDEX idx_tipo (tipo_incidencia)
);

-- Tabla de Promociones y Códigos de Descuento (RF-24)
CREATE TABLE promociones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  tipo_descuento ENUM('porcentaje', 'monto_fijo') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  estado ENUM('activa', 'inactiva', 'expirada') DEFAULT 'activa',
  uso_maximo INT DEFAULT NULL COMMENT 'NULL = uso ilimitado',
  usos_actuales INT DEFAULT 0,
  monto_minimo DECIMAL(10,2) DEFAULT 0 COMMENT 'Monto mínimo del pedido para aplicar',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_fechas (fecha_inicio, fecha_fin)
);

-- ==========================================
-- RF-28: SISTEMA DE TICKETS DE SOPORTE
-- ==========================================
CREATE TABLE IF NOT EXISTS tickets_soporte (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  categoria ENUM('consulta', 'problema_tecnico', 'pedido', 'pago', 'cuenta', 'otro') NOT NULL DEFAULT 'consulta',
  descripcion TEXT NOT NULL,
  estado ENUM('abierto', 'en_proceso', 'resuelto', 'cerrado') DEFAULT 'abierto',
  prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
  asignado_a INT NULL COMMENT 'ID del administrador asignado',
  respuesta_admin TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_resolucion TIMESTAMP NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_usuario (usuario_id),
  INDEX idx_estado (estado),
  INDEX idx_categoria (categoria),
  INDEX idx_asignado (asignado_a),
  INDEX idx_fecha (fecha_creacion)
);

-- Tabla de respuestas para tickets
CREATE TABLE IF NOT EXISTS ticket_respuestas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  usuario_id INT NOT NULL,
  respuesta TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets_soporte(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_ticket (ticket_id),
  INDEX idx_fecha (fecha_creacion)
);

ALTER TABLE catalogo_versiones 
ADD COLUMN accion VARCHAR(50) AFTER referencia_id,
ADD COLUMN datos_anteriores JSON AFTER descripcion,
ADD COLUMN datos_nuevos JSON AFTER datos_anteriores;

SHOW COLUMNS FROM catalogo_versiones;

UPDATE catalogo_versiones 
SET accion = 'EDICION' 
WHERE accion IS NULL OR accion = '';

SHOW COLUMNS FROM catalogo_versiones;
SELECT * FROM catalogo_versiones ORDER BY fecha DESC LIMIT 5;