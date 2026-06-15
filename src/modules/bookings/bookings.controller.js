const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { ok, paginated } = require("../../utils/response");
const service = require("./bookings.service");

const create = asyncHandler(async (req, res) => {
  ok(res, await service.createBooking(req.body), 201);
});

const list = asyncHandler(async (req, res) => {
  const isAdmin = req.user && ["admin", "agent"].includes(req.user.role);
  const isClientLookup = !!(req.query.clientEmail || req.query.clientPhone);
  if (!isAdmin && !isClientLookup) {
    throw new ApiError(401, "UNAUTHORIZED", "Token manquant");
  }

  const result = await service.listBookings(
    { ...req.query, limit: req.query.limit || 500 },
    isAdmin,
  );
  if (req.query.page) {
    paginated(res, result.items, result.meta);
  } else {
    ok(res, result.items);
  }
});

const getOne = asyncHandler(async (req, res) => {
  ok(res, await service.getBooking(req.params.id));
});

const updateStatus = asyncHandler(async (req, res) => {
  ok(res, await service.updateStatus(req.params.id, req.body.status));
});

const assignDriver = asyncHandler(async (req, res) => {
  ok(res, await service.assignDriver(req.params.id, req.body.driverId));
});

const remove = asyncHandler(async (req, res) => {
  ok(res, await service.deleteBooking(req.params.id));
});

const occupiedDates = asyncHandler(async (req, res) => {
  const vehicleId = req.query.vehicleId;
  if (!vehicleId) throw new ApiError(400, "VALIDATION_ERROR", "vehicleId requis");
  ok(res, await service.getOccupiedDates(String(vehicleId)));
});

module.exports = { create, list, getOne, updateStatus, assignDriver, remove, occupiedDates };
