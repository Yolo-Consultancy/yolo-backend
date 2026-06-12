const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./client-auth.service");

const { authenticateClient } = require("../../middlewares/auth.middleware");

const register = asyncHandler(async (req, res) => {
  ok(res, await service.registerClient(req.body), 201);
});

const login = asyncHandler(async (req, res) => {
  ok(res, await service.loginClient(req.body.email, req.body.password));
});

const me = asyncHandler(async (req, res) => {
  ok(res, await service.getClientMe(req.client._id));
});

module.exports = { register, login, me };
