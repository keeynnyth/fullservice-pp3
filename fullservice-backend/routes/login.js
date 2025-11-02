// routes/login.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const router = express.Router();

const isBcryptHash = (s) =>
  typeof s === 'string' && /^\$2[aby]\$/.test(s) && s.length >= 60;

router.post('/', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const stored = user.password;

    let ok = false;

    if (isBcryptHash(stored)) {
      // password almacenado como bcrypt
      ok = await bcrypt.compare(String(password), stored);
    } else {
      // password almacenado en texto plano (datos viejos)
      if (String(password) === String(stored)) {
        ok = true;
        // Migración silenciosa: rehash y update
        try {
          const newHash = await bcrypt.hash(String(password), 10);
          await conn.query('UPDATE usuarios SET password = ? WHERE id = ?', [newHash, user.id]);
        } catch (mErr) {
          console.warn('[login] No se pudo migrar hash para usuario', user.id, mErr?.message);
        }
      } else {
        ok = false;
      }
    }

    if (!ok) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { sub: user.id, rol: user.rol || 'usuario' },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol || 'usuario' }
    });
  } catch (e) {
    console.error('[POST /login] Error:', e);
    return res.status(500).json({ mensaje: 'Error interno' });
  } finally {
    try { if (conn) conn.release(); } catch {}
  }
});

module.exports = router;
