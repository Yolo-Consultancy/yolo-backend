const express = require("express");
const { authenticate, requireRole, optionalAuth } = require("../../middlewares/auth.middleware");
const controller = require("./vehicles.controller");

const router = express.Router();

router.get("/", optionalAuth, controller.list);
router.get("/:id", controller.getOne);
router.post("/", authenticate, requireRole("admin"), controller.create);
router.put("/:id", authenticate, requireRole("admin"), controller.update);
router.delete("/:id", authenticate, requireRole("admin"), controller.remove);
router.patch("/:id/images/order", authenticate, requireRole("admin"), controller.reorderImages);
router.delete("/:id/images", authenticate, requireRole("admin"), controller.deleteImage);

module.exports = router;
