const mongoose = require("mongoose");

const moverSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    hiredAt: String,
    salary: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    notes: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Mover", moverSchema);
