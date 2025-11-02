

// routes/turnos.js
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/* --------------------------------- Helpers --------------------------------- */
function isValidYear(y) {
  const n = Number(y);
  const curr = new Date().getFullYear() + 1;
  return Number.isInteger(n) && n >= 1950 && n <= curr;
}
function normServicios(s) {
  if (Array.isArray(s)) return s.map(x => String(x).trim()).filter(Boolean).join(', ');
  return String(s || '').trim();
}

/* -------------------------- Modelos por marca (GET) ------------------------- */
/**
 * GET /turnos/modelos/:marca
 * Devuelve modelos para una marca (público). Mantiene el shape [{ modelo: '...' }, ...]
 */
router.get('/modelos/:marca', async (req, res) => {
  try {
    const marca = decodeURIComponent((req.params.marca || '').trim());
    if (!marca) return res.status(400).json({ mensaje: 'Marca requerida' });

    const [rows] = await pool.query(
      `
      SELECT DISTINCT TRIM(modelo) AS modelo
      FROM modelos
      WHERE TRIM(marca) = ?
        AND TRIM(modelo) <> ''
      ORDER BY modelo ASC
      `,
      [marca]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /turnos/modelos/:marca] Error:', err);
    res.status(500).json({ mensaje: 'Error al obtener los modelos' });
  }
});

/* ----------------------- Historial de turnos (GET) ------------------------- */
/**
 * GET /turnos/historial
 * Lista del usuario autenticado (todos sus turnos, más recientes primero).
 */
router.get('/historial', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM turnos WHERE usuario_id = ? ORDER BY fecha DESC, hora DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /turnos/historial] Error:', err);
    res.status(500).json({ mensaje: 'Error al obtener el historial de turnos' });
  }
});

/* ---------------------- Próximos turnos (futuros) GET ---------------------- */
/**
 * GET /turnos/proximos
 * Turnos del usuario a partir de ahora (fecha futura o hoy con hora >= actual)
 */
router.get('/proximos', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM turnos
      WHERE usuario_id = ?
        AND (fecha > CURDATE() OR (fecha = CURDATE() AND hora >= CURTIME()))
      ORDER BY fecha ASC, hora ASC
      `,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /turnos/proximos] Error:', err);
    res.status(500).json({ mensaje: 'Error obteniendo turnos' });
  }
});

/* ----------------------------- Crear turno POST ---------------------------- */
/**
 * POST /turnos
 * Crea un turno.
 * Preferido: { auto_id, fecha, hora, motivo?, servicios (string|array), ...taller }
 * Legacy:    { marca, modelo, anio, fecha, hora, ... } (si no hay auto_id)
 */
router.post('/', requireAuth, async (req, res) => {
  const {
    auto_id,
    fecha,
    hora,
    motivo = '',
    servicios = [],
    // legacy:
    marca,
    modelo,
    anio,
    // extras de taller:
    taller,
    taller_seleccionado,
    taller_externo_nombre,
    taller_externo_direccion,
    taller_externo_telefono
  } = req.body || {};

  if (!fecha || !hora) {
    return res.status(400).json({ mensaje: 'fecha y hora son obligatorios' });
  }

  try {
    let m = marca, mo = modelo, an = anio;

    if (auto_id) {
      // Traer auto del usuario
      const [rows] = await pool.query(
        'SELECT marca, modelo, anio FROM autos WHERE id = ? AND usuario_id = ? LIMIT 1',
        [Number(auto_id), req.user.id]
      );
      if (!rows.length) {
        return res.status(400).json({ mensaje: 'El auto seleccionado no existe o no te pertenece' });
      }
      m = rows[0].marca;
      mo = rows[0].modelo;
      an = rows[0].anio;
    } else {
      // Soporte legacy (sin auto_id)
      if (!m || !mo || an === undefined) {
        return res.status(400).json({ mensaje: 'Falta auto_id o marca/modelo/anio' });
      }
    }

    if (!isValidYear(an)) {
      return res.status(400).json({ mensaje: `El año del vehículo es inválido: ${an}` });
    }

    const serviciosStr = normServicios(servicios);

    const [ins] = await pool.query(
      `
      INSERT INTO turnos
        (usuario_id, fecha, hora, motivo, servicios, marca, modelo, anio,
         taller, taller_seleccionado, taller_externo_nombre, taller_externo_direccion, taller_externo_telefono)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        fecha,
        hora,
        String(motivo).trim(),
        serviciosStr,
        m,
        mo,
        Number(an),
        taller || null,
        taller_seleccionado || null,
        taller_externo_nombre || null,
        taller_externo_direccion || null,
        taller_externo_telefono || null
      ]
    );

    res.status(201).json({ mensaje: '✅ Turno registrado correctamente', id: ins.insertId });
  } catch (err) {
    console.error('[POST /turnos] Error:', err);
    res.status(500).json({ mensaje: 'Error al registrar el turno' });
  }
});

/* ----------------------------- Editar turno PUT ---------------------------- */
/**
 * PUT /turnos/:id
 * Edita un turno si es del usuario y aún es futuro.
 * Campos editables: fecha, hora, motivo, servicios, y datos de taller.
 */
router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const {
    fecha,
    hora,
    motivo = '',
    servicios = '',
    taller,
    taller_seleccionado,
    taller_externo_nombre,
    taller_externo_direccion,
    taller_externo_telefono
  } = req.body || {};

  if (!id || !fecha || !hora) {
    return res.status(400).json({ mensaje: 'id, fecha y hora son obligatorios' });
  }

  try {
    // Verificar propiedad + que sea futuro
    const [own] = await pool.query(
      `
      SELECT id FROM turnos
      WHERE id = ? AND usuario_id = ?
        AND (fecha > CURDATE() OR (fecha = CURDATE() AND hora >= CURTIME()))
      LIMIT 1
      `,
      [id, req.user.id]
    );
    if (!own.length) {
      return res.status(404).json({ mensaje: 'Turno no encontrado o no editable' });
    }

    const serviciosStr = normServicios(servicios);

    const [upd] = await pool.query(
      `
      UPDATE turnos SET
        fecha=?, hora=?, motivo=?, servicios=?, taller=?,
        taller_seleccionado=?, taller_externo_nombre=?, taller_externo_direccion=?, taller_externo_telefono=?
      WHERE id=? AND usuario_id=?
      `,
      [
        fecha,
        hora,
        String(motivo).trim(),
        serviciosStr,
        taller || null,
        taller_seleccionado || null,
        taller_externo_nombre || null,
        taller_externo_direccion || null,
        taller_externo_telefono || null,
        id,
        req.user.id
      ]
    );

    res.json({ mensaje: 'Turno actualizado', afectados: upd.affectedRows });
  } catch (err) {
    console.error('[PUT /turnos/:id] Error:', err);
    res.status(500).json({ mensaje: 'Error actualizando turno' });
  }
});

/* --------------------------- Cancelar turno DELETE ------------------------- */
/**
 * DELETE /turnos/:id
 * Cancela (elimina) un turno si es del usuario y aún es futuro.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'id inválido' });

  try {
    const [del] = await pool.query(
      `
      DELETE FROM turnos
      WHERE id = ? AND usuario_id = ?
        AND (fecha > CURDATE() OR (fecha = CURDATE() AND hora >= CURTIME()))
      `,
      [id, req.user.id]
    );
    if (del.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado o no cancelable' });
    }
    res.json({ mensaje: 'Turno cancelado' });
  } catch (err) {
    console.error('[DELETE /turnos/:id] Error:', err);
    res.status(500).json({ mensaje: 'Error cancelando turno' });
  }
});

module.exports = router;
