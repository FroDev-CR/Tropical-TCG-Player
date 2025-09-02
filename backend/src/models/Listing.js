// src/models/Listing.js
// Modelo de Listing - Cartas en venta con sistema P2P

const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  // Información de la carta
  cardId: {
    type: String,
    required: [true, 'ID de carta es requerido'],
    index: true
  },
  
  cardName: {
    type: String,
    required: [true, 'Nombre de carta es requerido'],
    trim: true,
    maxlength: [200, 'Nombre muy largo']
  },
  
  cardImage: {
    type: String,
    required: [true, 'Imagen de carta es requerida']
  },
  
  // TCG y set información
  tcgType: {
    type: String,
    required: [true, 'Tipo de TCG es requerido'],
    enum: {
      values: ['pokemon', 'onepiece', 'dragonball', 'digimon', 'magic', 'unionarena', 'gundam'],
      message: 'Tipo de TCG no válido'
    },
    index: true
  },
  
  setName: {
    type: String,
    required: [true, 'Nombre del set es requerido'],
    trim: true,
    maxlength: [100, 'Nombre de set muy largo']
  },
  
  rarity: {
    type: String,
    required: [true, 'Rareza es requerida'],
    trim: true,
    maxlength: [50, 'Rareza muy larga']
  },
  
  // Información de venta
  price: {
    type: Number,
    required: [true, 'Precio es requerido'],
    min: [100, 'Precio mínimo ₡100'],
    max: [10000000, 'Precio máximo ₡10,000,000']
  },
  
  condition: {
    type: String,
    required: [true, 'Condición es requerida'],
    enum: {
      values: ['mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor'],
      message: 'Condición no válida'
    }
  },
  
  // Inventario y disponibilidad
  quantity: {
    type: Number,
    required: [true, 'Cantidad es requerida'],
    min: [1, 'Cantidad mínima es 1'],
    max: [100, 'Cantidad máxima es 100'],
    validate: {
      validator: Number.isInteger,
      message: 'La cantidad debe ser un número entero'
    }
  },
  
  availableQuantity: {
    type: Number,
    required: true,
    min: [0, 'Cantidad disponible no puede ser negativa'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value <= this.quantity;
      },
      message: 'Cantidad disponible debe ser entero y menor o igual a cantidad total'
    }
  },
  
  reservedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Cantidad reservada no puede ser negativa'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && (this.availableQuantity + value) <= this.quantity;
      },
      message: 'Cantidad reservada inválida'
    }
  },
  
  // Descripción opcional
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Descripción muy larga (máximo 1000 caracteres)']
  },
  
  // Información del vendedor
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendedor es requerido'],
    index: true
  },
  
  sellerName: {
    type: String,
    required: [true, 'Nombre del vendedor es requerido']
  },
  
  sellerLocation: {
    type: String,
    required: [true, 'Ubicación del vendedor es requerida']
  },
  
  // Sistema de envío
  shippingIncluded: {
    type: Boolean,
    default: false
  },
  
  originStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
  // Estado del listing
  status: {
    type: String,
    enum: ['active', 'sold_out', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // Reservas temporales para transacciones P2P
  reservations: [{
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Cantidad reservada debe ser al menos 1']
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }
    }
  }],
  
  // Métricas del listing
  views: {
    type: Number,
    default: 0,
    min: [0, 'Las vistas no pueden ser negativas']
  },
  
  favorites: {
    type: Number,
    default: 0,
    min: [0, 'Los favoritos no pueden ser negativos']
  },
  
  // Imágenes adicionales (opcional)
  additionalImages: [{
    url: String,
    publicId: String, // Para Cloudinary
    description: String
  }],
  
  // Estadísticas de venta
  totalSold: {
    type: Number,
    default: 0,
    min: [0, 'Total vendido no puede ser negativo']
  },
  
  lastSaleDate: Date,
  
  // Tags para búsqueda
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
}, {
  timestamps: true, // createdAt, updatedAt automáticos
  toJSON: {
    transform: function(doc, ret) {
      // Calcular disponibilidad real
      ret.realAvailability = ret.availableQuantity - ret.reservedQuantity;
      return ret;
    }
  }
});

// Índices para performance y búsqueda
listingSchema.index({ sellerId: 1, status: 1 });
listingSchema.index({ tcgType: 1, status: 1 });
listingSchema.index({ cardName: 'text', description: 'text', tags: 'text' });
listingSchema.index({ price: 1, status: 1 });
listingSchema.index({ condition: 1, tcgType: 1 });
listingSchema.index({ createdAt: -1, status: 1 });
listingSchema.index({ views: -1, status: 1 });
listingSchema.index({ 'reservations.expiresAt': 1 }); // Para limpiar reservas expiradas

// Virtual para disponibilidad real
listingSchema.virtual('realAvailability').get(function() {
  return Math.max(0, this.availableQuantity - this.reservedQuantity);
});

// Virtual para porcentaje vendido
listingSchema.virtual('soldPercentage').get(function() {
  if (this.quantity === 0) return 0;
  return Math.round((this.totalSold / this.quantity) * 100);
});

// Middleware pre-save para validaciones y limpiezas
listingSchema.pre('save', function(next) {
  // Limpiar reservas expiradas
  const now = new Date();
  this.reservations = this.reservations.filter(reservation => reservation.expiresAt > now);
  
  // Recalcular reservedQuantity
  this.reservedQuantity = this.reservations.reduce((total, reservation) => total + reservation.quantity, 0);
  
  // Validar que availableQuantity + reservedQuantity no excedan quantity
  if (this.availableQuantity + this.reservedQuantity > this.quantity) {
    return next(new Error('La suma de cantidad disponible y reservada excede la cantidad total'));
  }
  
  // Actualizar status automáticamente
  if (this.availableQuantity === 0 && this.reservedQuantity === 0) {
    this.status = 'sold_out';
  } else if (this.status === 'sold_out' && this.availableQuantity > 0) {
    this.status = 'active';
  }
  
  // Generar tags automáticos para búsqueda
  const autoTags = [
    this.tcgType,
    this.condition,
    this.rarity.toLowerCase(),
    this.setName.toLowerCase(),
    ...this.cardName.toLowerCase().split(' ').filter(word => word.length > 2)
  ];
  
  this.tags = [...new Set([...this.tags, ...autoTags])]; // Eliminar duplicados
  
  next();
});

// Método para reservar cantidad
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
  
  return this.save();
};

// Método para liberar reserva
listingSchema.methods.releaseReservation = function(transactionId) {
  this.reservations = this.reservations.filter(
    reservation => !reservation.transactionId.equals(transactionId)
  );
  return this.save();
};

// Método para confirmar venta y reducir stock
listingSchema.methods.confirmSale = function(quantity, transactionId) {
  // Liberar la reserva
  this.releaseReservation(transactionId);
  
  // Reducir stock disponible
  this.availableQuantity -= quantity;
  this.totalSold += quantity;
  this.lastSaleDate = new Date();
  
  return this.save();
};

// Método para incrementar vistas
listingSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Método estático para buscar listings activos
listingSchema.statics.findActive = function(filters = {}) {
  return this.find({
    ...filters,
    status: 'active',
    availableQuantity: { $gt: 0 }
  });
};

// Método estático para búsqueda con texto
listingSchema.statics.searchByText = function(searchText, filters = {}) {
  return this.find({
    ...filters,
    status: 'active',
    $text: { $search: searchText }
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

// Método para obtener información pública del listing
listingSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    cardId: this.cardId,
    cardName: this.cardName,
    cardImage: this.cardImage,
    tcgType: this.tcgType,
    setName: this.setName,
    rarity: this.rarity,
    price: this.price,
    condition: this.condition,
    quantity: this.quantity,
    availableQuantity: this.availableQuantity,
    realAvailability: this.realAvailability,
    description: this.description,
    sellerName: this.sellerName,
    sellerLocation: this.sellerLocation,
    shippingIncluded: this.shippingIncluded,
    status: this.status,
    views: this.views,
    favorites: this.favorites,
    additionalImages: this.additionalImages,
    totalSold: this.totalSold,
    soldPercentage: this.soldPercentage,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Listing', listingSchema);