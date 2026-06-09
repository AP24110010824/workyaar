const db = require("../config/db");

exports.getIndustries = async (req, res) => {

  try {

    const type = req.query.type;

    const [rows] = await db.query(
      `
      SELECT id, industry_name
      FROM wk_industries
      WHERE industry_type = ?
      AND status = 1
      ORDER BY industry_name ASC
      `,
      [type]
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};