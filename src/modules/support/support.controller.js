const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./support.service");

const list = asyncHandler(async (req, res) => {
  ok(res, await service.listMessages(req.client._id));
});

const send = asyncHandler(async (req, res) => {
  ok(res, await service.sendMessage(req.client._id, req.body.text));
});

const reset = asyncHandler(async (req, res) => {
  ok(res, await service.resetMessages(req.client._id));
});

module.exports = { list, send, reset };
