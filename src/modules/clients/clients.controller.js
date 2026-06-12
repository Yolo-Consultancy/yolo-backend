const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./clients.service");

const list = asyncHandler(async (_req, res) => ok(res, await service.listClients()));
const getOne = asyncHandler(async (req, res) => ok(res, await service.getClient(req.params.id)));
const upsert = asyncHandler(async (req, res) => ok(res, await service.upsertClient(req.body), req.body.id ? 200 : 201));
const remove = asyncHandler(async (req, res) => ok(res, await service.deleteClient(req.params.id)));

module.exports = { list, getOne, upsert, remove };
