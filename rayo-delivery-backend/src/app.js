require("dotenv").config();
console.log("JWT_SECRET cargado:", process.env.JWT_SECRET);

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// Importar rutas
const localRoutes = require("./routes/localRoutes");
const productoRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes"); // <-- aquí

// Montar rutas con prefijo /api
app.use("/api/locales", localRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/auth", authRoutes); // <-- aquí

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
