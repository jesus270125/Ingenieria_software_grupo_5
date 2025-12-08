const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// Crear y editar solo admin
router.post("/", auth, verifyRole("admin"), controller.create);
router.patch("/:id", auth, verifyRole("admin"), controller.update);

// Listar productos públicos (cliente)
router.get("/local/:localId", controller.listByLocal);

module.exports = router;
