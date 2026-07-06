const ApiError = require("../../utils/ApiError");
const MovingMission = require("../../models/MovingMission");
const Mover = require("../../models/Mover");
const ContactMessage = require("../../models/ContactMessage");
const { toMovingMission } = require("../../utils/serializers");
const { isMongoId, toMongoId } = require("../../utils/mongoIds");

const ASSIGNED_MISSION_FILTER = {
  $or: [
    { assignees: { $exists: true, $not: { $size: 0 } } },
    { assignee: { $ne: null } },
  ],
};

function scheduledDayBounds(scheduledAt) {
  const day = new Date(scheduledAt).toISOString().slice(0, 10);
  return {
    day,
    start: new Date(`${day}T00:00:00.000Z`),
    end: new Date(`${day}T23:59:59.999Z`),
  };
}

function moverIdsFromMission(doc) {
  if (doc.assignees?.length) {
    return doc.assignees.map((id) => String(id));
  }
  if (doc.assignee) return [String(doc.assignee)];
  return [];
}

async function resolveAssignees(rawIds) {
  const uniqueIds = [...new Set((rawIds || []).map((id) => toMongoId(id)).filter(Boolean))];
  if (!uniqueIds.length) {
    return { assignees: [], assigneeNames: [] };
  }

  const movers = await Mover.find({ _id: { $in: uniqueIds } });
  if (movers.length !== uniqueIds.length) {
    throw new ApiError(404, "NOT_FOUND", "Un ou plusieurs déménageurs sont introuvables.");
  }

  const inactive = movers.find((m) => !m.active);
  if (inactive) {
    throw new ApiError(
      400,
      "MOVER_INACTIVE",
      `${inactive.firstName} ${inactive.lastName} est inactif.`,
    );
  }

  const byId = new Map(movers.map((m) => [String(m._id), m]));
  const assignees = uniqueIds;
  const assigneeNames = uniqueIds.map((id) => {
    const mover = byId.get(String(id));
    return mover ? `${mover.firstName} ${mover.lastName}`.trim() : "";
  });

  return { assignees, assigneeNames };
}

async function listBusyMoverIds(scheduledAt, excludeMissionId) {
  if (!scheduledAt) return [];

  const { start, end } = scheduledDayBounds(scheduledAt);
  const query = {
    scheduledAt: { $gte: start, $lte: end },
    status: { $in: ["a_affecter", "en_cours"] },
    ...ASSIGNED_MISSION_FILTER,
  };
  if (excludeMissionId && isMongoId(excludeMissionId)) {
    query._id = { $ne: excludeMissionId };
  }

  const missions = await MovingMission.find(query).select("assignee assignees");
  const busy = new Set();
  for (const mission of missions) {
    for (const id of moverIdsFromMission(mission)) {
      busy.add(id);
    }
  }
  return [...busy];
}

async function assertMoversAvailable(moverIds, scheduledAt, excludeMissionId) {
  if (!moverIds.length || !scheduledAt) return;

  const busyIds = await listBusyMoverIds(scheduledAt, excludeMissionId);
  const conflictId = moverIds.find((id) => busyIds.includes(String(id)));
  if (!conflictId) return;

  const mover = await Mover.findById(conflictId);
  const name = mover ? `${mover.firstName} ${mover.lastName}` : "Ce déménageur";
  const { day } = scheduledDayBounds(scheduledAt);
  throw new ApiError(
    409,
    "MOVER_BUSY",
    `${name} est déjà affecté à une mission le ${day}.`,
  );
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
  const items = await MovingMission.find(ASSIGNED_MISSION_FILTER).sort({ scheduledAt: -1 });
  return items.map(toMovingMission);
}

async function getMovingMission(id) {
  if (!isMongoId(id)) throw new ApiError(400, "INVALID_ID", "Identifiant de mission invalide");
  const mission = await MovingMission.findById(id);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  return toMovingMission(mission);
}

async function upsertMovingMission(body) {
  const missionId = toMongoId(body.id);
  const contactMessageId = toMongoId(body.contactMessageId);
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : new Date();

  const rawAssigneeIds = Array.isArray(body.assigneeIds)
    ? body.assigneeIds
    : body.assigneeId
      ? [body.assigneeId]
      : [];

  const { assignees, assigneeNames } = await resolveAssignees(rawAssigneeIds);

  if (!assignees.length) {
    throw new ApiError(
      400,
      "ASSIGNEE_REQUIRED",
      "Affectez au moins un déménageur pour créer une mission.",
    );
  }
  if (!contactMessageId) {
    throw new ApiError(
      400,
      "CONTACT_REQUIRED",
      "Associez une demande client à la mission.",
    );
  }

  await assertMoversAvailable(assignees.map(String), scheduledAt, missionId);

  if (missionId) {
    const mission = await MovingMission.findById(missionId);
    if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");

    Object.assign(mission, {
      contactMessage: contactMessageId,
      assignees,
      assigneeNames,
      assignee: assignees[0] || null,
      assigneeName: assigneeNames.join(", "),
      type: body.type ?? mission.type,
      scheduledAt,
      status: body.status ?? mission.status,
      notes: body.notes ?? mission.notes,
    });
    await mission.save();
    await syncContactStatus(mission.contactMessage, mission.status);
    return toMovingMission(mission);
  }

  const mission = await MovingMission.create({
    contactMessage: contactMessageId,
    assignees,
    assigneeNames,
    assignee: assignees[0] || null,
    assigneeName: assigneeNames.join(", "),
    type: body.type || "complet",
    scheduledAt,
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

async function getBusyDates() {
  const missions = await MovingMission.find({
    status: { $in: ["a_affecter", "en_cours"] },
    ...ASSIGNED_MISSION_FILTER,
  }).select("scheduledAt");

  const dates = new Set();
  for (const mission of missions) {
    if (!mission.scheduledAt) continue;
    dates.add(mission.scheduledAt.toISOString().slice(0, 10));
  }
  return [...dates].sort();
}

module.exports = {
  listMovingMissions,
  getMovingMission,
  upsertMovingMission,
  deleteMovingMission,
  listBusyMoverIds,
  getBusyDates,
};
