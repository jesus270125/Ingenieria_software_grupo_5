const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: true
  }
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar la base de datos", err);
  } else {
    console.log("✅ Conexión a la base de datos exitosa");
  }
});

module.exports = connection;

