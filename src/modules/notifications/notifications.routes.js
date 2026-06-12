const express = require("express");
const controller = require("./notifications.controller");

const router = express.Router();

router.post("/new-booking", controller.newBooking);
router.post("/mission-assigned", controller.missionAssigned);

module.exports = router;
