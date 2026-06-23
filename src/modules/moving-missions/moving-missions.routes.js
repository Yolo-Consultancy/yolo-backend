const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./moving-missions.controller");

const router = express.Router();

router.use(authenticate, requireRole("admin", "agent"));
router.get("/", controller.list);
router.get("/busy-movers", controller.busyMovers);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.upsert);
router.delete("/:id", controller.remove);

module.exports = router;
