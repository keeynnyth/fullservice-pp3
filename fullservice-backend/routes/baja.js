

// routes/baja.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /baja
 * Desactiva la cuenta del usuario autenticado (campo "activo" = 0)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Si no existe la columna "activo", ver nota más abajo
    const [r] = await pool.query('UPDATE usuarios SET activo = 0 WHERE id = ?', [userId]);

    if (r.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Opcional: invalidar sesiones/tokens server-side si llevás un store
    return res.json({ mensaje: 'Tu cuenta ha sido dada de baja' });
  } catch (error) {
    console.error('[POST /baja] Error:', error);
    res.status(500).json({ mensaje: 'Error al procesar la baja' });
  }
});

module.exports = router;
