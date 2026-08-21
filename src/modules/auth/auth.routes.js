const express = require("express");
const rateLimit = require("express-rate-limit");
const { validate } = require("../../middlewares/validate.middleware");
const { authenticate, authenticateClient, authenticateDriver } = require("../../middlewares/auth.middleware");
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("./auth.validators");
const controller = require("./auth.controller");
const clientAuth = require("./client-auth.controller");
const passwordResetService = require("./client-password-reset.service");
const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Trop de tentatives" } },
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Trop de demandes. Réessayez plus tard." } },
});

router.post("/client/register", clientAuth.register);
router.post("/client/login", loginLimiter, clientAuth.login);
router.post(
  "/client/forgot-password",
  forgotLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await passwordResetService.requestClientPasswordReset(req.body.email);
    ok(res, {
      message:
        "Si un compte client existe avec cet e-mail, vous recevrez un lien de réinitialisation sous peu.",
    });
  }),
);
router.post(
  "/client/reset-password",
  loginLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    ok(res, await passwordResetService.resetClientPassword(req.body.token, req.body.password));
  }),
);
router.get("/client/me", authenticateClient, clientAuth.me);
const driverAuth = require("./driver-auth.controller");
const unifiedAuth = require("./unified-auth.controller");
router.post("/unified-login", loginLimiter, unifiedAuth.login);
router.post("/driver/login", loginLimiter, driverAuth.login);
router.get("/driver/me", authenticateDriver, driverAuth.me);
router.post("/login", loginLimiter, validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);

module.exports = router;
