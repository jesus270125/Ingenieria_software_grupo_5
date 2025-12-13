const express = require("express");
const router = express.Router();
const controller = require("../controllers/localController");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// Solo admin crea o edita
router.post("/", auth, verifyRole("administrador"), controller.create);
router.patch("/:id", auth, verifyRole("administrador"), controller.update);

// Público
router.get("/", controller.list);

module.exports = router;
