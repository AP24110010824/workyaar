"use strict";

const db = require("../config/db");

exports.getMessages = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT message, sender_id, created_at
       FROM wk_messages
       WHERE receiver_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      messages: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }

};