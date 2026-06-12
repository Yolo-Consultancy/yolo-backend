const asyncHandler = require("../../utils/asyncHandler");
const { ok, paginated } = require("../../utils/response");
const service = require("./bookings.service");

const create = asyncHandler(async (req, res) => {
  ok(res, await service.createBooking(req.body), 201);
});

const list = asyncHandler(async (req, res) => {
  const result = await service.listBookings({ ...req.query, limit: req.query.limit || 500 }, !!req.user);
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

module.exports = { create, list, getOne, updateStatus, assignDriver, remove };
