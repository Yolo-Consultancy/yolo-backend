const ApiError = require("../../utils/ApiError");
const Driver = require("../../models/Driver");
const { toDriver } = require("../../utils/serializers");

async function listDrivers(publicOnly = false) {
  const filter = publicOnly ? { active: true } : {};
  const items = await Driver.find(filter).sort({ createdAt: -1 });
  return items.map(toDriver);
}

async function getDriver(id) {
  const driver = await Driver.findById(id);
  if (!driver) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
  return toDriver(driver);
}

async function createDriver(body) {
  const driver = await Driver.create({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    photo: body.photo,
    pricePerDay: body.pricePerDay ?? body.salary ?? 80,
    salary: body.salary ?? body.pricePerDay ?? 0,
    hiredAt: body.hiredAt,
    availability: body.availability || "disponible",
    active: body.active !== false,
    experienceYears: body.experienceYears,
    languages: body.languages,
    city: body.city,
    notes: body.notes,
  });
  return toDriver(driver);
}

async function updateDriver(id, body) {
  const driver = await Driver.findById(id);
  if (!driver) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
  Object.assign(driver, {
    firstName: body.firstName ?? driver.firstName,
    lastName: body.lastName ?? driver.lastName,
    email: body.email ?? driver.email,
    phone: body.phone ?? driver.phone,
    photo: body.photo ?? driver.photo,
    pricePerDay: body.pricePerDay ?? body.salary ?? driver.pricePerDay,
    salary: body.salary ?? body.pricePerDay ?? driver.salary,
    hiredAt: body.hiredAt ?? driver.hiredAt,
    availability: body.availability ?? driver.availability,
    active: body.active ?? driver.active,
    experienceYears: body.experienceYears ?? driver.experienceYears,
    languages: body.languages ?? driver.languages,
    city: body.city ?? driver.city,
    notes: body.notes ?? driver.notes,
  });
  await driver.save();
  return toDriver(driver);
}

async function deleteDriver(id) {
  const driver = await Driver.findById(id);
  if (!driver) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
  driver.active = false;
  await driver.save();
  return { deleted: true };
}

async function toggleActive(id) {
  const driver = await Driver.findById(id);
  if (!driver) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
  driver.active = !driver.active;
  await driver.save();
  return toDriver(driver);
}

module.exports = {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleActive,
};
