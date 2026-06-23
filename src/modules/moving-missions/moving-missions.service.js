const ApiError = require("../../utils/ApiError");
const MovingMission = require("../../models/MovingMission");
const Mover = require("../../models/Mover");
const ContactMessage = require("../../models/ContactMessage");
const { toMovingMission } = require("../../utils/serializers");
const { isMongoId, toMongoId } = require("../../utils/mongoIds");

async function assertMoverNotBusy(moverId, excludeMissionId) {
  if (!moverId) return;
  const query = { assignee: moverId, status: "en_cours" };
  if (excludeMissionId) query._id = { $ne: excludeMissionId };
  const busy = await MovingMission.findOne(query);
  if (busy) {
    throw new ApiError(
      409,
      "MOVER_BUSY",
      "Ce déménageur a déjà une mission en cours et ne peut pas en recevoir une autre.",
    );
  }
}

async function syncContactStatus(contactMessageId, missionStatus) {
  if (!contactMessageId || !isMongoId(contactMessageId)) return;
  const contact = await ContactMessage.findById(contactMessageId);
  if (!contact || contact.serviceType !== "demenagement") return;

  if (missionStatus === "en_cours") {
    contact.status = "en_cours";
    contact.handled = true;
  } else if (missionStatus === "terminee") {
    contact.status = "traite";
    contact.handled = true;
  } else if (missionStatus === "a_affecter") {
    contact.status = contact.status === "traite" ? "traite" : "nouveau";
  }
  await contact.save();
}

async function listMovingMissions() {
  const items = await MovingMission.find().sort({ scheduledAt: -1 });
  return items.map(toMovingMission);
}

async function getMovingMission(id) {
  if (!isMongoId(id)) throw new ApiError(400, "INVALID_ID", "Identifiant de mission invalide");
  const mission = await MovingMission.findById(id);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  return toMovingMission(mission);
}

async function upsertMovingMission(body) {
  let assigneeName = body.assigneeName || "";
  const assigneeId = toMongoId(body.assigneeId);
  let mover = null;

  if (assigneeId) {
    mover = await Mover.findById(assigneeId);
    if (!mover) throw new ApiError(404, "NOT_FOUND", "Déménageur introuvable");
    if (!mover.active) {
      throw new ApiError(400, "MOVER_INACTIVE", "Ce déménageur est inactif");
    }
    assigneeName = `${mover.firstName} ${mover.lastName}`.trim();
  }

  const missionId = toMongoId(body.id);
  const contactMessageId = toMongoId(body.contactMessageId);

  if (missionId) {
    const mission = await MovingMission.findById(missionId);
    if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");

    const previousAssignee = mission.assignee ? String(mission.assignee) : "";
    const assigneeChanged = !!assigneeId && previousAssignee !== assigneeId;
    const newStatus = body.status ?? mission.status;

    if (assigneeChanged) {
      await assertMoverNotBusy(assigneeId, missionId);
    }

    Object.assign(mission, {
      contactMessage: contactMessageId || mission.contactMessage,
      assignee: assigneeId || mission.assignee,
      assigneeName,
      type: body.type ?? mission.type,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : mission.scheduledAt,
      status: newStatus,
      notes: body.notes ?? mission.notes,
    });
    await mission.save();
    await syncContactStatus(mission.contactMessage, mission.status);
    return toMovingMission(mission);
  }

  if (assigneeId) {
    await assertMoverNotBusy(assigneeId);
  }

  const mission = await MovingMission.create({
    contactMessage: contactMessageId,
    assignee: assigneeId,
    assigneeName,
    type: body.type || "complet",
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
    status: body.status || "a_affecter",
    notes: body.notes,
  });

  await syncContactStatus(mission.contactMessage, mission.status);
  return toMovingMission(mission);
}

async function deleteMovingMission(id) {
  if (!isMongoId(id)) throw new ApiError(400, "INVALID_ID", "Identifiant de mission invalide");
  const mission = await MovingMission.findByIdAndDelete(id);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  return { deleted: true };
}

async function listBusyMoverIds(excludeMissionId) {
  const query = { status: "en_cours", assignee: { $ne: null } };
  if (excludeMissionId && isMongoId(excludeMissionId)) {
    query._id = { $ne: excludeMissionId };
  }
  const missions = await MovingMission.find(query).select("assignee");
  return [...new Set(missions.map((m) => String(m.assignee)))];
}

module.exports = {
  listMovingMissions,
  getMovingMission,
  upsertMovingMission,
  deleteMovingMission,
  listBusyMoverIds,
};
