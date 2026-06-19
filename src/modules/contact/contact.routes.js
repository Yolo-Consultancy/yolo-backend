const express = require("express");
const { authenticate, authenticateClient, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./contact.controller");

const router = express.Router();

router.post("/", controller.create);
router.get("/mine", authenticateClient, controller.listMine);
router.get("/", authenticate, requireRole("admin", "agent"), controller.list);
router.patch("/:id/status", authenticate, requireRole("admin", "agent"), controller.updateStatus);

module.exports = router;
