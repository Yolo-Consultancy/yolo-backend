const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const collectService = require("./analytics.collect.service");
const service = require("./analytics.service");

const collect = asyncHandler(async (req, res) => {
  const result = await collectService.collect(req.body, req);
  ok(res, result);
});

const overview = asyncHandler(async (req, res) => ok(res, await service.getOverview(req.query)));
const traffic = asyncHandler(async (req, res) => ok(res, await service.getTraffic(req.query)));
const pages = asyncHandler(async (req, res) => ok(res, await service.getPages(req.query)));

module.exports = { collect, overview, traffic, pages };
