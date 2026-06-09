const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config/.env' });

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      multipleStatements: true,
    });

    const sql = fs.readFileSync('setup-db.sql', 'utf8');
    // Split on delimiter if needed (assuming ';' terminates statements)
    await connection.query(sql);
    console.log('✅ Database schema imported successfully');
    await connection.end();
  } catch (err) {
    console.error('❌ Error importing DB schema:', err);
    process.exit(1);
  }
})();
