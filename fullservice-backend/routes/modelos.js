

// routes/modelos.js
const express = require('express');
const { pool } = require('../db');
const router = express.Router();

/**
 * GET /modelos/marcas
 * Marcas únicas ordenadas alfabéticamente (sin duplicados, con TRIM defensivo)
 */
router.get('/marcas', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT TRIM(marca) AS marca
      FROM modelos
      WHERE TRIM(marca) <> ''
      ORDER BY marca ASC
    `);
    const marcas = rows.map(r => r.marca);
    res.json({ marcas });
  } catch (e) {
    console.error('[GET /modelos/marcas] Error:', e);
    res.status(500).json({ mensaje: 'Error listando marcas' });
  }
});

/**
 * GET /modelos
 * - /modelos?marca=Ford  -> Modelos únicos de esa marca
 * - /modelos             -> Pares (marca, modelo) únicos
 */
router.get('/', async (req, res) => {
  const marca = (req.query?.marca || '').trim();

  try {
    if (marca) {
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
      return res.json({ marca, modelos: rows.map(r => r.modelo) });
    } else {
      const [rows] = await pool.query(`
        SELECT DISTINCT TRIM(marca) AS marca, TRIM(modelo) AS modelo
        FROM modelos
        WHERE TRIM(marca) <> '' AND TRIM(modelo) <> ''
        ORDER BY marca ASC, modelo ASC
      `);
      return res.json({ modelos: rows });
    }
  } catch (e) {
    console.error('[GET /modelos] Error:', e);
    res.status(500).json({ mensaje: 'Error listando modelos' });
  }
});

/**
 * GET /modelos/:marca
 * Atajo REST para obtener modelos por marca (equivalente a ?marca=)
 * Nota: Defínelo después de /marcas para no colisionar.
 */
router.get('/:marca', async (req, res) => {
  try {
    const marca = decodeURIComponent((req.params?.marca || '').trim());
    if (!marca) {
      return res.status(400).json({ mensaje: 'Marca requerida' });
    }
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
    res.json({ marca, modelos: rows.map(r => r.modelo) });
  } catch (e) {
    console.error('[GET /modelos/:marca] Error:', e);
    res.status(500).json({ mensaje: 'Error listando modelos por marca' });
  }
});

module.exports = router;
