const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./bookings.controller");

const router = express.Router();

router.post("/", controller.create);
router.get("/", authenticate, requireRole("admin", "agent"), controller.list);
router.get("/:id", authenticate, requireRole("admin", "agent"), controller.getOne);
router.patch("/:id/status", authenticate, requireRole("admin", "agent"), controller.updateStatus);
router.patch("/:id/assign-driver", authenticate, requireRole("admin", "agent"), controller.assignDriver);
router.delete("/:id", authenticate, requireRole("admin"), controller.remove);

module.exports = router;
