// src/models/Binder.js
const mongoose = require('mongoose');

const binderSchema = new mongoose.Schema({
  // Información básica
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Propietario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Configuración visual
  coverImage: {
    url: String,
    publicId: String
  },
  theme: {
    color: { type: String, default: '#2196F3' },
    pattern: { type: String, default: 'classic' }
  },
  
  // Cartas en el binder
  cards: [{
    // Información de la carta
    cardId: { type: String, required: true },
    cardName: { type: String, required: true },
    cardImage: String,
    tcgType: {
      type: String,
      required: true,
      enum: ['pokemon', 'onepiece', 'dragonball', 'digimon', 'magic', 'unionarena', 'gundam']
    },
    setName: String,
    rarity: String,
    
    // Información de la carta en el binder
    condition: {
      type: String,
      enum: ['mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor']
    },
    quantity: { type: Number, default: 1, min: 1 },
    
    // Organización
    page: { type: Number, default: 1 },
    position: { type: Number, default: 1 },
    
    // Metadatos
    obtainedFrom: String, // 'pack', 'trade', 'purchase', 'gift'
    obtainedDate: { type: Date, default: Date.now },
    estimatedValue: Number,
    notes: { type: String, maxlength: 200 },
    
    // Estado
    isForTrade: { type: Boolean, default: false },
    isForSale: { type: Boolean, default: false },
    
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Configuraciones del binder
  settings: {
    isPublic: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    cardsPerPage: { type: Number, default: 9, min: 4, max: 16 },
    sortBy: {
      type: String,
      enum: ['addedDate', 'name', 'rarity', 'tcgType', 'value'],
      default: 'addedDate'
    },
    sortOrder: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'desc'
    }
  },
  
  // Estadísticas
  stats: {
    totalCards: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    cardsByTCG: {
      pokemon: { type: Number, default: 0 },
      onepiece: { type: Number, default: 0 },
      dragonball: { type: Number, default: 0 },
      digimon: { type: Number, default: 0 },
      magic: { type: Number, default: 0 },
      unionarena: { type: Number, default: 0 },
      gundam: { type: Number, default: 0 }
    },
    cardsByRarity: {
      common: { type: Number, default: 0 },
      uncommon: { type: Number, default: 0 },
      rare: { type: Number, default: 0 },
      ultra_rare: { type: Number, default: 0 },
      secret_rare: { type: Number, default: 0 }
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Interacciones sociales
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  
  // Etiquetas
  tags: [{ type: String, maxlength: 20 }],
  
  // Estado
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Índices
binderSchema.index({ userId: 1, status: 1 });
binderSchema.index({ 'settings.isPublic': 1, status: 1 });
binderSchema.index({ name: 'text', description: 'text' });
binderSchema.index({ 'stats.totalValue': -1 });
binderSchema.index({ views: -1 });
binderSchema.index({ likes: -1 });

// Métodos del schema
binderSchema.methods.addCard = function(cardData) {
  // Verificar si la carta ya existe
  const existingCardIndex = this.cards.findIndex(card => 
    card.cardId === cardData.cardId && 
    card.condition === cardData.condition
  );
  
  if (existingCardIndex >= 0) {
    // Si existe, incrementar cantidad
    this.cards[existingCardIndex].quantity += cardData.quantity || 1;
  } else {
    // Si no existe, agregar nueva carta
    this.cards.push(cardData);
  }
  
  this.updateStats();
  return this.save();
};

binderSchema.methods.removeCard = function(cardId, condition) {
  this.cards = this.cards.filter(card => 
    !(card.cardId === cardId && card.condition === condition)
  );
  
  this.updateStats();
  return this.save();
};

binderSchema.methods.updateStats = function() {
  this.stats.totalCards = this.cards.reduce((sum, card) => sum + card.quantity, 0);
  this.stats.totalValue = this.cards.reduce((sum, card) => 
    sum + ((card.estimatedValue || 0) * card.quantity), 0
  );
  
  // Resetear contadores
  Object.keys(this.stats.cardsByTCG).forEach(tcg => {
    this.stats.cardsByTCG[tcg] = 0;
  });
  
  Object.keys(this.stats.cardsByRarity).forEach(rarity => {
    this.stats.cardsByRarity[rarity] = 0;
  });
  
  // Recalcular contadores
  this.cards.forEach(card => {
    if (this.stats.cardsByTCG[card.tcgType] !== undefined) {
      this.stats.cardsByTCG[card.tcgType] += card.quantity;
    }
    
    const rarityKey = card.rarity ? card.rarity.toLowerCase().replace(' ', '_') : 'common';
    if (this.stats.cardsByRarity[rarityKey] !== undefined) {
      this.stats.cardsByRarity[rarityKey] += card.quantity;
    }
  });
  
  this.stats.lastUpdated = new Date();
};

binderSchema.methods.addView = function() {
  this.views += 1;
  return this.save();
};

binderSchema.methods.toggleLike = function() {
  // Esta lógica se puede expandir para tracking de usuarios específicos
  this.likes += 1;
  return this.save();
};

// Pre-save middleware
binderSchema.pre('save', function(next) {
  if (this.isModified('cards')) {
    this.updateStats();
  }
  next();
});

module.exports = mongoose.model('Binder', binderSchema);