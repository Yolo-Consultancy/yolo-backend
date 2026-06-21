const authService = require("./auth.service");
const clientAuth = require("./client-auth.service");
const driverAuth = require("./driver-auth.service");
const ApiError = require("../../utils/ApiError");
const { assertPortalMatch, normalizePortal, PORTAL_LABELS } = require("../../utils/portal");

function assertAdminPortalAccess(user, loginPortal) {
  const scope = user.portalScope || "all";
  if (scope === "all") return;

  const expected = normalizePortal(loginPortal);
  if (!expected) {
    const label = PORTAL_LABELS[scope] || scope;
    throw new ApiError(
      403,
      "PORTAL_REQUIRED",
      `Ce compte admin appartient au portail « ${label} ». Connectez-vous depuis ce portail.`,
    );
  }
  assertPortalMatch(scope, loginPortal);
}

async function unifiedLogin(email, password, loginPortal) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Admin / agent
  try {
    const result = await authService.login(normalizedEmail, password);
    assertAdminPortalAccess(result.user, loginPortal);
    return {
      role: "admin",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  } catch (err) {
    if (err.code === "PORTAL_MISMATCH") throw err;
    if (err.code !== "INVALID_CREDENTIALS") throw err;
  }

  // 2. Chauffeur (portail location uniquement)
  try {
    const result = await driverAuth.loginDriver(normalizedEmail, password);
    assertPortalMatch("vehicules", loginPortal);
    return {
      role: "driver",
      accessToken: result.accessToken,
      account: result.account,
    };
  } catch (err) {
    if (err.code === "PORTAL_MISMATCH" || err.code === "PORTAL_REQUIRED") throw err;
    if (err.code !== "INVALID_CREDENTIALS") throw err;
  }

  // 3. Client (accès unifié — tous les services)
  try {
    const result = await clientAuth.loginClient(normalizedEmail, password);
    return {
      role: "client",
      accessToken: result.accessToken,
      account: result.account,
    };
  } catch (err) {
    if (err.code !== "INVALID_CREDENTIALS") throw err;
  }

  throw new ApiError(401, "INVALID_CREDENTIALS", "E-mail ou mot de passe incorrect");
}

module.exports = { unifiedLogin };
