const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ mensaje: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, 'secreto_fullservice');
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
}

router.get('/usuarios', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ mensaje: 'Acceso denegado' });

  db.query('SELECT id, nombre, email, creado_en FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    res.json(results);
  });
});

router.delete('/usuarios/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ mensaje: 'Acceso denegado' });

  const id = req.params.id;
  db.query('DELETE FROM usuarios WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar usuario' });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  });
});

module.exports = router;
