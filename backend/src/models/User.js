// src/models/User.js
// Modelo de Usuario con validaciones para Costa Rica

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Información básica
  username: {
    type: String,
    required: [true, 'Nombre de usuario es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'Mínimo 3 caracteres'],
    maxlength: [20, 'Máximo 20 caracteres'],
    match: [/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Solo letras, números y guiones bajos. Debe empezar con letra']
  },
  
  email: {
    type: String,
    required: [true, 'Email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido']
  },
  
  password: {
    type: String,
    required: [true, 'Contraseña es requerida'],
    minlength: [6, 'Mínimo 6 caracteres'],
    select: false // No incluir password en queries por defecto
  },
  
  // Información personal Costa Rica
  fullName: {
    type: String,
    trim: true,
    maxlength: [100, 'Máximo 100 caracteres']
  },
  
  cedula: {
    type: String,
    required: [true, 'Cédula es requerida'],
    unique: true,
    trim: true,
    match: [/^\d{1}-\d{4}-\d{4}$/, 'Formato de cédula inválido (#-####-####)']
  },
  
  phone: {
    type: String,
    required: [true, 'Teléfono es requerido'],
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Formato de teléfono inválido (####-####)']
  },
  
  // Ubicación
  province: {
    type: String,
    required: [true, 'Provincia es requerida'],
    enum: {
      values: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'],
      message: '{VALUE} no es una provincia válida de Costa Rica'
    }
  },
  
  canton: String,
  distrito: String,
  address: String,
  
  // Información de perfil
  profilePhoto: {
    url: String,
    publicId: String, // Para Cloudinary
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Máximo 500 caracteres']
  },
  
  // Sistema P2P
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating mínimo es 0'],
    max: [5, 'Rating máximo es 5']
  },
  
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Estadísticas P2P
  stats: {
    asBuyer: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 }
    },
    asSeller: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 }
    }
  },
  
  // Sistema de verificación
  verification: {
    email: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    phone: { type: Boolean, default: false },
    phoneVerifiedAt: Date,
    identity: { type: Boolean, default: false }, // Cédula verificada
    identityVerifiedAt: Date,
  },
  
  // Códigos de verificación temporales
  verificationCodes: {
    email: {
      code: String,
      expiresAt: Date
    },
    phone: {
      code: String,
      expiresAt: Date,
      attempts: { type: Number, default: 0 }
    }
  },
  
  // Sistema de suspensiones
  suspension: {
    suspended: { type: Boolean, default: false },
    reason: String,
    until: Date,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Configuraciones
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true }
    }
  },
  
  // Rol de usuario
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  
  // Tokens para refresh JWT
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    device: String,
    ip: String
  }],
  
  // Sistema de recomendaciones
  recommendations: {
    type: Number,
    default: 0,
    min: [0, 'Las recomendaciones no pueden ser negativas']
  },
  
  recommendedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Timestamps
  lastLogin: Date,
  lastActivity: Date,
  
}, {
  timestamps: true, // createdAt, updatedAt automáticos
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.verificationCodes;
      return ret;
    }
  }
});

// Índices para performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ cedula: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ province: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ 'stats.asSeller.completed': -1 });
userSchema.index({ createdAt: -1 });

// Middleware pre-save para hashear password
userSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) return next();
  
  try {
    // Hashear password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Verificar email automáticamente si es nuevo usuario
    if (this.isNew) {
      this.verification.email = true;
      this.verification.emailVerifiedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para generar datos básicos del usuario (sin info sensible)
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    username: this.username,
    fullName: this.fullName,
    profilePhoto: this.profilePhoto,
    rating: this.rating,
    totalRatings: this.totalRatings,
    province: this.province,
    bio: this.bio,
    stats: this.stats,
    verification: {
      email: this.verification.email,
      phone: this.verification.phone,
      identity: this.verification.identity
    },
    memberSince: this.createdAt,
    lastActivity: this.lastActivity
  };
};

// Método para verificar si usuario puede usar P2P
userSchema.methods.canUseP2P = function() {
  return this.verification.phone && this.verification.identity && !this.suspension.suspended;
};

// Método para actualizar rating
userSchema.methods.updateRating = function(newRating) {
  const totalPoints = (this.rating * this.totalRatings) + newRating;
  this.totalRatings += 1;
  this.rating = totalPoints / this.totalRatings;
};

// Método para agregar refresh token
userSchema.methods.addRefreshToken = function(token, device, ip) {
  // Limpiar tokens expirados
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > new Date());
  
  // Agregar nuevo token
  this.refreshTokens.push({
    token,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    device,
    ip
  });
  
  // Mantener máximo 5 tokens activos
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Método para remover refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

// Virtual para success rate
userSchema.virtual('successRate').get(function() {
  const totalTransactions = this.stats.asBuyer.total + this.stats.asSeller.total;
  const completedTransactions = this.stats.asBuyer.completed + this.stats.asSeller.completed;
  
  if (totalTransactions === 0) return 0;
  return Math.round((completedTransactions / totalTransactions) * 100);
});

// Método estático para buscar usuarios públicos
userSchema.statics.findPublic = function(filter = {}) {
  return this.find({
    ...filter,
    'suspension.suspended': { $ne: true }
  }).select('-password -refreshTokens -verificationCodes -suspension');
};

module.exports = mongoose.model('User', userSchema);