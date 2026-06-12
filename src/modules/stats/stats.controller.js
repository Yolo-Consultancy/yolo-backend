const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./stats.service");

const overview = asyncHandler(async (_req, res) => ok(res, await service.overview()));
const revenue = asyncHandler(async (req, res) => ok(res, await service.revenueSeries(req.query.from, req.query.to)));
const vehicleUsage = asyncHandler(async (_req, res) => ok(res, await service.vehicleUsage()));

module.exports = { overview, revenue, vehicleUsage };
