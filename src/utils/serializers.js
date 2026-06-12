function toVehicle(doc) {
  if (!doc) return null;
  const v = doc.toObject ? doc.toObject() : doc;
  return {
    ...v,
    id: v.slug || String(v._id),
    _id: undefined,
    __v: undefined,
  };
}

function toBooking(doc) {
  if (!doc) return null;
  const b = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(b._id),
    vehicleId: b.vehicleSlug || (b.vehicle ? String(b.vehicle) : ""),
    vehicleName: b.vehicleName,
    clientName: b.clientName,
    clientPhone: b.clientPhone,
    clientEmail: b.clientEmail,
    startDate: b.startDate ? b.startDate.toISOString().slice(0, 10) : "",
    endDate: b.endDate ? b.endDate.toISOString().slice(0, 10) : "",
    days: b.days,
    pickupLocation: b.pickupLocation,
    dropoffLocation: b.dropoffLocation,
    totalPrice: b.totalPrice,
    withChauffeur: b.withChauffeur,
    driverId: b.driver ? String(b.driver) : "",
    driverName: b.driverName || "",
    status: b.status,
    paymentStatus: b.paymentStatus,
    createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
  };
}

function toDriver(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(d._id),
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email || "",
    phone: d.phone || "",
    hiredAt: d.hiredAt || (d.createdAt ? d.createdAt.toISOString().slice(0, 10) : ""),
    salary: d.salary ?? d.pricePerDay ?? 0,
    pricePerDay: d.pricePerDay ?? d.salary ?? 0,
    photo: d.photo || "",
    availability: d.availability || "disponible",
    active: d.active !== false,
    notes: d.notes || "",
    experienceYears: d.experienceYears,
    languages: d.languages || "",
    city: d.city || "",
    createdAt: d.createdAt ? d.createdAt.toISOString().slice(0, 10) : "",
  };
}

function toClient(doc) {
  if (!doc) return null;
  const c = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(c._id),
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email || "",
    phone: c.phone || "",
    totalBookings: c.totalBookings || 0,
    totalSpent: c.totalSpent || 0,
    notes: c.notes || "",
    createdAt: c.createdAt ? c.createdAt.toISOString().slice(0, 10) : "",
  };
}

function toUser(doc) {
  if (!doc) return null;
  const u = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active !== false,
    createdAt: u.createdAt ? u.createdAt.toISOString().slice(0, 10) : "",
  };
}

function toMission(doc) {
  if (!doc) return null;
  const m = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(m._id),
    bookingId: m.booking ? String(m.booking) : "",
    assigneeId: m.assignee ? String(m.assignee) : "",
    assigneeName: m.assigneeName || "",
    type: m.type,
    scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : "",
    status: m.status,
    notes: m.notes || "",
  };
}

module.exports = {
  toVehicle,
  toBooking,
  toDriver,
  toClient,
  toUser,
  toMission,
};
