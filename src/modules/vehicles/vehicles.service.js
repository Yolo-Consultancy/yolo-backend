const ApiError = require("../../utils/ApiError");
const Vehicle = require("../../models/Vehicle");
const { toVehicle } = require("../../utils/serializers");

function slugify(id, name, brand) {
  if (id && !id.startsWith("vh-")) return id;
  return `${(brand || "vehicle").toLowerCase().replace(/\s+/g, "-")}-${(name || "model").toLowerCase().replace(/\s+/g, "-")}`
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80) || `vehicle-${Date.now()}`;
}

function mapPayload(body) {
  const slug = slugify(body.id, body.name, body.brand);
  return {
    slug,
    name: body.name,
    brand: body.brand,
    year: body.year,
    category: body.category,
    location: body.location,
    pricePerDay: body.pricePerDay,
    image: body.image || body.gallery?.[0] || "",
    gallery: body.gallery || [],
    specs: body.specs,
    description: body.description,
    conditions: body.conditions,
    keyStats: body.keyStats,
    performance: body.performance,
    drivetrain: body.drivetrain,
    equipment: body.equipment,
    active: body.active !== false,
  };
}

async function listVehicles(publicOnly = false) {
  const filter = publicOnly ? { active: true } : {};
  const items = await Vehicle.find(filter).sort({ createdAt: -1 });
  return items.map(toVehicle);
}

async function getVehicle(id) {
  const mongoose = require("mongoose");
  const or = [{ slug: id }];
  if (mongoose.Types.ObjectId.isValid(id)) or.push({ _id: id });
  const vehicle = await Vehicle.findOne({ $or: or });
  if (!vehicle) throw new ApiError(404, "NOT_FOUND", "Véhicule introuvable");
  return toVehicle(vehicle);
}

async function createVehicle(body) {
  const data = mapPayload(body);
  const exists = await Vehicle.findOne({ slug: data.slug });
  if (exists) throw new ApiError(409, "CONFLICT", "Ce véhicule existe déjà");
  const vehicle = await Vehicle.create(data);
  return toVehicle(vehicle);
}

async function updateVehicle(id, body) {
  const vehicle = await Vehicle.findOne({ $or: [{ slug: id }, { _id: id }] });
  if (!vehicle) throw new ApiError(404, "NOT_FOUND", "Véhicule introuvable");
  const data = mapPayload({ ...body, id: vehicle.slug });
  Object.assign(vehicle, data);
  await vehicle.save();
  return toVehicle(vehicle);
}

async function deleteVehicle(id) {
  const vehicle = await Vehicle.findOne({ $or: [{ slug: id }, { _id: id }] });
  if (!vehicle) throw new ApiError(404, "NOT_FOUND", "Véhicule introuvable");
  vehicle.active = false;
  await vehicle.save();
  return { deleted: true };
}

async function updateGallery(id, gallery) {
  const vehicle = await Vehicle.findOne({ $or: [{ slug: id }, { _id: id }] });
  if (!vehicle) throw new ApiError(404, "NOT_FOUND", "Véhicule introuvable");
  vehicle.gallery = gallery;
  vehicle.image = gallery[0] || vehicle.image;
  await vehicle.save();
  return toVehicle(vehicle);
}

async function removeImage(id, url) {
  const vehicle = await Vehicle.findOne({ $or: [{ slug: id }, { _id: id }] });
  if (!vehicle) throw new ApiError(404, "NOT_FOUND", "Véhicule introuvable");
  vehicle.gallery = vehicle.gallery.filter((u) => u !== url);
  if (vehicle.image === url) vehicle.image = vehicle.gallery[0] || "";
  await vehicle.save();
  return toVehicle(vehicle);
}

module.exports = {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateGallery,
  removeImage,
};
