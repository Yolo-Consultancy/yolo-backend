const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./settings.service");

const get = asyncHandler(async (_req, res) => ok(res, await service.getSettings()));
const update = asyncHandler(async (req, res) => ok(res, await service.saveSettings(req.body)));

module.exports = { get, update };
