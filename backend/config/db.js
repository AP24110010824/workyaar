const mysql = require("mysql2/promise");
console.log("Connecting to DB with Host:", process.env.DB_HOST, "User:", process.env.DB_USER, "DB Name:", process.env.DB_NAME, "Port:", process.env.DB_PORT);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
   ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;