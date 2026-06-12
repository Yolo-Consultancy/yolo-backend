const mongoose = require("mongoose");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");
const Booking = require("../../models/Booking");
const Vehicle = require("../../models/Vehicle");
const Driver = require("../../models/Driver");
const Client = require("../../models/Client");
const { toBooking } = require("../../utils/serializers");
const { parsePagination } = require("../../utils/pagination");

const ACTIVE_STATUSES = ["en_attente", "confirmee", "payee"];

function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function datesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}

async function isVehicleAvailable(vehicleId, startDate, endDate, excludeId) {
  const filter = {
    vehicle: vehicleId,
    status: { $in: ACTIVE_STATUSES },
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  const conflict = await Booking.findOne(filter);
  return !conflict;
}

async function isDriverAvailable(driverId, startDate, endDate, excludeId) {
  const filter = {
    driver: driverId,
    withChauffeur: true,
    status: { $in: ACTIVE_STATUSES },
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  const conflict = await Booking.findOne(filter);
  return !conflict;
}

function computeTotal(days, vehiclePrice, withChauffeur, driverPrice) {
  return days * vehiclePrice + (withChauffeur ? days * driverPrice : 0);
}

async function createBooking(payload) {
  const vehicleOr = [{ slug: payload.vehicleId }];
  if (mongoose.Types.ObjectId.isValid(payload.vehicleId)) {
    vehicleOr.push({ _id: payload.vehicleId });
  }
  const vehicle = await Vehicle.findOne({ $or: vehicleOr, active: true });
  if (!vehicle) throw new ApiError(404, "NOT_FOUND", "Véhicule introuvable");

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  const days = payload.days || daysBetween(startDate, endDate);

  const available = await isVehicleAvailable(vehicle._id, payload.startDate, payload.endDate);
  if (!available) throw new ApiError(409, "CONFLICT", "Véhicule indisponible pour ces dates");

  let driver = null;
  const withChauffeur = !!payload.withChauffeur && !!payload.driverId;
  if (withChauffeur) {
    driver = await Driver.findById(payload.driverId);
    if (!driver || !driver.active) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
    const driverOk = await isDriverAvailable(driver._id, payload.startDate, payload.endDate);
    if (!driverOk) throw new ApiError(409, "CONFLICT", "Chauffeur indisponible pour ces dates");
  }

  const vehiclePrice = vehicle.pricePerDay;
  const driverPrice = driver ? (driver.pricePerDay || env.chauffeurPricePerDay) : env.chauffeurPricePerDay;
  const totalPrice = computeTotal(days, vehiclePrice, withChauffeur, driverPrice);

  let client = null;
  if (payload.clientId && mongoose.Types.ObjectId.isValid(payload.clientId)) {
    client = await Client.findById(payload.clientId);
  }
  if (!client && (payload.clientEmail || payload.clientPhone)) {
    const clientOr = [];
    if (payload.clientEmail) {
      clientOr.push({ email: String(payload.clientEmail).trim().toLowerCase() });
    }
    if (payload.clientPhone) {
      const digits = String(payload.clientPhone).replace(/\D/g, "");
      if (digits) clientOr.push({ phone: { $regex: digits } });
    }
    if (clientOr.length) client = await Client.findOne({ $or: clientOr });
  }
  if (!client && (payload.clientEmail || payload.clientPhone || payload.clientName)) {
    const [firstName = "", ...rest] = (payload.clientName || "").split(" ");
    client = await Client.create({
      firstName,
      lastName: rest.join(" "),
      email: payload.clientEmail ? String(payload.clientEmail).trim().toLowerCase() : undefined,
      phone: payload.clientPhone,
      totalBookings: 1,
      totalSpent: totalPrice,
    });
  } else if (client) {
    client.totalBookings = (client.totalBookings || 0) + 1;
    client.totalSpent = (client.totalSpent || 0) + totalPrice;
    await client.save();
  }

  const booking = await Booking.create({
    vehicle: vehicle._id,
    vehicleSlug: vehicle.slug,
    vehicleName: payload.vehicleName || `${vehicle.brand} ${vehicle.name}`,
    client: client?._id,
    clientName: payload.clientName,
    clientPhone: payload.clientPhone,
    clientEmail: payload.clientEmail,
    startDate,
    endDate,
    days,
    pickupLocation: payload.pickupLocation,
    dropoffLocation: payload.dropoffLocation,
    withChauffeur,
    driver: driver?._id,
    driverName: driver ? `${driver.firstName} ${driver.lastName}` : "",
    vehiclePriceSnapshot: vehiclePrice,
    driverPriceSnapshot: withChauffeur ? driverPrice : 0,
    totalPrice,
    status: payload.status || "en_attente",
  });

  return toBooking(booking);
}

async function listBookings(query, isAdmin) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (!isAdmin) {
    const or = [];
    if (query.clientEmail) {
      or.push({ clientEmail: String(query.clientEmail).trim().toLowerCase() });
    }
    if (query.clientPhone) {
      const digits = String(query.clientPhone).replace(/\D/g, "");
      if (digits) or.push({ clientPhone: { $regex: digits } });
    }
    if (or.length) filter.$or = or;
  } else {
    if (query.status) filter.status = query.status;
    if (query.dateFrom || query.dateTo) {
      filter.startDate = {};
      if (query.dateFrom) filter.startDate.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.startDate.$lte = new Date(query.dateTo);
    }
    if (query.q) {
      filter.$or = [
        { clientName: new RegExp(query.q, "i") },
        { vehicleName: new RegExp(query.q, "i") },
        { clientPhone: new RegExp(query.q, "i") },
      ];
    }
  }

  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);

  return { items: items.map(toBooking), meta: { page, limit, total } };
}

async function getBooking(id) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "NOT_FOUND", "Réservation introuvable");
  return toBooking(booking);
}

async function updateStatus(id, status) {
  const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
  if (!booking) throw new ApiError(404, "NOT_FOUND", "Réservation introuvable");
  return toBooking(booking);
}

async function assignDriver(id, driverId) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "NOT_FOUND", "Réservation introuvable");

  const withChauffeur = !!driverId;
  let driver = null;
  let driverPrice = 0;

  if (withChauffeur) {
    driver = await Driver.findById(driverId);
    if (!driver || !driver.active) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
    const ok = await isDriverAvailable(
      driver._id,
      booking.startDate.toISOString().slice(0, 10),
      booking.endDate.toISOString().slice(0, 10),
      booking._id,
    );
    if (!ok) throw new ApiError(409, "CONFLICT", "Chauffeur indisponible pour ces dates");
    driverPrice = driver.pricePerDay || env.chauffeurPricePerDay;
  }

  booking.withChauffeur = withChauffeur;
  booking.driver = driver?._id;
  booking.driverName = driver ? `${driver.firstName} ${driver.lastName}` : "";
  booking.driverPriceSnapshot = withChauffeur ? driverPrice : 0;
  booking.totalPrice = computeTotal(
    booking.days,
    booking.vehiclePriceSnapshot,
    withChauffeur,
    driverPrice,
  );
  await booking.save();
  return toBooking(booking);
}

async function deleteBooking(id) {
  const booking = await Booking.findByIdAndDelete(id);
  if (!booking) throw new ApiError(404, "NOT_FOUND", "Réservation introuvable");
  return { deleted: true };
}

module.exports = {
  createBooking,
  listBookings,
  getBooking,
  updateStatus,
  assignDriver,
  deleteBooking,
  isDriverAvailable,
};
