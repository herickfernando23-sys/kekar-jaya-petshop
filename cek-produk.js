require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [rows] = await conn.query('SELECT id, name, category_id, is_active, created_at FROM products ORDER BY id ASC');
  console.table(rows);
  await conn.end();
})();
