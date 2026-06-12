const env = require("../../config/env");
const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const authService = require("./auth.service");

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
  const result = await authService.login(req.body.email, req.body.password);
  setRefreshCookie(res, result.refreshToken);
  ok(res, { accessToken: result.accessToken, user: result.user });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  const result = await authService.refresh(token);
  ok(res, result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie(REFRESH_COOKIE);
  ok(res, { loggedOut: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  ok(res, user);
});

module.exports = { login, refresh, logout, me };
