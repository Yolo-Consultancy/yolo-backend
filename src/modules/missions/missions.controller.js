const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./missions.service");

const list = asyncHandler(async (_req, res) => ok(res, await service.listMissions()));
const getOne = asyncHandler(async (req, res) => ok(res, await service.getMission(req.params.id)));
const upsert = asyncHandler(async (req, res) => ok(res, await service.upsertMission({ ...req.body, id: req.params.id }), req.params.id ? 200 : 201));
const create = asyncHandler(async (req, res) => ok(res, await service.upsertMission(req.body), 201));
const remove = asyncHandler(async (req, res) => ok(res, await service.deleteMission(req.params.id)));

module.exports = { list, getOne, upsert, create, remove };
