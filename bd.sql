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

CREATE TABLE backup_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo VARCHAR(20),
  descripcion TEXT
);
