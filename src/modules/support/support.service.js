const ApiError = require("../../utils/ApiError");
const SupportMessage = require("../../models/SupportMessage");
const Client = require("../../models/Client");

function toMessage(doc) {
  return {
    id: String(doc._id),
    sender: doc.sender,
    text: doc.text,
    timestamp: doc.createdAt.toISOString(),
  };
}

function buildAutoReply(text, client) {
  const lower = text.toLowerCase();
  if (lower.includes("heure") || lower.includes("modifier") || lower.includes("horaire") || lower.includes("date")) {
    return "Certainement, nous pouvons modifier cela pour vous. Indiquez la référence de votre réservation ainsi que les nouveaux horaires souhaités.";
  }
  if (lower.includes("sur-mesure") || lower.includes("mesure") || lower.includes("vip") || lower.includes("evenement") || lower.includes("garde") || lower.includes("securite")) {
    return "YOLO propose gardes du corps, assistants bilingues, traiteurs de luxe et réservations VIP. Quelle prestation souhaitez-vous planifier ?";
  }
  if (lower.includes("paiement") || lower.includes("payer") || lower.includes("stripe") || lower.includes("carte") || lower.includes("facture")) {
    return "Pour un problème de paiement, précisez le numéro de réservation. Nos services financiers vérifieront son statut.";
  }
  if (lower.includes("chauffeur") || lower.includes("driver")) {
    return "Nos chauffeurs VIP sont disponibles à $80/jour. Souhaitez-vous en ajouter un à une réservation existante ?";
  }
  return `J'ai bien reçu votre message. Un concierge YOLO vous recontactera rapidement au ${client.countryCode || ""} ${client.phone || ""}.`;
}

async function ensureWelcomeMessages(clientId, client) {
  const count = await SupportMessage.countDocuments({ client: clientId });
  if (count > 0) return [];

  const welcome = [
    {
      client: clientId,
      sender: "agent",
      text: `Bonjour ${client.firstName} ! Je suis votre assistant concierge YOLO. Comment puis-je vous accompagner ?`,
    },
    {
      client: clientId,
      sender: "agent",
      text: "Posez vos questions sur vos réservations, horaires, paiements ou services sur mesure.",
    },
  ];
  const docs = await SupportMessage.insertMany(welcome);
  return docs.map(toMessage);
}

async function listMessages(clientId) {
  const client = await Client.findById(clientId);
  if (!client) throw new ApiError(404, "NOT_FOUND", "Client introuvable");

  await ensureWelcomeMessages(clientId, client);
  const items = await SupportMessage.find({ client: clientId }).sort({ createdAt: 1 });
  return items.map(toMessage);
}

async function sendMessage(clientId, text) {
  const client = await Client.findById(clientId);
  if (!client) throw new ApiError(404, "NOT_FOUND", "Client introuvable");
  if (!text?.trim()) throw new ApiError(400, "VALIDATION_ERROR", "Message vide");

  await SupportMessage.create({ client: clientId, sender: "client", text: text.trim() });

  const replyText = buildAutoReply(text, client);
  await SupportMessage.create({ client: clientId, sender: "agent", text: replyText });

  return listMessages(clientId);
}

async function resetMessages(clientId) {
  await SupportMessage.deleteMany({ client: clientId });
  const client = await Client.findById(clientId);
  if (!client) throw new ApiError(404, "NOT_FOUND", "Client introuvable");
  await ensureWelcomeMessages(clientId, client);
  return listMessages(clientId);
}

module.exports = { listMessages, sendMessage, resetMessages };
