
// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

/* ------------------ helpers ------------------ */
function toInt(n, def=0){ const x = Number(n); return Number.isFinite(x) ? x : def; }
function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }
const allowedUserFields = new Set(['nombre','email','rol','plan','plan_paid','activo','marketing_opt_in']);

/* ------------------ stats ------------------ */
router.get('/stats', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const [[u]] = await pool.query(
      `SELECT COUNT(*) usuarios,
              SUM(activo=1) usuarios_activos,
              SUM(rol='admin') admins
       FROM usuarios`
    );
    const [[t]] = await pool.query(
      `SELECT COUNT(*) turnos,
              SUM(fecha>CURDATE() OR (fecha=CURDATE() AND hora>=CURTIME())) turnos_futuros
       FROM turnos`
    );
    res.json({ ...u, ...t });
  }catch(e){ console.error('[admin/stats]',e); res.status(500).json({mensaje:'Error obteniendo stats'}); }
});

/* ------------------ crear usuario (mejor práctica) ------------------ */
/**
 * POST /admin/usuarios
 * Body: { nombre, email, password, rol='usuario'|'admin', plan='standard', plan_paid=1, activo=1 }
 * NO exige pago ni autos. Protegido por admin.
 */
router.post('/usuarios', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const {
      nombre = '', email = '', password = '',
      rol = 'usuario', plan = 'standard', plan_paid = 1,
      activo = 1, marketing_opt_in = 0, terms_version = 'v1.0'
    } = req.body || {};

    if(!nombre || !email || !password)
      return res.status(400).json({mensaje:'nombre, email y password son requeridos'});
    if(!validEmail(email))
      return res.status(400).json({mensaje:'Email inválido'});
    if(String(password).length < 8)
      return res.status(400).json({mensaje:'La contraseña debe tener al menos 8 caracteres'});

    const [[ex]] = await pool.query('SELECT COUNT(*) c FROM usuarios WHERE email=? LIMIT 1',[email]);
    if (ex && ex.c>0) return res.status(409).json({mensaje:'Email ya registrado'});

    const hash = await bcrypt.hash(String(password), 10);
    const now  = new Date();

    const [ins] = await pool.query(
      `INSERT INTO usuarios
       (nombre,email,password,rol,terms_accepted_at,terms_version,marketing_opt_in,plan,plan_paid,activo)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [String(nombre).trim(), String(email).trim(), hash,
       (String(rol).toLowerCase()==='admin'?'admin':'usuario'),
       now, terms_version, marketing_opt_in?1:0,
       String(plan||'standard').toLowerCase(), plan_paid?1:0, activo?1:0]
    );

    res.status(201).json({mensaje:'Usuario creado', id: ins.insertId});
  }catch(e){ console.error('[POST /admin/usuarios]',e); res.status(500).json({mensaje:'Error creando usuario'}); }
});

/* ------------------ listar ------------------ */
router.get('/usuarios', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const q = String(req.query.search||'').trim();
    let where = '1=1', args=[];
    if (q){ where='(nombre LIKE ? OR email LIKE ? OR rol LIKE ?)'; args=[`%${q}%`,`%${q}%`,`%${q}%`]; }
    const [rows] = await pool.query(
      `SELECT id,nombre,email,rol,plan,plan_paid,activo,
              DATE_FORMAT(creado_en,'%Y-%m-%d %H:%i:%s') creado_en
       FROM usuarios WHERE ${where} ORDER BY id DESC LIMIT 300`, args
    );
    res.json(rows);
  }catch(e){ console.error('[GET /admin/usuarios]',e); res.status(500).json({mensaje:'Error al obtener usuarios'}); }
});

/* ------------------ actualizar (campos permitidos) ------------------ */
router.patch('/usuarios/:id', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const id = toInt(req.params.id);
    if(!id) return res.status(400).json({mensaje:'id inválido'});
    const sets=[], args=[];
    for(const [k,v] of Object.entries(req.body||{})){
      if(!allowedUserFields.has(k)) continue;
      if (['plan_paid','activo','marketing_opt_in'].includes(k)) { sets.push(`${k}=?`); args.push(v?1:0); }
      else { sets.push(`${k}=?`); args.push(v); }
    }
    if(!sets.length) return res.status(400).json({mensaje:'Nada para actualizar'});
    const [r] = await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id=?`, [...args,id]);
    if(!r.affectedRows) return res.status(404).json({mensaje:'Usuario no encontrado'});
    res.json({mensaje:'Usuario actualizado'});
  }catch(e){ console.error('[PATCH /admin/usuarios/:id]',e); res.status(500).json({mensaje:'Error actualizando usuario'}); }
});

/* ------------------ activar/desactivar ------------------ */
router.post('/usuarios/:id/desactivar', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const id=toInt(req.params.id);
    const [r]=await pool.query('UPDATE usuarios SET activo=0 WHERE id=?',[id]);
    if(!r.affectedRows) return res.status(404).json({mensaje:'Usuario no encontrado'});
    res.json({mensaje:'Usuario desactivado'});
  }catch(e){ res.status(500).json({mensaje:'Error'}); }
});
router.post('/usuarios/:id/reactivar', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const id=toInt(req.params.id);
    const [r]=await pool.query('UPDATE usuarios SET activo=1 WHERE id=?',[id]);
    if(!r.affectedRows) return res.status(404).json({mensaje:'Usuario no encontrado'});
    res.json({mensaje:'Usuario reactivado'});
  }catch(e){ res.status(500).json({mensaje:'Error'}); }
});

/* ------------------ reset password ------------------ */
router.post('/usuarios/:id/reset-password', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const id=toInt(req.params.id);
    let pwd = String(req.body?.new_password||'').trim();
    if(!pwd) pwd = Math.random().toString(36).slice(2,10)+'A1!';
    const hash=await bcrypt.hash(pwd,10);
    const [r]=await pool.query('UPDATE usuarios SET password=? WHERE id=?',[hash,id]);
    if(!r.affectedRows) return res.status(404).json({mensaje:'Usuario no encontrado'});
    res.json({mensaje:'Contraseña restablecida', temp_password: pwd});
  }catch(e){ console.error('[reset-password]',e); res.status(500).json({mensaje:'Error reseteando contraseña'}); }
});

/* ------------------ detalles ------------------ */
router.get('/usuarios/:id/autos', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const id=toInt(req.params.id);
    const [rows]=await pool.query('SELECT id,marca,modelo,anio FROM autos WHERE usuario_id=? ORDER BY id DESC',[id]);
    res.json(rows);
  }catch(e){ res.status(500).json({mensaje:'Error obteniendo autos'}); }
});
router.get('/usuarios/:id/turnos', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const id=toInt(req.params.id);
    const [rows]=await pool.query(
      `SELECT id,fecha,hora,servicios,motivo,marca,modelo,anio
       FROM turnos WHERE usuario_id=? ORDER BY fecha DESC,hora DESC`, [id]
    );
    res.json(rows);
  }catch(e){ res.status(500).json({mensaje:'Error obteniendo turnos'}); }
});

/* ------------------ eliminar ------------------ */
router.delete('/usuarios/:id', requireAuth, requireAdmin, async (req,res)=>{
  try{
    const id=toInt(req.params.id);
    await pool.query('DELETE FROM autos WHERE usuario_id=?',[id]);
    await pool.query('DELETE FROM turnos WHERE usuario_id=?',[id]);
    const [r]=await pool.query('DELETE FROM usuarios WHERE id=?',[id]);
    if(!r.affectedRows) return res.status(404).json({mensaje:'Usuario no encontrado'});
    res.json({mensaje:'Usuario eliminado'});
  }catch(e){ console.error('[DELETE /admin/usuarios/:id]',e); res.status(500).json({mensaje:'Error eliminando usuario'}); }
});

module.exports = router;

