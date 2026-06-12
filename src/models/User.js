const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, lowercase: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "agent", "chauffeur"], default: "agent" },
    active: { type: Boolean, default: true },
    refreshTokenHash: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
