const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./movers.service");

const list = asyncHandler(async (_req, res) => ok(res, await service.listMovers()));
const getOne = asyncHandler(async (req, res) => ok(res, await service.getMover(req.params.id)));
const create = asyncHandler(async (req, res) => ok(res, await service.createMover(req.body), 201));
const update = asyncHandler(async (req, res) => ok(res, await service.updateMover(req.params.id, req.body)));
const remove = asyncHandler(async (req, res) => ok(res, await service.deleteMover(req.params.id)));

module.exports = { list, getOne, create, update, remove };
