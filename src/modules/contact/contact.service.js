const ContactMessage = require("../../models/ContactMessage");

async function createMessage(body) {
  const msg = await ContactMessage.create(body);
  return {
    id: String(msg._id),
    name: msg.name,
    email: msg.email,
    phone: msg.phone,
    subject: msg.subject,
    message: msg.message,
    handled: msg.handled,
    createdAt: msg.createdAt,
  };
}

async function listMessages() {
  const items = await ContactMessage.find().sort({ createdAt: -1 });
  return items.map((m) => ({
    id: String(m._id),
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    handled: m.handled,
    createdAt: m.createdAt,
  }));
}

module.exports = { createMessage, listMessages };
