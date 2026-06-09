const router = require("express").Router();
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/interview.controller");

router.get("/", auth, ctrl.getInterviews);

module.exports = router;