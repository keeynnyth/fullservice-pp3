

// routes/authRoute.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }

    const [rows] = await pool.query(
      'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    if (!rows.length) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const u = rows[0];

    // 🚫 bloquea login si está de baja
    if (!u.activo) {
      return res.status(403).json({ mensaje: 'Cuenta desactivada. Contactá soporte para reactivarla.' });
    }

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const secret = process.env.JWT_SECRET || 'secreto123';
    const token = jwt.sign(
      { sub: u.id, rol: u.rol || 'usuario', email: u.email, nombre: u.nombre },
      secret,
      { expiresIn: '1h' }
    );

    res.json({ mensaje: 'Login exitoso', token, nombre: u.nombre });
  } catch (err) {
    console.error('[POST /login] Error:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
