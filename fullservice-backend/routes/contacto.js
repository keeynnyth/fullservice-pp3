const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { nombre, telefono, mensaje } = req.body;
  console.log('Mensaje recibido:', { nombre, telefono, mensaje });
  res.status(200).json({ mensaje: 'Mensaje recibido correctamente' });
});

module.exports = router;
