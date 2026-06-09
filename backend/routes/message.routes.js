const router = require("express").Router();
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/message.controller");

router.get("/", auth, ctrl.getMessages);

module.exports = router;