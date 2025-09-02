// src/middleware/errorHandler.js

// Middleware de manejo de errores centralizado
const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  let error = { ...err };
  error.message = err.message;
  
  // Error de Cast (ID de MongoDB inválido)
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = {
      success: false,
      message,
      statusCode: 404
    };
  }
  
  // Error de duplicado (E11000)
  if (err.code === 11000) {
    let field = Object.keys(err.keyPattern)[0];
    let message = `${field} ya existe`;
    
    // Mensajes específicos para campos comunes
    if (field === 'email') message = 'El email ya está registrado';
    if (field === 'username') message = 'El nombre de usuario ya existe';
    if (field === 'cedula') message = 'La cédula ya está registrada';
    
    error = {
      success: false,
      message,
      statusCode: 400
    };
  }
  
  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      success: false,
      message: messages.join('. '),
      statusCode: 400
    };
  }
  
  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Token inválido',
      statusCode: 401
    };
  }
  
  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expirado',
      statusCode: 401
    };
  }
  
  // Error por defecto
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Error interno del servidor';
  
  // Si ya es una respuesta HTTP válida, no la modificar
  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
};

// Middleware para manejar rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};