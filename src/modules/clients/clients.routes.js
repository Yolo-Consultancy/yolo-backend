const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./clients.controller");

const router = express.Router();

router.use(authenticate, requireRole("admin", "agent"));
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.upsert);
router.put("/:id", controller.upsert);
router.delete("/:id", controller.remove);

module.exports = router;
