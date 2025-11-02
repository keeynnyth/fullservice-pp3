

// middleware/admin.js
function requireAdmin(req, res, next) {
  try {
    if (!req.user || String(req.user.rol).toLowerCase() !== 'admin') {
      return res.status(403).json({ mensaje: 'Requiere rol administrador' });
    }
    next();
  } catch {
    return res.status(403).json({ mensaje: 'Requiere rol administrador' });
  }
}
module.exports = { requireAdmin };
