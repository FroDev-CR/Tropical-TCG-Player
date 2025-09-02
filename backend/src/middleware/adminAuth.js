// src/middleware/adminAuth.js
// Middleware de autenticación de admin

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Acceso denegado',
      message: 'Autenticación requerida'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requiere rol de administrador'
    });
  }
  
  next();
};

module.exports = {
  requireAdmin
};