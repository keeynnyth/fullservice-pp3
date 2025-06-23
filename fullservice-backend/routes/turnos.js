

const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// Middleware para verificar el token
function verificarToken(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ mensaje: "Token requerido" });

  const token = header.split(" ")[1];
  jwt.verify(token, "secreto_fullservice", (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: "Token inválido" });
    req.usuario = decoded;
    next();
  });
}

// Registrar nuevo turno
router.post("/", verificarToken, (req, res) => {
  const { fecha, hora, servicios, motivo } = req.body;
  const usuarioId = req.usuario.id;

  const query = "INSERT INTO turnos (usuario_id, fecha, hora, servicios, motivo) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [usuarioId, fecha, hora, servicios.join(", "), motivo], (err, result) => {
    if (err) {
      console.error("Error al insertar turno:", err);
      return res.status(500).json({ mensaje: "Error al registrar el turno" });
    }
    res.status(201).json({ mensaje: "Turno registrado correctamente" });
  });
});

// Obtener historial de turnos del usuario
router.get("/historial", verificarToken, (req, res) => {
  const usuarioId = req.usuario.id;
  const query = "SELECT fecha, hora, servicios, motivo FROM turnos WHERE usuario_id = ? ORDER BY fecha DESC";

  db.query(query, [usuarioId], (err, resultados) => {
    if (err) {
      console.error("Error al obtener historial:", err);
      return res.status(500).json({ mensaje: "Error al obtener el historial" });
    }
    res.json(resultados);
  });
});

module.exports = router;
