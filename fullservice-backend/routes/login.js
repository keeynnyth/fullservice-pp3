const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en servidor' });
    if (results.length === 0) return res.status(401).json({ mensaje: 'Usuario no existe' });

    const usuario = results[0];
    const match = await bcrypt.compare(password, usuario.password);
    if (!match) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const token = jwt.sign({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    }, 'secreto_fullservice', { expiresIn: '1h' });

    res.status(200).json({ mensaje: 'Login exitoso', token });
  });
});

module.exports = router;
