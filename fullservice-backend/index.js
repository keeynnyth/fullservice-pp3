const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');
const loginRoute = require('./routes/login');
const registroRoute = require('./routes/registro');
const contactoRoute = require('./routes/contacto');
const adminRoute = require('./routes/admin');

app.use(cors());
app.use(express.json());

app.use('/login', loginRoute);
app.use('/registro', registroRoute);
app.use('/contacto', contactoRoute);
app.use('/admin', adminRoute);

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
