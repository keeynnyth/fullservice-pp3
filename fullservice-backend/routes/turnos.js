

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
  const {
    fecha,
    hora,
    motivo,
    servicios,
    marca,
    modelo,
    anio,
    taller,
    taller_seleccionado,
    taller_externo_nombre,
    taller_externo_direccion,
    taller_externo_telefono
  } = req.body;

  const usuarioId = req.usuario.id;

  // Asegurar que servicios sea un string separado por comas
  const serviciosStr = Array.isArray(servicios) ? servicios.join(", ") : servicios;

  const query = `
    INSERT INTO turnos (
      usuario_id, fecha, hora, motivo, servicios, 
      marca, modelo, anio, taller, 
      taller_seleccionado, taller_externo_nombre, 
      taller_externo_direccion, taller_externo_telefono
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    usuarioId,
    fecha,
    hora,
    motivo,
    serviciosStr,
    marca,
    modelo,
    anio,
    taller,
    taller_seleccionado,
    taller_externo_nombre,
    taller_externo_direccion,
    taller_externo_telefono
  ];

  db.query(query, valores, (err, result) => {
    if (err) {
      console.error("❌ Error al insertar turno:", err);
      return res.status(500).json({ mensaje: "Error al registrar el turno" });
    }
    res.status(201).json({ mensaje: "✅ Turno registrado correctamente" });
  });
});

// Obtener historial de turnos del usuario
router.get("/historial", verificarToken, (req, res) => {
  const usuarioId = req.usuario.id;

  const query = `
    SELECT 
      fecha, hora, motivo, servicios, 
      marca, modelo, anio, taller, 
      taller_seleccionado, taller_externo_nombre, 
      taller_externo_direccion, taller_externo_telefono 
    FROM turnos 
    WHERE usuario_id = ? 
    ORDER BY fecha DESC
  `;

  db.query(query, [usuarioId], (err, resultados) => {
    if (err) {
      console.error("❌ Error al obtener historial:", err);
      return res.status(500).json({ mensaje: "Error al obtener el historial" });
    }
    res.json(resultados);
  });
});

module.exports = router;
