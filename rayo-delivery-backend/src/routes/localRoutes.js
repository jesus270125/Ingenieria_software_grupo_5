const express = require("express");
const router = express.Router();
const controller = require("../controllers/localController");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// Solo admin crea o edita
router.post("/", auth, verifyRole("admin"), controller.create);
router.patch("/:id", auth, verifyRole("admin"), controller.update);

// Público
router.get("/", controller.list);

module.exports = router;
