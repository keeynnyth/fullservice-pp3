

// routes/registro.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();


router.post('/', async (req, res) => {
  const {
    nombre = '',
    email = '',
    password = '',
    accept_policies = false,
    terms_version = 'v1.0',
    marketing_opt_in = false,
    autos = [],
    plan = 'standard',
    payment_ok = false
  } = req.body || {};

  try {
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Faltan nombre, email o contraseña' });
    }
    if (!accept_policies) {
      return res.status(400).json({ mensaje: 'Debes aceptar la política de privacidad' });
    }
    const planNorm = ['standard','premium'].includes(String(plan).toLowerCase())
      ? String(plan).toLowerCase()
      : null;
    if (!planNorm) return res.status(400).json({ mensaje: 'Plan inválido' });

    // Ambos planes requieren pago ahora
    if (!payment_ok) return res.status(400).json({ mensaje: 'Pago requerido no completado' });

    const hashed = await bcrypt.hash(password, 10);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [exists] = await conn.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);
      if (exists.length) {
        await conn.rollback(); conn.release();
        return res.status(409).json({ mensaje: 'El email ya está registrado' });
      }

      const now = new Date();
      const [insUser] = await conn.query(
        `INSERT INTO usuarios
           (nombre, email, password, rol, terms_accepted_at, terms_version, marketing_opt_in, plan, plan_paid)
         VALUES (?, ?, ?, 'usuario', ?, ?, ?, ?, ?)`,
        [nombre, email, hashed, now, terms_version, marketing_opt_in ? 1 : 0, planNorm, 1] // plan_paid=1 para ambos
      );

      const userId = insUser.insertId;

      if (Array.isArray(autos) && autos.length) {
        const values = [];
        for (const a of autos) {
          if (!a || !a.marca || !a.modelo || a.anio === undefined) continue;
          const anioNum = Number(a.anio);
          if (!Number.isInteger(anioNum) || anioNum < 1950 || anioNum > (new Date().getFullYear()+1)) continue;
          values.push([userId, String(a.marca).trim(), String(a.modelo).trim(), anioNum]);
        }
        if (values.length) {
          await conn.query('INSERT INTO autos (usuario_id, marca, modelo, anio) VALUES ?', [values]);
        }
      }

      await conn.commit(); conn.release();
      return res.status(201).json({
        mensaje: 'Usuario registrado',
        usuario_id: userId,
        plan: planNorm,
        plan_paid: true
      });
    } catch (txErr) {
      try { await conn.rollback(); } catch {}
      conn.release();
      console.error('[POST /registro] TX Error:', txErr);
      return res.status(500).json({ mensaje: 'Error registrando usuario' });
    }
  } catch (err) {
    console.error('[POST /registro] Error:', err);
    return res.status(500).json({ mensaje: 'Error interno' });
  }
});

module.exports = router;

