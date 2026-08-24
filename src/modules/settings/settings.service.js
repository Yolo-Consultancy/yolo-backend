const Settings = require("../../models/Settings");

const defaults = {
  companyName: "YOLO Le Concierge",
  whatsappNumber: "243830538687",
  contactEmail: "contact@yololeconcierge.com",
  address:
    "N° Avenue Tabu ley, (Ex. Tombalbaye), Quartier Golfe, Gombe, Kinshasa RD Congo",
  heroTitle: "Une seule plateforme, tous vos services.",
  heroSubtitle: "Conciergerie premium 24/7 — Mobilité, Logistique, Sur Mesure.",
  depositCurrency: "FCFA",
};

const LEGACY_ADDRESSES = new Set([
  "Kinshasa, République Démocratique du Congo",
  "Gombe, Kinshasa, RDC",
  "Kinshasa, RDC",
]);

const LEGACY_WHATSAPP_NUMBER = "243828863897";

function normalizeWhatsAppNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

async function getSettings() {
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create(defaults);
  } else {
    let changed = false;
    if (!doc.address?.trim() || LEGACY_ADDRESSES.has(doc.address.trim())) {
      doc.address = defaults.address;
      changed = true;
    }
    if (normalizeWhatsAppNumber(doc.whatsappNumber) === LEGACY_WHATSAPP_NUMBER) {
      doc.whatsappNumber = defaults.whatsappNumber;
      changed = true;
    }
    if (changed) await doc.save();
  }
  const s = doc.toObject();
  return {
    companyName: s.companyName,
    whatsappNumber: s.whatsappNumber,
    contactEmail: s.contactEmail,
    address: s.address,
    heroTitle: s.heroTitle,
    heroSubtitle: s.heroSubtitle,
    depositCurrency: s.depositCurrency,
  };
}

async function saveSettings(body) {
  let doc = await Settings.findOne();
  if (!doc) doc = new Settings(defaults);
  Object.assign(doc, body);
  await doc.save();
  return getSettings();
}

module.exports = { getSettings, saveSettings };
