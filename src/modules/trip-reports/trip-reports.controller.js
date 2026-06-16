const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./trip-reports.service");

const list = asyncHandler(async (_req, res) => {
  ok(res, await service.listTripReports());
});

const submit = asyncHandler(async (req, res) => {
  ok(res, await service.submitTripReport(req.driver._id, req.body), 201);
});

const markRead = asyncHandler(async (req, res) => {
  ok(res, await service.markTripReportRead(req.params.id));
});

const myMissions = asyncHandler(async (req, res) => {
  ok(res, await service.listDriverMissions(req.driver._id));
});

module.exports = { list, submit, markRead, myMissions };
