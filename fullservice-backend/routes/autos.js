

// routes/autos.js
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function isValidYear(y) {
  const n = Number(y);
  const curr = new Date().getFullYear() + 1;
  return Number.isInteger(n) && n >= 1950 && n <= curr;
}

/**
 * GET /autos/mios
 * Lista de autos del usuario autenticado
 */
router.get('/mios', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, marca, modelo, anio FROM autos WHERE usuario_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('[GET /autos/mios] Error:', e);
    res.status(500).json({ mensaje: 'Error listando autos' });
  }
});

/**
 * POST /autos
 * Crear UN auto para el usuario autenticado
 * Body: { marca, modelo, anio }
 */
router.post('/', requireAuth, async (req, res) => {
  const { marca, modelo, anio } = req.body || {};
  if (!marca || !modelo || anio === undefined) {
    return res.status(400).json({ mensaje: 'Debe indicar marca, modelo y anio' });
  }
  if (!isValidYear(anio)) {
    return res.status(400).json({ mensaje: `Año inválido: ${anio}` });
  }
  try {
    const [r] = await pool.query(
      'INSERT INTO autos (usuario_id, marca, modelo, anio) VALUES (?, ?, ?, ?)',
      [req.user.id, String(marca).trim(), String(modelo).trim(), Number(anio)]
    );
    res.status(201).json({ mensaje: 'Auto agregado', id: r.insertId });
  } catch (e) {
    console.error('[POST /autos] Error:', e);
    res.status(500).json({ mensaje: 'Error agregando auto' });
  }
});

/**
 * POST /autos/batch
 * Alta masiva de autos para el usuario autenticado
 * Body: { autos: [ { marca, modelo, anio }, ... ] }
 */
router.post('/batch', requireAuth, async (req, res) => {
  const { autos = [] } = req.body || {};
  if (!Array.isArray(autos) || autos.length === 0) {
    return res.status(400).json({ mensaje: 'Provee al menos un auto' });
  }
  const values = [];
  for (const a of autos) {
    if (!a || !a.marca || !a.modelo || a.anio === undefined) {
      return res.status(400).json({ mensaje: 'Cada auto requiere marca, modelo y anio' });
    }
    if (!isValidYear(a.anio)) {
      return res.status(400).json({ mensaje: `Año inválido: ${a.anio}` });
    }
    values.push([req.user.id, String(a.marca).trim(), String(a.modelo).trim(), Number(a.anio)]);
  }

  try {
    const [r] = await pool.query(
      'INSERT INTO autos (usuario_id, marca, modelo, anio) VALUES ?',
      [values]
    );
    res.status(201).json({ mensaje: 'Autos agregados', insertados: r.affectedRows });
  } catch (e) {
    console.error('[POST /autos/batch] Error:', e);
    res.status(500).json({ mensaje: 'Error agregando autos' });
  }
});

/**
 * PUT /autos/:id
 * Actualiza un auto del usuario autenticado
 */
router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { marca, modelo, anio } = req.body || {};
  if (!id) return res.status(400).json({ mensaje: 'id inválido' });
  if (!marca || !modelo || anio === undefined) {
    return res.status(400).json({ mensaje: 'Debe indicar marca, modelo y anio' });
  }
  if (!isValidYear(anio)) {
    return res.status(400).json({ mensaje: `Año inválido: ${anio}` });
  }
  try {
    const [r] = await pool.query(
      'UPDATE autos SET marca=?, modelo=?, anio=? WHERE id=? AND usuario_id=?',
      [String(marca).trim(), String(modelo).trim(), Number(anio), id, req.user.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ mensaje: 'Auto no encontrado' });
    res.json({ mensaje: 'Auto actualizado' });
  } catch (e) {
    console.error('[PUT /autos/:id] Error:', e);
    res.status(500).json({ mensaje: 'Error actualizando auto' });
  }
});

/**
 * DELETE /autos/:id
 * Elimina un auto del usuario autenticado
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'id inválido' });
  try {
    const [r] = await pool.query('DELETE FROM autos WHERE id = ? AND usuario_id = ?', [id, req.user.id]);
    if (r.affectedRows === 0) return res.status(404).json({ mensaje: 'Auto no encontrado' });
    res.json({ mensaje: 'Auto eliminado' });
  } catch (e) {
    console.error('[DELETE /autos/:id] Error:', e);
    res.status(500).json({ mensaje: 'Error eliminando auto' });
  }
});

module.exports = router;


