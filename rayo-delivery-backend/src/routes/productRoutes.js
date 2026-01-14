const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// Crear y editar solo admin
router.post("/", auth, verifyRole("administrador"), controller.uploadMiddleware, controller.create);
router.patch("/:id", auth, verifyRole("administrador"), controller.uploadMiddleware, controller.update);


// Listar todos los productos
router.get("/", controller.listAll);

// Listar productos públicos (cliente)
// Búsqueda de productos (Global)
router.get("/search", controller.search);

// Listar productos públicos (cliente) - Solo activos
router.get("/local/:localId", controller.listByLocalPublic);

// Listar productos para admin (todos)
router.get("/admin/local/:localId", auth, verifyRole("administrador"), controller.listByLocal);

// Eliminar producto
router.delete("/:id", auth, verifyRole("administrador"), controller.delete);

module.exports = router;
