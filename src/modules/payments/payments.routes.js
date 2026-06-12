const express = require("express");
const controller = require("./payments.controller");

const router = express.Router();

router.post("/create-checkout-session", controller.createCheckoutSession);

module.exports = router;
