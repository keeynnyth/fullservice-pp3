

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const con = require("../db");

// Ruta para login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [result] = await con.promise().query(
      "SELECT * FROM usuarios WHERE email = ? AND password = ?",
      [email, password]
    );

    if (result.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    const usuario = result[0];

    // Crear token con la info del usuario
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
      "secreto123",
      { expiresIn: "1h" }
    );

    // Enviar también el nombre como parte del response
    res.json({ token, nombre: usuario.nombre });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
