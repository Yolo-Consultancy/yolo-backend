const ApiError = require("../../utils/ApiError");
const Mission = require("../../models/Mission");
const User = require("../../models/User");
const { toMission } = require("../../utils/serializers");

async function listMissions() {
  const items = await Mission.find().sort({ scheduledAt: -1 });
  return items.map(toMission);
}

async function getMission(id) {
  const mission = await Mission.findById(id);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  return toMission(mission);
}

async function upsertMission(body) {
  let assigneeName = body.assigneeName || "";
  if (body.assigneeId) {
    const user = await User.findById(body.assigneeId);
    if (user) assigneeName = user.name;
  }

  if (body.id) {
    const mission = await Mission.findById(body.id);
    if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
    Object.assign(mission, {
      booking: body.bookingId || mission.booking,
      assignee: body.assigneeId || mission.assignee,
      assigneeName,
      type: body.type ?? mission.type,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : mission.scheduledAt,
      status: body.status ?? mission.status,
      notes: body.notes ?? mission.notes,
    });
    await mission.save();
    return toMission(mission);
  }

  const mission = await Mission.create({
    booking: body.bookingId,
    assignee: body.assigneeId,
    assigneeName,
    type: body.type,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
    status: body.status || "a_affecter",
    notes: body.notes,
  });
  return toMission(mission);
}

async function deleteMission(id) {
  const mission = await Mission.findByIdAndDelete(id);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  return { deleted: true };
}

module.exports = { listMissions, getMission, upsertMission, deleteMission };
