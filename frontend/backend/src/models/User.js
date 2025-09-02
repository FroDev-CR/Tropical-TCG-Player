// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Información básica de autenticación
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Información personal
  fullName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true
  },
  cedula: {
    type: String,
    trim: true,
    sparse: true // Permite null pero debe ser único si existe
  },
  province: {
    type: String,
    enum: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón']
  },
  
  // Foto de perfil
  profilePhoto: {
    url: String,
    publicId: String // Para Cloudinary
  },
  
  // Sistema de verificación
  verification: {
    email: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verificationToken: String
    },
    phone: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      code: String
    },
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      documents: [String] // URLs de documentos
    }
  },
  
  // Sistema de calificaciones
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  
  // Estadísticas de transacciones
  stats: {
    totalTransactions: { type: Number, default: 0 },
    completedSales: { type: Number, default: 0 },
    completedPurchases: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
  },
  
  // Estado de la cuenta
  status: {
    active: { type: Boolean, default: true },
    suspended: { type: Boolean, default: false },
    suspendedUntil: Date,
    suspensionReason: String,
    bannedReason: String
  },
  
  // Configuraciones del usuario
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      transactionUpdates: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      showPhone: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showRating: { type: Boolean, default: true }
    }
  },
  
  // Rol del usuario
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  
  // Referencias a otras colecciones
  binders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Binder' }],
  listings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  
  // Datos de sesión
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }]
}, {
  timestamps: true
});

// Índices
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'verification.email.verified': 1 });
userSchema.index({ 'verification.phone.verified': 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ 'stats.lastActivity': -1 });

// Métodos del schema
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.verification.email.verificationToken;
  delete user.verification.phone.code;
  return user;
};

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.updateStats = function(statType, amount = 1) {
  this.stats.lastActivity = new Date();
  this.stats.totalTransactions += 1;
  
  if (statType === 'sale') {
    this.stats.completedSales += 1;
    this.stats.totalEarned += amount;
  } else if (statType === 'purchase') {
    this.stats.completedPurchases += 1;
    this.stats.totalSpent += amount;
  }
};

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Limpiar tokens expirados
userSchema.methods.cleanExpiredTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(token => token.expiresAt > now);
};

module.exports = mongoose.model('User', userSchema);