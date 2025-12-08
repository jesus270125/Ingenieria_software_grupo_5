const express = require("express");
const router = express.Router();
const controller = require("../controllers/versionController");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// Solo admin puede ver historial
router.get("/", auth, verifyRole("admin"), controller.list);

module.exports = router;
