const ApiError = require("../../utils/ApiError");
const Mover = require("../../models/Mover");
const { toMover } = require("../../utils/serializers");

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
};
