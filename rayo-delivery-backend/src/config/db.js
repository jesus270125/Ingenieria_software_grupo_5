const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",              // tu usuario de MySQL
  password: "123456789",     // tu contraseña
  database: "rayo_delivery" // reemplaza con el nombre exacto de tu base
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar la base de datos", err);
  } else {
    console.log("✅ Conexión a la base de datos exitosa");
  }
});

module.exports = connection;

