const ApiError = require("../../utils/ApiError");
const Client = require("../../models/Client");
const { toClient } = require("../../utils/serializers");

async function listClients() {
  const items = await Client.find().sort({ createdAt: -1 });
  return items.map(toClient);
}

async function getClient(id) {
  const client = await Client.findById(id);
  if (!client) throw new ApiError(404, "NOT_FOUND", "Client introuvable");
  return toClient(client);
}

async function upsertClient(body) {
  if (body.id) {
    const client = await Client.findById(body.id);
    if (!client) throw new ApiError(404, "NOT_FOUND", "Client introuvable");
    Object.assign(client, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
      totalBookings: body.totalBookings,
      totalSpent: body.totalSpent,
    });
    await client.save();
    return toClient(client);
  }
  const client = await Client.create(body);
  return toClient(client);
}

async function deleteClient(id) {
  const client = await Client.findByIdAndDelete(id);
  if (!client) throw new ApiError(404, "NOT_FOUND", "Client introuvable");
  return { deleted: true };
}

module.exports = { listClients, getClient, upsertClient, deleteClient };
