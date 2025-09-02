// src/middleware/auth.js
// Middleware de autenticación JWT

const User = require('../models/User');
const jwtUtil = require('../utils/jwt');

/**
 * Middleware de autenticación requerida
 */
const authRequired = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.get('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Token de autenticación requerido'
      });
    }
    
    const token = jwtUtil.extractTokenFromHeader(authHeader);
    
    // Verificar token
    let decoded;
    try {
      decoded = jwtUtil.verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        error: 'Token inválido',
        message: error.message
      });
    }
    
    // Buscar usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al token no existe'
      });
    }
    
    // Verificar si está suspendido
    if (user.suspension.suspended) {
      return res.status(403).json({
        error: 'Usuario suspendido',
        message: 'Tu cuenta está suspendida'
      });
    }
    
    // Actualizar última actividad
    user.lastActivity = new Date();
    await user.save();
    
    // Agregar usuario a la request
    req.user = user;
    req.tokenPayload = decoded;
    
    next();
    
  } catch (error) {
    console.error('❌ Error en middleware auth:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'Error interno de autenticación'
    });
  }
};

/**
 * Middleware de autenticación opcional
 */
const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }
    
    const token = jwtUtil.extractTokenFromHeader(authHeader);
    
    try {
      const decoded = jwtUtil.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && !user.suspension.suspended) {
        user.lastActivity = new Date();
        await user.save();
        req.user = user;
        req.tokenPayload = decoded;
      } else {
        req.user = null;
      }
    } catch (error) {
      req.user = null;
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Error en middleware auth opcional:', error);
    req.user = null;
    next();
  }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Autenticación requerida'
      });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos suficientes'
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar que el usuario puede usar P2P
 */
const requireP2PVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Acceso denegado',
      message: 'Autenticación requerida'
    });
  }
  
  if (!req.user.canUseP2P()) {
    return res.status(403).json({
      error: 'Verificación requerida',
      message: 'Debes verificar tu teléfono y cédula para usar el sistema P2P'
    });
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario es el propietario del recurso
 */
const requireOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Autenticación requerida'
      });
    }
    
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (resourceUserId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes acceder a tus propios recursos'
      });
    }
    
    next();
  };
};

module.exports = {
  authRequired,
  authOptional,
  requireRole,
  requireP2PVerification,
  requireOwnership
};