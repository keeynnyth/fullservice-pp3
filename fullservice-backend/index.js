

const express = require('express');
const cors = require('cors');
const app = express();

// Importar conexión a la base de datos
const db = require('./db');

// Importar rutas
const loginRoute = require('./routes/login');
const registroRoute = require('./routes/registro');
const contactoRoute = require('./routes/contacto');
const adminRoute = require('./routes/admin');
const turnosRoute = require('./routes/turnos');

// Middlewares
app.use(cors());
app.use(express.json());

// Probar conexión a la base de datos
db.getConnection((err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
  } else {
    console.log('✅ Conexión a la base de datos establecida');
  }
});

// Usar rutas
app.use('/login', loginRoute);
app.use('/registro', registroRoute);
app.use('/contacto', contactoRoute);
app.use('/admin', adminRoute);
app.use('/turnos', turnosRoute); // ✅ corregido

// Iniciar servidor
app.listen(3000, () => {
  console.log('🚀 Servidor backend corriendo en http://localhost:3000');
});
