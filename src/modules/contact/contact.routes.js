const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./contact.controller");

const router = express.Router();

router.post("/", controller.create);
router.get("/", authenticate, requireRole("admin", "agent"), controller.list);

module.exports = router;
