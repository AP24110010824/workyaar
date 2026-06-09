const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

const inviteController = require("../controllers/companyInvite.controller");

router.use(auth);

// send invite
router.post("/invite", inviteController.sendInvite);

// accept invite
router.post("/accept", inviteController.acceptInvite);

// list invites
router.get("/", inviteController.getInvites);

// cancel invite
router.put("/:id/cancel", inviteController.cancelInvite);

module.exports = router;