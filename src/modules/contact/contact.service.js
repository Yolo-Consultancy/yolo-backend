const ApiError = require("../../utils/ApiError");
const ContactMessage = require("../../models/ContactMessage");
const { isMongoId } = require("../../utils/mongoIds");

const SERVICE_TYPES = new Set(["vehicules", "demenagement", "sur_mesure", "general"]);
const STATUSES = new Set(["nouveau", "en_cours", "traite", "annule"]);

function serializeMessage(m) {
  return {
    id: String(m._id),
    name: m.name || "",
    email: m.email || "",
    phone: m.phone || "",
    subject: m.subject || "",
    message: m.message || "",
    serviceType: m.serviceType || "general",
    status: m.status || "nouveau",
    handled: !!m.handled,
    createdAt: m.createdAt ? m.createdAt.toISOString() : "",
  };
}

function normalizeServiceType(value) {
  const v = String(value || "general").trim().toLowerCase();
  return SERVICE_TYPES.has(v) ? v : "general";
}

async function createMessage(body) {
  const msg = await ContactMessage.create({
    name: body.name?.trim(),
    email: body.email?.trim().toLowerCase(),
    phone: body.phone?.trim(),
    subject: body.subject?.trim(),
    message: body.message?.trim(),
    serviceType: normalizeServiceType(body.serviceType),
    status: "nouveau",
    handled: false,
  });
  return serializeMessage(msg);
}

async function listMessages(filters = {}) {
  const query = {};
  if (filters.serviceType && SERVICE_TYPES.has(filters.serviceType)) {
    query.serviceType = filters.serviceType;
  }
  if (filters.status && STATUSES.has(filters.status)) {
    query.status = filters.status;
  }
  const items = await ContactMessage.find(query).sort({ createdAt: -1 }).limit(300);
  return items.map(serializeMessage);
}

async function listClientMessages(clientEmail, serviceType) {
  const email = clientEmail?.trim().toLowerCase();
  if (!email) return [];
  const query = { email };
  if (serviceType && SERVICE_TYPES.has(serviceType)) {
    query.serviceType = serviceType;
  }
  const items = await ContactMessage.find(query).sort({ createdAt: -1 }).limit(100);
  return items.map(serializeMessage);
}

async function updateMessageStatus(id, status) {
  if (!isMongoId(id)) throw new ApiError(400, "INVALID_ID", "Identifiant invalide");
  if (!STATUSES.has(status)) throw new ApiError(400, "VALIDATION_ERROR", "Statut invalide");
  const msg = await ContactMessage.findById(id);
  if (!msg) throw new ApiError(404, "NOT_FOUND", "Demande introuvable");
  msg.status = status;
  msg.handled = status === "traite" || status === "annule";
  await msg.save();
  return serializeMessage(msg);
}

module.exports = {
  createMessage,
  listMessages,
  listClientMessages,
  updateMessageStatus,
};
