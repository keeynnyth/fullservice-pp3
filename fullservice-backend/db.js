

const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // Cambia si tu contraseña es distinta
  database: 'fullservice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
  } else {
    console.log('✅ Conexión a base de datos establecida');
    connection.release(); // Liberar conexión de prueba
  }
});

module.exports = db;
