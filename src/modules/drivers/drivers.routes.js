const express = require("express");
const { authenticate, requireRole, optionalAuth } = require("../../middlewares/auth.middleware");
const controller = require("./drivers.controller");

const router = express.Router();

router.get("/", optionalAuth, controller.list);
router.get("/:id", authenticate, requireRole("admin", "agent"), controller.getOne);
router.post("/", authenticate, requireRole("admin", "agent"), controller.create);
router.put("/:id", authenticate, requireRole("admin", "agent"), controller.update);
router.delete("/:id", authenticate, requireRole("admin"), controller.remove);
router.patch("/:id/toggle-active", authenticate, requireRole("admin", "agent"), controller.toggle);

module.exports = router;
