const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./stats.controller");

const router = express.Router();

router.use(authenticate, requireRole("admin", "agent"));
router.get("/overview", controller.overview);
router.get("/revenue", controller.revenue);
router.get("/vehicles/usage", controller.vehicleUsage);

module.exports = router;
