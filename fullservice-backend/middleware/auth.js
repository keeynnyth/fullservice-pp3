

// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const parts = header.split(' ');
    const token = parts.length === 2 ? parts[1] : null;
    if (!token) return res.status(401).json({ mensaje: 'No autenticado' });

    const secret = process.env.JWT_SECRET || 'secreto123';
    const payload = jwt.verify(token, secret);

    const userId = payload.sub ?? payload.id;
    if (!userId) return res.status(401).json({ mensaje: 'Token inválido (sin sub/id)' });

    // 🔒 Verificar que el usuario siga activo
    const [rows] = await pool.query(
      'SELECT id, rol, activo FROM usuarios WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!rows.length) return res.status(401).json({ mensaje: 'Usuario no existe' });
    if (!rows[0].activo) {
      return res.status(403).json({ mensaje: 'Cuenta desactivada. Contacta Soporte' });
    }

    req.user = { id: userId, rol: rows[0].rol || payload.rol || 'usuario' };
    next();
  } catch (e) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

module.exports = { requireAuth };
