const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  const { nombre, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
  db.query(query, [nombre, email, hashedPassword], (err, result) => {
    if (err) return res.status(500).json({ mensaje: 'Error al registrar' });
    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  });
});

module.exports = router;
