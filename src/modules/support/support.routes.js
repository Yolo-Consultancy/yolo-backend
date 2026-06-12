const express = require("express");
const { authenticateClient } = require("../../middlewares/auth.middleware");
const controller = require("./support.controller");

const router = express.Router();

router.use(authenticateClient);
router.get("/messages", controller.list);
router.post("/messages", controller.send);
router.delete("/messages", controller.reset);

module.exports = router;
