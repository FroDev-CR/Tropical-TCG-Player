// src/config/index.js
// Configuraciones centralizadas de la aplicación

require('dotenv').config();

const config = {
  // Entorno
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 5000,
  
  // Base de datos
  database: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://FroDevCR:Froder8562.@cluster0.cerfuei.mongodb.net/tropical-tcg?retryWrites=true&w=majority&appName=Cluster0',
    name: process.env.DB_NAME || 'tropical-tcg',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-me',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  },

  // CORS
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'brevo',
    apiKey: process.env.BREVO_API_KEY,
    sender: {
      email: process.env.SENDER_EMAIL || 'dev@tropicaltcg.local',
      name: process.env.SENDER_NAME || 'Tropical TCG Players',
    },
  },

  // WhatsApp
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_ID,
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // APIs externas
  apis: {
    pokemon: {
      key: process.env.POKEMON_API_KEY,
      url: 'https://api.pokemontcg.io/v2/',
    },
    tcg: {
      key: process.env.TCG_API_KEY,
      url: 'https://apitcg.com/api/',
    },
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },

  // Seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5,
  },

  // Validaciones Costa Rica
  costarica: {
    tseApiUrl: process.env.TSE_API_URL,
    tseApiKey: process.env.TSE_API_KEY,
  },
};

// Validaciones de configuración crítica
const validateConfig = () => {
  const requiredFields = [
    'database.uri',
    'jwt.secret',
  ];

  const missing = requiredFields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config);
    return !value;
  });

  if (missing.length > 0) {
    console.error('❌ Configuración incompleta. Faltan:', missing);
    process.exit(1);
  }

  // Warnings para desarrollo
  if (config.NODE_ENV === 'development') {
    console.log('⚠️  Modo desarrollo activo');
    if (config.jwt.secret.includes('fallback')) {
      console.warn('⚠️  Usando JWT secret de fallback. Cambiar en producción.');
    }
  }
};

// Validar al cargar
validateConfig();

module.exports = config;