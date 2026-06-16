const env = require("../../config/env");
const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const unifiedAuth = require("./unified-auth.service");

const REFRESH_COOKIE = "yolo_refresh";

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const login = asyncHandler(async (req, res) => {
  const result = await unifiedAuth.unifiedLogin(req.body.email, req.body.password);

  if (result.role === "admin" && result.refreshToken) {
    setRefreshCookie(res, result.refreshToken);
  } else {
    res.clearCookie(REFRESH_COOKIE);
  }

  const { refreshToken, ...payload } = result;
  ok(res, payload);
});

module.exports = { login };
