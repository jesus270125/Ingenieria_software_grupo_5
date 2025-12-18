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
    descripcion VARCHAR(255),
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

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE productos;
TRUNCATE TABLE locales;
SET FOREIGN_KEY_CHECKS = 1;

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