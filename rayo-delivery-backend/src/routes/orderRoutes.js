const express = require("express");
const router = express.Router();
const controller = require("../controllers/orderController");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// Crear pedido (Cliente autenticado)
router.post("/", auth, controller.create);

// Mis pedidos (Cliente autenticado)
router.get("/my-orders", auth, controller.getMyOrders);

// Listar todos (Admin)
router.get("/admin/all", auth, verifyRole("administrador"), controller.listAll);

// RF-11: Reasignar pedido a otro motorizado (Solo Admin)
router.put("/admin/reassign", auth, verifyRole("administrador"), controller.reassign);

// Detalle pedido
router.get("/:id", auth, controller.getById);

module.exports = router;
