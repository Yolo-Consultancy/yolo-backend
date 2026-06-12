const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./contact.service");

const create = asyncHandler(async (req, res) => ok(res, await service.createMessage(req.body), 201));
const list = asyncHandler(async (_req, res) => ok(res, await service.listMessages()));

module.exports = { create, list };
