const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./contact.service");

const create = asyncHandler(async (req, res) => ok(res, await service.createMessage(req.body), 201));

const list = asyncHandler(async (req, res) => {
  const serviceType = req.query.serviceType;
  const status = req.query.status;
  ok(res, await service.listMessages({ serviceType, status }));
});

const listMine = asyncHandler(async (req, res) => {
  const email = req.client?.email;
  const serviceType = req.query.serviceType;
  ok(res, await service.listClientMessages(email, serviceType));
});

const updateStatus = asyncHandler(async (req, res) => {
  ok(res, await service.updateMessageStatus(req.params.id, req.body.status));
});

module.exports = { create, list, listMine, updateStatus };
