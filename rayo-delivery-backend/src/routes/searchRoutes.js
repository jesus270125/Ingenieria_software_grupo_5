const express = require("express");
const router = express.Router();
const controller = require("../controllers/searchController");

// No requiere login
router.get("/", controller.buscar);

module.exports = router;
