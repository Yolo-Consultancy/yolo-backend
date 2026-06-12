const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const Client = require("../models/Client");

async function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "UNAUTHORIZED", "Token manquant"));

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(payload.sub).select("-passwordHash -refreshTokenHash");
    if (!user || !user.active) {
      return next(new ApiError(401, "UNAUTHORIZED", "Utilisateur invalide"));
    }
    req.user = user;
    next();
  } catch {
    next(new ApiError(401, "UNAUTHORIZED", "Token invalide ou expiré"));
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "UNAUTHORIZED", "Non authentifié"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "FORBIDDEN", "Accès refusé"));
    }
    next();
  };
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  jwt.verify(token, env.jwtAccessSecret, async (err, payload) => {
    if (!err && payload?.sub) {
      const user = await User.findById(payload.sub).select("-passwordHash -refreshTokenHash");
      if (user?.active) req.user = user;
    }
    next();
  });
}

async function authenticateClient(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "UNAUTHORIZED", "Token manquant"));

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    if (payload.type !== "client") {
      return next(new ApiError(401, "UNAUTHORIZED", "Token client invalide"));
    }
    const client = await Client.findById(payload.sub).select("-passwordHash");
    if (!client) return next(new ApiError(401, "UNAUTHORIZED", "Client introuvable"));
    req.client = client;
    next();
  } catch {
    next(new ApiError(401, "UNAUTHORIZED", "Token invalide ou expiré"));
  }
}

module.exports = { authenticate, authenticateClient, requireRole, optionalAuth };
