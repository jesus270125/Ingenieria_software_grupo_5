const express = require("express");
const router = express.Router();
const controller = require("../controllers/versionController");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// Solo admin puede ver historial
router.get("/", auth, verifyRole("administrador"), controller.list);

// RF-30: Revertir a una versión anterior
router.post("/revertir/:id", auth, verifyRole("administrador"), controller.revertir);

module.exports = router;
