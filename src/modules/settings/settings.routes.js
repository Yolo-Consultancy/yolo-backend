const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./settings.controller");

const router = express.Router();

router.get("/", controller.get);
router.put("/", authenticate, requireRole("admin"), controller.update);

module.exports = router;
