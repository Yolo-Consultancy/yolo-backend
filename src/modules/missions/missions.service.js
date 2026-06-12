const ApiError = require("../../utils/ApiError");
const Mission = require("../../models/Mission");
const Driver = require("../../models/Driver");
const Booking = require("../../models/Booking");
const { toMission, toBooking } = require("../../utils/serializers");
const { isMongoId, toMongoId } = require("../../utils/mongoIds");
const { notifyDriverMissionAssigned } = require("../../services/mission-email.service");

async function assertDriverNotBusy(driverId, excludeMissionId) {
  if (!driverId) return;
  const query = { assignee: driverId, status: "en_cours" };
  if (excludeMissionId) query._id = { $ne: excludeMissionId };
  const busy = await Mission.findOne(query);
  if (busy) {
    throw new ApiError(
      409,
      "DRIVER_BUSY",
      "Ce chauffeur a déjà une mission en cours et ne peut pas en recevoir une autre.",
    );
  }
}

async function loadBookingForEmail(bookingId) {
  if (!bookingId) return null;
  const booking = await Booking.findById(bookingId);
  return booking ? toBooking(booking) : null;
}

async function maybeNotifyDriver({ missionDoc, driver, bookingId, shouldNotify }) {
  if (!shouldNotify || !driver?.email?.trim()) {
    return { sent: false, reason: driver?.email ? "not_needed" : "no_driver_email" };
  }
  const booking = await loadBookingForEmail(bookingId);
  if (!booking) {
    return { sent: false, reason: "no_booking" };
  }
  const mission = toMission(missionDoc);
  return notifyDriverMissionAssigned({ mission, driver, booking });
}

async function listMissions() {
  const items = await Mission.find().sort({ scheduledAt: -1 });
  return items.map(toMission);
}

async function getMission(id) {
  if (!isMongoId(id)) throw new ApiError(400, "INVALID_ID", "Identifiant de mission invalide");
  const mission = await Mission.findById(id);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  return toMission(mission);
}

async function upsertMission(body) {
  let assigneeName = body.assigneeName || "";
  const assigneeId = toMongoId(body.assigneeId);
  let driver = null;

  if (assigneeId) {
    driver = await Driver.findById(assigneeId);
    if (!driver) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
    if (!driver.active) {
      throw new ApiError(400, "DRIVER_INACTIVE", "Ce chauffeur est inactif");
    }
    assigneeName = `${driver.firstName} ${driver.lastName}`.trim();
  }

  const missionId = toMongoId(body.id);
  const bookingId = toMongoId(body.bookingId);

  if (missionId) {
    const mission = await Mission.findById(missionId);
    if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");

    const previousAssignee = mission.assignee ? String(mission.assignee) : "";
    const previousBooking = mission.booking ? String(mission.booking) : "";
    const assigneeChanged = !!assigneeId && previousAssignee !== assigneeId;
    const effectiveAssignee = assigneeId || previousAssignee;
    const effectiveBooking = bookingId || previousBooking;

    if (assigneeChanged) {
      await assertDriverNotBusy(assigneeId, missionId);
    }

    if (!driver && effectiveAssignee) {
      driver = await Driver.findById(effectiveAssignee);
    }

    Object.assign(mission, {
      booking: bookingId || mission.booking,
      assignee: assigneeId || mission.assignee,
      assigneeName,
      type: body.type ?? mission.type,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : mission.scheduledAt,
      status: body.status ?? mission.status,
      notes: body.notes ?? mission.notes,
    });
    await mission.save();

    const bookingLinked = !!effectiveAssignee && !!effectiveBooking && previousBooking !== effectiveBooking;
    const shouldNotify = !!effectiveAssignee && (assigneeChanged || bookingLinked);

    const emailResult = await maybeNotifyDriver({
      missionDoc: mission,
      driver,
      bookingId: mission.booking,
      shouldNotify,
    });

    return {
      ...toMission(mission),
      emailSent: emailResult.sent,
      emailReason: emailResult.reason,
      emailPreviewUrl: emailResult.previewUrl,
    };
  }

  if (assigneeId) {
    await assertDriverNotBusy(assigneeId);
  }

  const mission = await Mission.create({
    booking: bookingId,
    assignee: assigneeId,
    assigneeName,
    type: body.type,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
    status: body.status || "a_affecter",
    notes: body.notes,
  });

  const emailResult = await maybeNotifyDriver({
    missionDoc: mission,
    driver,
    bookingId: mission.booking,
    shouldNotify: !!assigneeId,
  });

  return {
    ...toMission(mission),
    emailSent: emailResult.sent,
    emailReason: emailResult.reason,
    emailPreviewUrl: emailResult.previewUrl,
  };
}

async function deleteMission(id) {
  if (!isMongoId(id)) throw new ApiError(400, "INVALID_ID", "Identifiant de mission invalide");
  const mission = await Mission.findByIdAndDelete(id);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  return { deleted: true };
}

/** Chauffeurs ayant une mission en cours (pour désactivation côté UI). */
async function listBusyDriverIds(excludeMissionId) {
  const query = { status: "en_cours", assignee: { $ne: null } };
  if (excludeMissionId && isMongoId(excludeMissionId)) {
    query._id = { $ne: excludeMissionId };
  }
  const missions = await Mission.find(query).select("assignee");
  return [...new Set(missions.map((m) => String(m.assignee)))];
}

module.exports = {
  listMissions,
  getMission,
  upsertMission,
  deleteMission,
  listBusyDriverIds,
};
