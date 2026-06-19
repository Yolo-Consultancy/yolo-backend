const ApiError = require("./ApiError");

const PORTAL_LABELS = {
  vehicules: "Location véhicules",
  demenagement: "Déménagement",
  sur_mesure: "Services sur mesure",
};

function normalizePortal(portal) {
  if (!portal) return null;
  const p = String(portal).trim().toLowerCase();
  if (p === "sur-mesure" || p === "sur_mesure") return "sur_mesure";
  if (["vehicules", "demenagement", "sur_mesure"].includes(p)) return p;
  return null;
}

function assertPortalMatch(accountScope, loginPortal) {
  const expected = normalizePortal(loginPortal);
  if (!expected) return;

  const scope = accountScope || "vehicules";
  if (scope === "all") return;

  if (scope !== expected) {
    const label = PORTAL_LABELS[scope] || scope;
    throw new ApiError(
      403,
      "PORTAL_MISMATCH",
      `Ce compte appartient au portail « ${label} ». Connectez-vous depuis ce portail.`,
    );
  }
}

module.exports = { normalizePortal, assertPortalMatch, PORTAL_LABELS };
