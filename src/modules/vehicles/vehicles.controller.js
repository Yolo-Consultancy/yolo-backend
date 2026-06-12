const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./vehicles.service");

const list = asyncHandler(async (req, res) => {
  const publicOnly = !req.user;
  ok(res, await service.listVehicles(publicOnly));
});

const getOne = asyncHandler(async (req, res) => {
  ok(res, await service.getVehicle(req.params.id));
});

const create = asyncHandler(async (req, res) => {
  ok(res, await service.createVehicle(req.body), 201);
});

const update = asyncHandler(async (req, res) => {
  ok(res, await service.updateVehicle(req.params.id, req.body));
});

const remove = asyncHandler(async (req, res) => {
  ok(res, await service.deleteVehicle(req.params.id));
});

const reorderImages = asyncHandler(async (req, res) => {
  ok(res, await service.updateGallery(req.params.id, req.body.gallery));
});

const deleteImage = asyncHandler(async (req, res) => {
  ok(res, await service.removeImage(req.params.id, req.body.url));
});

module.exports = { list, getOne, create, update, remove, reorderImages, deleteImage };
