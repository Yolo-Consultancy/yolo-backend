/** Comptes admin portails — utilisés par scripts/seed.js */
module.exports = [
  {
    email: process.env.ADMIN_VEHICULES_EMAIL || "admin.vehicule@yolo.com",
    name: "Admin Location YOLO",
    portalScope: "vehicules",
    password: process.env.ADMIN_VEHICULES_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || "yolo2026",
  },
  {
    email: process.env.ADMIN_DEMENAGEMENT_EMAIL || "admin.demenagement@yolo.com",
    name: "Admin Déménagement YOLO",
    portalScope: "demenagement",
    password: process.env.ADMIN_DEMENAGEMENT_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || "yolo2026",
  },
  {
    email: process.env.ADMIN_SURMESURE_EMAIL || "admin.surmesure@yolo.com",
    name: "Admin Sur Mesure YOLO",
    portalScope: "sur_mesure",
    password: process.env.ADMIN_SURMESURE_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || "yolo2026",
  },
];
