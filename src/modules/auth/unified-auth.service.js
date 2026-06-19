const authService = require("./auth.service");
const clientAuth = require("./client-auth.service");
const driverAuth = require("./driver-auth.service");
const ApiError = require("../../utils/ApiError");
const { assertPortalMatch } = require("../../utils/portal");

async function unifiedLogin(email, password, loginPortal) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Admin / agent
  try {
    const result = await authService.login(normalizedEmail, password);
    assertPortalMatch(result.user.portalScope, loginPortal);
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
    if (err.code === "PORTAL_MISMATCH") throw err;
    if (err.code !== "INVALID_CREDENTIALS") throw err;
  }

  // 3. Client
  try {
    const result = await clientAuth.loginClient(normalizedEmail, password, loginPortal);
    return {
      role: "client",
      accessToken: result.accessToken,
      account: result.account,
    };
  } catch (err) {
    if (err.code === "PORTAL_MISMATCH") throw err;
    if (err.code !== "INVALID_CREDENTIALS") throw err;
  }

  throw new ApiError(401, "INVALID_CREDENTIALS", "E-mail ou mot de passe incorrect");
}

module.exports = { unifiedLogin };
