// server.js - Tropical TCG Players Backend
// Arquitectura limpia y modular

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar middlewares
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const listingRoutes = require('./src/routes/listings');
const userRoutes = require('./src/routes/users');
const binderRoutes = require('./src/routes/binders');
const transactionRoutes = require('./src/routes/transactions');
const statsRoutes = require('./src/routes/stats');

const app = express();

console.log('🚀 Tropical TCG Backend iniciando...');

// ======== MIDDLEWARES DE SEGURIDAD ========
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting más generoso para desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    message: 'Demasiadas peticiones, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ======== MIDDLEWARES DE PARSING ========
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        success: false,
        message: 'JSON inválido'
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======== CONFIGURACIÓN DE BASE DE DATOS ========
const connectDB = async () => {
  try {
    if (process.env.USE_MEMORY_DB === 'true') {
      // MongoDB en memoria para desarrollo
      const { MongoMemoryServer } = require('mongodb-memory-server');
      
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'tropical-tcg-dev'
        }
      });
      
      const uri = mongod.getUri();
      console.log('📦 Usando MongoDB en memoria:', uri);
      
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      console.log('✅ Conectado a MongoDB en memoria');
      
    } else {
      // MongoDB Atlas para producción
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      console.log('✅ Conectado a MongoDB Atlas');
    }
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// ======== HEALTH CHECK ========
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    success: true,
    status: 'OK',
    message: 'Tropical TCG Backend funcionando correctamente',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    timestamp: new Date().toISOString()
  });
});

// ======== API ROUTES ========
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingRoutes);  
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/binders', binderRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/stats', statsRoutes);

// ======== MIDDLEWARES DE ERROR ========
app.use(notFound);
app.use(errorHandler);

// ======== INICIAR SERVIDOR ========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🎯 =====================================');
      console.log(`🚀 Servidor backend ejecutándose en puerto ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🛍️  API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/auth`);
      console.log(`🃏 Listings: http://localhost:${PORT}/api/v1/listings`);
      console.log('🎯 =====================================');
      console.log('');
    });

    // Manejo de señales de terminación
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM recibido, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        mongoose.connection.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT recibido, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        mongoose.connection.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Inicializar
startServer();

module.exports = app;