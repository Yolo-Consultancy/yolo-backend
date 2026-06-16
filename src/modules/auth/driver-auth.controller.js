const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./driver-auth.service");

const login = asyncHandler(async (req, res) => {
  ok(res, await service.loginDriver(req.body.email, req.body.password));
});

const me = asyncHandler(async (req, res) => {
  ok(res, await service.getDriverMe(req.driver._id));
});

module.exports = { login, me };
