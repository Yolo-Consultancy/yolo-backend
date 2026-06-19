const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./ratings.controller");

const router = express.Router();

router.get("/token/:token", controller.getByToken);
router.post("/submit/:token", controller.submit);
router.get("/public", controller.listPublic);
router.get("/", authenticate, requireRole("admin", "agent"), controller.list);

module.exports = router;
