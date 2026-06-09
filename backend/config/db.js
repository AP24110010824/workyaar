const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  // Hardcoding the cloud host and port removes any environment variable name confusion
  host: "mysql-2d0c5e30-workyaar.h.aivencloud.com",
  port: 15177, 
  user: process.env.DB_USER || "avnadmin",
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "workyaar_db",
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;