

// db.js  <<<<<< REEMPLAZA COMPLETO ESTE ARCHIVO
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'fullservice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Sanity check al arrancar (con API promise)
(async () => {
  try {
    const conn = await pool.getConnection(); // <- PROMISE, sin callback
    console.log('✅ Conexión a base de datos establecida');
    conn.release();
  } catch (e) {
    console.error('❌ Error conectando a la base de datos:', e.message);
  }
})();

module.exports = { pool };
