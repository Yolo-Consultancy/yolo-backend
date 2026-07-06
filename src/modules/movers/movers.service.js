const ApiError = require("../../utils/ApiError");
const Mover = require("../../models/Mover");
const Driver = require("../../models/Driver");
const Client = require("../../models/Client");
const { toMover } = require("../../utils/serializers");

function normalizeEmail(email) {
  const value = (email || "").trim().toLowerCase();
  return value || null;
}

function phoneDigits(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits || null;
}

function phonesMatch(a, b) {
  const da = phoneDigits(a);
  const db = phoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const sa = da.length > 9 ? da.slice(-9) : da;
  const sb = db.length > 9 ? db.slice(-9) : db;
  return sa.length >= 9 && sa === sb;
}

const ENTITY_LABELS = {
  mover: "déménageur",
  driver: "chauffeur",
  client: "client",
};

async function findEmailConflict(Model, type, email, excludeId) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const filter = {
    email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  };
  if (excludeId && type === "mover") {
    filter._id = { $ne: excludeId };
  }

  const doc = await Model.findOne(filter);
  if (!doc) return null;

  return {
    field: "email",
    type,
    typeLabel: ENTITY_LABELS[type],
    id: String(doc._id),
    name: `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || "Utilisateur",
    email: doc.email || "",
    phone: doc.phone || "",
  };
}

async function findPhoneConflict(Model, type, phone, excludeId) {
  const digits = phoneDigits(phone);
  if (!digits || digits.length < 9) return null;

  const filter = { phone: { $exists: true, $ne: "" } };
  if (excludeId && type === "mover") {
    filter._id = { $ne: excludeId };
  }

  const docs = await Model.find(filter);
  const doc = docs.find((item) => phonesMatch(item.phone, phone));
  if (!doc) return null;

  return {
    field: "phone",
    type,
    typeLabel: ENTITY_LABELS[type],
    id: String(doc._id),
    name: `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || "Utilisateur",
    email: doc.email || "",
    phone: doc.phone || "",
  };
}

async function checkContactDuplicates({ email, phone, excludeMoverId }) {
  const conflicts = [];
  const seen = new Set();

  const models = [
    [Mover, "mover"],
    [Driver, "driver"],
    [Client, "client"],
  ];

  for (const [Model, type] of models) {
    const emailConflict = await findEmailConflict(
      Model,
      type,
      email,
      type === "mover" ? excludeMoverId : undefined,
    );
    if (emailConflict) {
      const key = `email:${emailConflict.type}:${emailConflict.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        conflicts.push(emailConflict);
      }
    }

    const phoneConflict = await findPhoneConflict(
      Model,
      type,
      phone,
      type === "mover" ? excludeMoverId : undefined,
    );
    if (phoneConflict) {
      const key = `phone:${phoneConflict.type}:${phoneConflict.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        conflicts.push(phoneConflict);
      }
    }
  }

  return { conflicts };
}

async function listMovers() {
  const items = await Mover.find().sort({ createdAt: -1 });
  return items.map(toMover);
}

async function getMover(id) {
  const mover = await Mover.findById(id);
  if (!mover) throw new ApiError(404, "NOT_FOUND", "Déménageur introuvable");
  return toMover(mover);
}

async function createMover(body) {
  const mover = await Mover.create({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    hiredAt: body.hiredAt,
    salary: body.salary ?? 0,
    active: body.active !== false,
    notes: body.notes,
  });
  return toMover(mover);
}

async function updateMover(id, body) {
  const mover = await Mover.findById(id);
  if (!mover) throw new ApiError(404, "NOT_FOUND", "Déménageur introuvable");
  Object.assign(mover, {
    firstName: body.firstName ?? mover.firstName,
    lastName: body.lastName ?? mover.lastName,
    email: body.email ?? mover.email,
    phone: body.phone ?? mover.phone,
    hiredAt: body.hiredAt ?? mover.hiredAt,
    salary: body.salary ?? mover.salary,
    active: body.active ?? mover.active,
    notes: body.notes ?? mover.notes,
  });
  await mover.save();
  return toMover(mover);
}

async function deleteMover(id) {
  const mover = await Mover.findById(id);
  if (!mover) throw new ApiError(404, "NOT_FOUND", "Déménageur introuvable");
  mover.active = false;
  await mover.save();
  return { deleted: true };
}

module.exports = {
  listMovers,
  getMover,
  createMover,
  updateMover,
  deleteMover,
  checkContactDuplicates,
};
