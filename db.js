// db.js
const mysql = require('mysql2');
require('dotenv').config(); // Load .env variables

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Use DB_PASSWORD as in .env
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database successfully!');
    connection.release();
  }
});

module.exports = db;