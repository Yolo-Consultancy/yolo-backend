const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const { toMongoId } = require("../../utils/mongoIds");
const service = require("./missions.service");

const list = asyncHandler(async (_req, res) => ok(res, await service.listMissions()));
const busyDrivers = asyncHandler(async (req, res) => {
  ok(res, await service.listBusyDriverIds(req.query.excludeMissionId));
});
const getOne = asyncHandler(async (req, res) => ok(res, await service.getMission(req.params.id)));
const upsert = asyncHandler(async (req, res) => {
  const id = toMongoId(req.params.id);
  const { id: _bodyId, ...body } = req.body;
  const data = await service.upsertMission(id ? { ...body, id } : body);
  ok(res, data, id ? 200 : 201);
});
const create = asyncHandler(async (req, res) => {
  const { id: _id, ...body } = req.body;
  ok(res, await service.upsertMission(body), 201);
});
const remove = asyncHandler(async (req, res) => ok(res, await service.deleteMission(req.params.id)));

module.exports = { list, getOne, upsert, create, remove, busyDrivers };
