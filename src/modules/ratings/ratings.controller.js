const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./ratings.service");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");

const getByToken = asyncHandler(async (req, res) => {
  ok(res, await service.getRatingForm(req.params.token));
});

const submit = asyncHandler(async (req, res) => {
  ok(res, await service.submitRating(req.params.token, req.body), 201);
});

const list = asyncHandler(async (_req, res) => {
  ok(res, await service.listRatings());
});

module.exports = { getByToken, submit, list };
