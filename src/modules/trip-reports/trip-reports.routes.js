const express = require("express");
const { authenticate, authenticateDriver, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./trip-reports.controller");

const router = express.Router();

router.get("/driver/missions", authenticateDriver, controller.myMissions);
router.post("/", authenticateDriver, controller.submit);
router.get("/", authenticate, requireRole("admin", "agent"), controller.list);
router.patch("/:id/read", authenticate, requireRole("admin", "agent"), controller.markRead);

module.exports = router;
