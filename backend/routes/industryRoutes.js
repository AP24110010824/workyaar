const express = require("express");
const router = express.Router();

const industryController =
require("../controllers/industryController");

router.get("/", industryController.getIndustries);

module.exports = router;