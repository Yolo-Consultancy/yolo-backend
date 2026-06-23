const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const { toMongoId } = require("../../utils/mongoIds");
const service = require("./moving-missions.service");

const list = asyncHandler(async (_req, res) => ok(res, await service.listMovingMissions()));
const busyMovers = asyncHandler(async (req, res) => {
  ok(res, await service.listBusyMoverIds(req.query.excludeMissionId));
});
const busyDates = asyncHandler(async (_req, res) => {
  ok(res, await service.getBusyDates());
});
const getOne = asyncHandler(async (req, res) => ok(res, await service.getMovingMission(req.params.id)));
const upsert = asyncHandler(async (req, res) => {
  const id = toMongoId(req.params.id);
  const { id: _bodyId, ...body } = req.body;
  const data = await service.upsertMovingMission(id ? { ...body, id } : body);
  ok(res, data, id ? 200 : 201);
});
const create = asyncHandler(async (req, res) => {
  const { id: _id, ...body } = req.body;
  ok(res, await service.upsertMovingMission(body), 201);
});
const remove = asyncHandler(async (req, res) => ok(res, await service.deleteMovingMission(req.params.id)));

module.exports = { list, getOne, upsert, create, remove, busyMovers, busyDates };
