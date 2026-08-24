const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./analytics.controller");

const router = express.Router();

const collectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Trop de requêtes analytics." } },
});

router.post("/collect", collectLimiter, controller.collect);

router.use(authenticate, requireRole("admin", "agent"));
router.get("/overview", controller.overview);
router.get("/traffic", controller.traffic);
router.get("/pages", controller.pages);

module.exports = router;
