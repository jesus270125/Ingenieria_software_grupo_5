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

