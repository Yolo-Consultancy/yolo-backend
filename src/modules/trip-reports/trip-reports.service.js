const ApiError = require("../../utils/ApiError");
const Mission = require("../../models/Mission");
const Booking = require("../../models/Booking");
const TripReport = require("../../models/TripReport");
const Driver = require("../../models/Driver");
const { toMission, toTripReport } = require("../../utils/serializers");
const { isMongoId } = require("../../utils/mongoIds");
const {
  notifyAdminTripReport,
  generateRatingToken,
} = require("../../services/trip-report-email.service");
const { sendClientRatingRequest } = require("../../services/rating-email.service");

async function listDriverMissions(driverId) {
  const missions = await Mission.find({
    assignee: driverId,
    status: { $in: ["en_cours", "terminee"] },
  })
    .sort({ scheduledAt: -1 })
    .limit(100);

  const missionIds = missions.map((m) => m._id);
  const reports = await TripReport.find({ mission: { $in: missionIds } }).select("mission");
  const reportedIds = new Set(reports.map((r) => String(r.mission)));

  const bookingIds = missions.map((m) => m.booking).filter(Boolean);
  const bookings = await Booking.find({ _id: { $in: bookingIds } });
  const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));

  return missions.map((m) => {
    const base = toMission(m);
    const booking = m.booking ? bookingMap.get(String(m.booking)) : null;
    return {
      ...base,
      clientName: booking?.clientName || "",
      vehicleName: booking?.vehicleName || "",
      pickupLocation: booking?.pickupLocation || "",
      dropoffLocation: booking?.dropoffLocation || "",
      startDate: booking?.startDate ? booking.startDate.toISOString().slice(0, 10) : "",
      endDate: booking?.endDate ? booking.endDate.toISOString().slice(0, 10) : "",
      hasReport: reportedIds.has(String(m._id)),
    };
  });
}

async function submitTripReport(driverId, body) {
  const missionId = body.missionId;
  if (!isMongoId(missionId)) {
    throw new ApiError(400, "INVALID_ID", "Identifiant de mission invalide");
  }
  if (!body.notes?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Le compte-rendu est obligatoire");
  }

  const mission = await Mission.findById(missionId);
  if (!mission) throw new ApiError(404, "NOT_FOUND", "Mission introuvable");
  if (String(mission.assignee) !== String(driverId)) {
    throw new ApiError(403, "FORBIDDEN", "Cette mission ne vous est pas affectée");
  }
  if (mission.status !== "en_cours") {
    throw new ApiError(400, "INVALID_STATUS", "Seules les missions en cours peuvent être clôturées");
  }

  const existing = await TripReport.findOne({ mission: missionId });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "Un rapport a déjà été envoyé pour cette mission");
  }

  const driver = await Driver.findById(driverId);
  const booking = mission.booking ? await Booking.findById(mission.booking) : null;

  const ratingToken = generateRatingToken();
  const submittedAt = new Date();
  const report = await TripReport.create({
    mission: missionId,
    driver: driverId,
    booking: mission.booking,
    clientName: booking?.clientName || "",
    clientEmail: booking?.clientEmail || "",
    driverName: driver ? `${driver.firstName} ${driver.lastName}`.trim() : mission.assigneeName,
    vehicleName: booking?.vehicleName || "",
    notes: body.notes.trim(),
    incidents: body.incidents?.trim() || "",
    odometerEnd: body.odometerEnd ? Number(body.odometerEnd) : undefined,
    fuelLevel: body.fuelLevel?.trim() || "",
    ratingToken,
    ratingEmailSendAt: submittedAt,
    ratingEmailSent: false,
    submittedAt,
  });

  mission.status = "terminee";
  await mission.save();

  if (driver) {
    const stillBusy = await Mission.findOne({
      assignee: driverId,
      status: "en_cours",
      _id: { $ne: missionId },
    });
    if (!stillBusy) {
      driver.availability = "disponible";
      await driver.save();
    }
  }

  const serialized = toTripReport(report);
  const emailResult = await notifyAdminTripReport(serialized);

  let clientEmailResult = { sent: false, reason: "no_client_email" };
  try {
    clientEmailResult = await sendClientRatingRequest({
      ...serialized,
      ratingToken: report.ratingToken,
      clientEmail: report.clientEmail,
    });
    if (clientEmailResult.sent || clientEmailResult.reason === "no_client_email") {
      report.ratingEmailSent = true;
      await report.save();
    }
  } catch (err) {
    console.error("[YOLO] Erreur envoi e-mail client:", err.message);
  }

  return {
    ...serialized,
    adminEmailSent: emailResult.sent,
    clientEmailSent: clientEmailResult.sent,
    clientEmailReason: clientEmailResult.reason,
    ratingScheduledAt: report.ratingEmailSendAt.toISOString(),
  };
}

async function listTripReports() {
  const items = await TripReport.find().sort({ submittedAt: -1 });
  return items.map(toTripReport);
}

async function markTripReportRead(id) {
  if (!isMongoId(id)) throw new ApiError(400, "INVALID_ID", "Identifiant invalide");
  const report = await TripReport.findById(id);
  if (!report) throw new ApiError(404, "NOT_FOUND", "Rapport introuvable");
  report.status = "lu";
  await report.save();
  return toTripReport(report);
}

module.exports = {
  listDriverMissions,
  submitTripReport,
  listTripReports,
  markTripReportRead,
};
