const Booking = require("../../models/Booking");
const Vehicle = require("../../models/Vehicle");

async function overview() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthBookings = await Booking.find({
    createdAt: { $gte: monthStart, $lte: monthEnd },
    status: { $ne: "annulee" },
  });

  const revenue = monthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalVehicles = await Vehicle.countDocuments({ active: true });
  const activeBookings = await Booking.countDocuments({
    status: { $in: ["en_attente", "confirmee", "payee"] },
  });

  const topVehicles = await Booking.aggregate([
    { $match: { status: { $ne: "annulee" } } },
    { $group: { _id: "$vehicleName", count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  return {
    monthBookings: monthBookings.length,
    monthRevenue: revenue,
    occupancyRate: totalVehicles ? Math.round((activeBookings / totalVehicles) * 100) : 0,
    topVehicles,
  };
}

async function revenueSeries(from, to) {
  const match = { status: { $ne: "annulee" } };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const series = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: "$totalPrice" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return series.map((s) => ({ date: s._id, total: s.total, count: s.count }));
}

async function vehicleUsage() {
  const usage = await Booking.aggregate([
    { $match: { status: { $ne: "annulee" } } },
    { $group: { _id: "$vehicleSlug", days: { $sum: "$days" }, bookings: { $sum: 1 } } },
    { $sort: { days: -1 } },
  ]);
  return usage.map((u) => ({ vehicleId: u._id, days: u.days, bookings: u.bookings }));
}

module.exports = { overview, revenueSeries, vehicleUsage };
