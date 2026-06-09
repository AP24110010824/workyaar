"use strict";

const db = require("../config/db");

/* =========================
   COUNTRIES
========================= */
exports.getCountries = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT id, name
      FROM wk_countries
      WHERE is_active = 1
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      countries: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* =========================
   STATES
========================= */
exports.getStates = async (req, res) => {
  try {

    const { countryId } = req.params;

    const [rows] = await db.query(`
      SELECT id, name
      FROM wk_states
      WHERE country_id = ?
      AND is_active = 1
      ORDER BY name ASC
    `, [countryId]);

    res.json({
      success: true,
      states: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* =========================
   CITIES
========================= */
exports.getCities = async (req, res) => {
  try {

    const { stateId } = req.params;

    const [rows] = await db.query(`
      SELECT id, name
      FROM wk_cities
      WHERE state_id = ?
      AND is_active = 1
      ORDER BY name ASC
    `, [stateId]);

    res.json({
      success: true,
      cities: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};