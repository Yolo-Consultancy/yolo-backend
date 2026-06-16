const express = require("express");
const rateLimit = require("express-rate-limit");
const { validate } = require("../../middlewares/validate.middleware");
const { authenticate, authenticateClient, authenticateDriver } = require("../../middlewares/auth.middleware");
const { loginSchema } = require("./auth.validators");
const controller = require("./auth.controller");
const clientAuth = require("./client-auth.controller");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Trop de tentatives" } },
});

router.post("/client/register", clientAuth.register);
router.post("/client/login", loginLimiter, clientAuth.login);
router.get("/client/me", authenticateClient, clientAuth.me);
const driverAuth = require("./driver-auth.controller");
router.post("/driver/login", loginLimiter, driverAuth.login);
router.get("/driver/me", authenticateDriver, driverAuth.me);
router.post("/login", loginLimiter, validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);

module.exports = router;
