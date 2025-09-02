// src/app.js
// Configuración principal de Express

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60), // minutos
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Request timing
    this.app.use((req, res, next) => {
      req.requestTime = new Date().toISOString();
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        database: require('./config/database').isConnected() ? 'connected' : 'disconnected'
      });
    });

    // API routes prefix
    this.app.use('/api/v1', this.getApiRoutes());

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: '🎯 Tropical TCG Players API',
        version: '1.0.0',
        environment: config.NODE_ENV,
        docs: '/api/v1/docs',
        health: '/health',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          listings: '/api/v1/listings',
          transactions: '/api/v1/transactions',
          cards: '/api/v1/cards',
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint no encontrado',
        message: `Ruta ${req.method} ${req.originalUrl} no existe`,
        availableEndpoints: '/api/v1'
      });
    });
  }

  getApiRoutes() {
    const router = express.Router();

    // Middleware para todas las rutas API
    router.use((req, res, next) => {
      res.setHeader('X-API-Version', '1.0.0');
      next();
    });

    // Auth routes
    router.use('/auth', require('./routes/auth'));

    // Protected routes (requieren autenticación)
    const { authRequired } = require('./middleware/auth');
    const { requireAdmin } = require('./middleware/adminAuth');
    
    router.use('/users', authRequired, require('./routes/users'));
    router.use('/listings', require('./routes/listings'));
    router.use('/transactions', authRequired, require('./routes/transactions'));
    router.use('/cards', require('./routes/cards'));

    // Admin routes (requieren rol admin)
    router.use('/admin', authRequired, requireAdmin, require('./routes/admin'));

    return router;
  }

  setupErrorHandling() {
    // Async error handler
    this.app.use((err, req, res, next) => {
      console.error('💥 Error no manejado:', err);

      // Mongoose validation errors
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
          error: 'Error de validación',
          message: 'Datos inválidos proporcionados',
          details: errors
        });
      }

      // Mongoose cast errors
      if (err.name === 'CastError') {
        return res.status(400).json({
          error: 'ID inválido',
          message: 'El ID proporcionado no es válido'
        });
      }

      // JWT errors
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token inválido',
          message: 'El token de autenticación es inválido'
        });
      }

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          message: 'El token de autenticación ha expirado'
        });
      }

      // Multer errors (file upload)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'Archivo muy grande',
          message: `El archivo excede el límite de ${config.security.maxFileSize / 1024 / 1024}MB`
        });
      }

      // Default error
      const statusCode = err.statusCode || 500;
      const message = config.NODE_ENV === 'development' 
        ? err.message 
        : 'Error interno del servidor';

      res.status(statusCode).json({
        error: 'Error del servidor',
        message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error('💥 Unhandled Promise Rejection:', err);
      // Don't exit in development
      if (config.NODE_ENV !== 'development') {
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      process.exit(1);
    });
  }

  getExpressApp() {
    return this.app;
  }
}

module.exports = App;