
// routes/perfil.js
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /perfil
 * Devuelve { usuario: {...}, autos: [...] }
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const [urows] = await pool.query(
      `
      SELECT
        id,
        nombre,
        email,
        rol,
        plan,
        plan_paid,
        marketing_opt_in,
        terms_version,
        DATE_FORMAT(terms_accepted_at, '%Y-%m-%d %H:%i:%s') AS terms_accepted_at,
        DATE_FORMAT(creado_en, '%Y-%m-%d %H:%i:%s')        AS creado_en, activo
      FROM usuarios
      WHERE id = ? LIMIT 1
      `,
      [req.user.id]
    );
    if (!urows.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const usuario = urows[0];

    const [autos] = await pool.query(
      'SELECT id, marca, modelo, anio FROM autos WHERE usuario_id = ? ORDER BY id DESC',
      [req.user.id]
    );

    res.json({ usuario, autos });
  } catch (e) {
    console.error('[GET /perfil] Error:', e);
    res.status(500).json({ mensaje: 'Error obteniendo perfil' });
  }
});

/**
 * PUT /perfil
 * Actualiza preferencias simples del perfil (por ahora: marketing_opt_in)
 * Body: { marketing_opt_in: boolean }
 */
router.put('/', requireAuth, async (req, res) => {
  try {
    const { marketing_opt_in } = req.body || {};
    if (typeof marketing_opt_in === 'undefined') {
      return res.status(400).json({ mensaje: 'Parámetro requerido: marketing_opt_in' });
    }

    await pool.query(
      'UPDATE usuarios SET marketing_opt_in = ? WHERE id = ?',
      [marketing_opt_in ? 1 : 0, req.user.id]
    );

    res.json({ mensaje: 'Preferencias actualizadas' });
  } catch (e) {
    console.error('[PUT /perfil] Error:', e);
    res.status(500).json({ mensaje: 'Error actualizando perfil' });
  }
});

module.exports = router;
