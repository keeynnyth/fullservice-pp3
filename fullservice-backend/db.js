const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'fullservice_db'
});
db.connect((err) => {
  if (err) throw err;
  console.log('Conexión a base de datos establecida');
});
module.exports = db;
