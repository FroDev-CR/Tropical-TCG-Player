// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para autenticar token JWT
const authenticate = async (req, res, next) => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token requerido' 
      });
    }
    
    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tropical-tcg-secret');
    
    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido - usuario no existe' 
      });
    }
    
    // Verificar que el usuario esté activo
    if (!user.status.active || user.status.suspended) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta suspendida o inactiva'
      });
    }
    
    // Adjuntar usuario a request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('❌ Error en autenticación:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Token malformado' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Middleware para autorizar roles específicos
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rol '${req.user.role}' no autorizado. Se requiere: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tropical-tcg-secret');
      const user = await User.findById(decoded.userId);
      
      if (user && user.status.active && !user.status.suspended) {
        req.user = user;
      }
    }
    
    next();
    
  } catch (error) {
    // Silentemente continuar sin usuario autenticado
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate
};