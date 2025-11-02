

// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

/* --------------------------- Seguridad / Middlewares --------------------------- */
app.use(helmet());

// Construimos la allowlist desde el .env
const allowlist = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Middleware CORS (con validación de origen)
const corsMiddleware = cors({
  origin: (origin, cb) => {
    // Permite requests sin Origin (curl/Postman/healthchecks)
    if (!origin) return cb(null, true);
    const ok = allowlist.includes(origin);
    return ok ? cb(null, true) : cb(new Error('Origen no permitido por CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
});

app.use(corsMiddleware);
// Express 5: usar RegExp para OPTIONS global
app.options(/.*/, corsMiddleware);

// Body parser con límite razonable
app.use(express.json({ limit: '1mb' }));

// Rate limit básico para evitar abuso
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                  // máx. requests por IP/ventana
  standardHeaders: true,
  legacyHeaders: false
}));

/* --------------------------------- Rutas --------------------------------- */
// Importar rutas
const loginRoute    = require('./routes/login');
const registroRoute = require('./routes/registro');
const turnosRoute   = require('./routes/turnos');
const modelosRoute  = require('./routes/modelos');
const perfilRoute   = require('./routes/perfil');
const bajaRoute     = require('./routes/baja');
const autosRoute    = require('./routes/autos');   // <- aquí está /autos, incluyendo /autos/mios
const adminRoute    = require('./routes/admin');  

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), allowlist });
});

// Montar rutas
app.use('/login',    loginRoute);
app.use('/registro', registroRoute);
app.use('/turnos',   turnosRoute);
app.use('/modelos',  modelosRoute);
app.use('/perfil',   perfilRoute);
app.use('/baja',     bajaRoute);
app.use('/autos',    autosRoute);
app.use('/admin',    adminRoute); 

/* ---------------------------- 404 y Error handler ---------------------------- */
// 404 para rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ mensaje: 'No encontrado' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('[UnhandledError]', err?.message, err?.stack);
  if (String(err?.message || '').startsWith('Origen no permitido por CORS')) {
    return res.status(403).json({ mensaje: err.message });
  }
  res.status(500).json({ mensaje: 'Error interno' });
});

/* --------------------------------- Server --------------------------------- */
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`CORS allowlist: ${allowlist.join(', ') || '(vacía)'}`);
});
