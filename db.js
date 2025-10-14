// db.js
/*const mysql = require('mysql2');

const db = mysql.createPool({
  host: '72.60.29.59',
  user: 'mteam',
  password: 'Mteam^2025',
  database: 'emanager',
  port: 3306
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database successfully!');
    connection.release();
  }
});

module.exports = db;*/
const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
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
