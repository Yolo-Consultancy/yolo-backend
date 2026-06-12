const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./drivers.service");

const list = asyncHandler(async (req, res) => {
  ok(res, await service.listDrivers(!req.user));
});

const getOne = asyncHandler(async (req, res) => {
  ok(res, await service.getDriver(req.params.id));
});

const create = asyncHandler(async (req, res) => {
  ok(res, await service.createDriver(req.body), 201);
});

const update = asyncHandler(async (req, res) => {
  ok(res, await service.updateDriver(req.params.id, req.body));
});

const remove = asyncHandler(async (req, res) => {
  ok(res, await service.deleteDriver(req.params.id));
});

const toggle = asyncHandler(async (req, res) => {
  ok(res, await service.toggleActive(req.params.id));
});

module.exports = { list, getOne, create, update, remove, toggle };
