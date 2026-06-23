const express = require("express");
const { authenticate, requireRole } = require("../../middlewares/auth.middleware");
const controller = require("./movers.controller");

const router = express.Router();

router.use(authenticate, requireRole("admin", "agent"));
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
