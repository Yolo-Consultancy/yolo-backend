const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const User = require("../../models/User");
const { toUser } = require("../../utils/serializers");

const BCRYPT_ROUNDS = 12;

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.active) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email ou mot de passe incorrect");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "INVALID_CREDENTIALS", "Email ou mot de passe incorrect");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken, user: toUser(user) };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new ApiError(401, "UNAUTHORIZED", "Refresh token manquant");

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Refresh token invalide");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, "UNAUTHORIZED", "Session expirée");
  }

  const accessToken = signAccessToken(user);
  return { accessToken, user: toUser(user) };
}

async function logout(userId) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "NOT_FOUND", "Utilisateur introuvable");
  return toUser(user);
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

module.exports = { login, refresh, logout, getMe, hashPassword, signAccessToken, signRefreshToken };
