"use strict";

const db = require("../config/db");

exports.getInterviews = async (req, res) => {

  try {

    return res.json({
      success: true,
      interviews: []
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

};