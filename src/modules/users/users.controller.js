const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./users.service");

const list = asyncHandler(async (_req, res) => ok(res, await service.listUsers()));
const getOne = asyncHandler(async (req, res) => ok(res, await service.getUser(req.params.id)));
const upsert = asyncHandler(async (req, res) => ok(res, await service.upsertUser({ ...req.body, id: req.params.id }), req.params.id ? 200 : 201));
const create = asyncHandler(async (req, res) => ok(res, await service.upsertUser(req.body), 201));
const remove = asyncHandler(async (req, res) => ok(res, await service.deleteUser(req.params.id)));

module.exports = { list, getOne, upsert, create, remove };
