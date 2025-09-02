// src/models/Listing.js
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  // Información de la carta
  cardId: {
    type: String,
    required: true
  },
  cardName: {
    type: String,
    required: true,
    trim: true
  },
  cardImage: {
    type: String,
    required: true
  },
  tcgType: {
    type: String,
    required: true,
    enum: ['pokemon', 'onepiece', 'dragonball', 'digimon', 'magic', 'unionarena', 'gundam']
  },
  setName: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    required: true
  },
  
  // Información de venta
  price: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    required: true,
    enum: ['mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Información del vendedor
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Descripción y detalles
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Imágenes adicionales
  additionalImages: [{
    url: String,
    publicId: String, // Para Cloudinary
    description: String
  }],
  
  // Opciones de envío
  shipping: {
    included: { type: Boolean, default: false },
    cost: { type: Number, default: 600 },
    methods: [{
      type: String,
      enum: ['pickup', 'store_network', 'courier', 'mail']
    }]
  },
  
  // Ubicación
  location: {
    province: String,
    city: String,
    store: String // Si usa red de tiendas
  },
  
  // Estado del listing
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold_out', 'removed'],
    default: 'active'
  },
  
  // Estadísticas
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  
  // Reservas temporales para transacciones P2P
  reservations: [{
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    quantity: Number,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Etiquetas automáticas
  tags: [{
    type: String,
    enum: ['hot', 'new', 'rare', 'popular', 'deal']
  }],
  
  // Fechas importantes
  publishedAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
  soldAt: Date
}, {
  timestamps: true
});

// Índices
listingSchema.index({ sellerId: 1, status: 1 });
listingSchema.index({ tcgType: 1, status: 1 });
listingSchema.index({ cardName: 'text', setName: 'text' });
listingSchema.index({ price: 1 });
listingSchema.index({ condition: 1 });
listingSchema.index({ publishedAt: -1 });
listingSchema.index({ views: -1 });

// Virtual para disponibilidad real
listingSchema.virtual('realAvailability').get(function() {
  return Math.max(0, this.availableQuantity - this.reservedQuantity);
});

// Métodos del schema
listingSchema.methods.reserveQuantity = function(quantity, transactionId, expiresInMinutes = 60) {
  if (this.realAvailability < quantity) {
    throw new Error('Cantidad insuficiente disponible');
  }
  
  const expiresAt = new Date(Date.now() + (expiresInMinutes * 60 * 1000));
  
  this.reservations.push({
    transactionId,
    quantity,
    expiresAt
  });
  
  this.reservedQuantity += quantity;
  return this.save();
};

listingSchema.methods.releaseReservation = function(transactionId) {
  const reservation = this.reservations.find(r => 
    r.transactionId.toString() === transactionId.toString()
  );
  
  if (reservation) {
    this.reservedQuantity -= reservation.quantity;
    this.reservations = this.reservations.filter(r => 
      r.transactionId.toString() !== transactionId.toString()
    );
    return this.save();
  }
  
  return Promise.resolve(this);
};

listingSchema.methods.confirmSale = function(quantity) {
  this.availableQuantity -= quantity;
  this.totalSold += quantity;
  
  if (this.availableQuantity <= 0) {
    this.status = 'sold_out';
    this.soldAt = new Date();
  }
  
  return this.save();
};

listingSchema.methods.addView = function() {
  this.views += 1;
  return this.save();
};

// Middleware para limpiar reservaciones expiradas
listingSchema.methods.cleanExpiredReservations = function() {
  const now = new Date();
  const expiredReservations = this.reservations.filter(r => r.expiresAt <= now);
  
  if (expiredReservations.length > 0) {
    const releasedQuantity = expiredReservations.reduce((sum, r) => sum + r.quantity, 0);
    this.reservedQuantity -= releasedQuantity;
    this.reservations = this.reservations.filter(r => r.expiresAt > now);
  }
  
  return this.save();
};

// Pre-save middleware
listingSchema.pre('save', function(next) {
  this.lastUpdatedAt = new Date();
  
  // Generar etiquetas automáticas
  this.tags = [];
  
  if (this.isNew) {
    this.tags.push('new');
  }
  
  if (this.views > 100) {
    this.tags.push('popular');
  }
  
  if (this.rarity === 'Ultra Rare' || this.rarity === 'Secret Rare') {
    this.tags.push('rare');
  }
  
  next();
});

module.exports = mongoose.model('Listing', listingSchema);