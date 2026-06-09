"use strict";

const express = require("express");
const router = express.Router();

const locationController = require("../controllers/location.controller");

/* Countries */
router.get("/countries", locationController.getCountries);

/* States */
router.get("/states/:countryId", locationController.getStates);

/* Cities */
router.get("/cities/:stateId", locationController.getCities);

module.exports = router;