// src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Identificación única
  transactionNumber: {
    type: String,
    unique: true
  },
  
  // Participantes
  buyer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: String,
    phone: String,
    email: String
  },
  seller: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: String,
    phone: String,
    email: String
  },
  
  // Items de la transacción
  items: [{
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    cardId: String,
    cardName: String,
    cardImage: String,
    condition: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  
  // Montos
  amounts: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  
  // Estado de la transacción
  status: {
    type: String,
    enum: [
      'pending_seller_response',     // Esperando respuesta del vendedor (24h)
      'accepted_pending_delivery',   // Aceptada, pendiente de entrega (6 días)
      'delivered_pending_payment',   // Entregada, pendiente de pago
      'payment_confirmed',           // Pago confirmado, pendiente recibo comprador (10 días)
      'completed',                   // Transacción completada con ratings
      'completed_no_rating',         // Completada sin calificación mutua
      'cancelled_by_seller',         // Cancelada por vendedor
      'cancelled_by_buyer',          // Cancelada por comprador
      'cancelled_timeout_seller',    // Cancelada por timeout vendedor (24h)
      'cancelled_timeout_delivery',  // Cancelada por timeout entrega (6 días)
      'cancelled_by_admin',          // Cancelada por administrador
      'disputed',                    // En disputa - bajo investigación
      'resolved_favour_buyer',       // Disputa resuelta a favor del comprador
      'resolved_favour_seller'       // Disputa resuelta a favor del vendedor
    ],
    default: 'pending_seller_response'
  },
  
  // Timeline de la transacción
  timeline: {
    created: { type: Date, default: Date.now },
    sellerDeadline: Date,           // +24h desde created
    sellerResponded: Date,
    deliveryDeadline: Date,         // +6 días desde accepted
    delivered: Date,
    paymentRequested: Date,
    paymentConfirmed: Date,
    buyerDeadline: Date,            // +10 días desde delivered
    buyerConfirmed: Date,
    ratingDeadline: Date,           // +7 días desde confirmed
    completed: Date,
    cancelled: Date
  },
  
  // Información de entrega
  delivery: {
    method: {
      type: String,
      enum: ['pickup', 'store_network', 'courier', 'mail'],
      default: 'store_network'
    },
    originStore: {
      name: String,
      address: String,
      phone: String
    },
    destinationStore: {
      name: String,
      address: String,
      phone: String
    },
    proof: {
      imageUrl: String,
      publicId: String,
      uploadedAt: Date,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    instructions: String
  },
  
  // Información de pago
  payment: {
    method: {
      type: String,
      enum: ['sinpe', 'cash', 'trade', 'bank_transfer', 'other'],
      required: true
    },
    details: String,
    proof: {
      imageUrl: String,
      publicId: String,
      uploadedAt: Date,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    buyerConfirmed: { type: Boolean, default: false }
  },
  
  // Sistema de calificaciones mutuas
  ratings: {
    buyerToSeller: {
      stars: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      aspects: {
        communication: { type: Number, min: 1, max: 5 },
        productQuality: { type: Number, min: 1, max: 5 },
        delivery: { type: Number, min: 1, max: 5 }
      },
      createdAt: Date
    },
    sellerToBuyer: {
      stars: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      aspects: {
        communication: { type: Number, min: 1, max: 5 },
        payment: { type: Number, min: 1, max: 5 },
        overall: { type: Number, min: 1, max: 5 }
      },
      createdAt: Date
    }
  },
  
  // Información de cancelación/disputa
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['buyer', 'seller', 'system', 'admin']
    },
    timestamp: Date,
    refundIssued: { type: Boolean, default: false }
  },
  
  // Sistema de disputas
  dispute: {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedAgainst: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    description: String,
    evidence: [{
      type: { type: String, enum: ['image', 'document', 'text'] },
      url: String,
      publicId: String,
      description: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    adminNotes: String,
    resolution: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  
  // Notas y comunicación
  notes: {
    buyerNotes: { type: String, maxlength: 500 },
    sellerNotes: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 1000 }
  },
  
  // Metadatos
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: { type: String, default: 'web' },
    version: { type: String, default: '1.0' }
  }
}, {
  timestamps: true
});

// Índices
transactionSchema.index({ 'buyer.userId': 1, status: 1 });
transactionSchema.index({ 'seller.userId': 1, status: 1 });
transactionSchema.index({ status: 1, 'timeline.created': -1 });
transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ 'timeline.sellerDeadline': 1, status: 1 });
transactionSchema.index({ 'timeline.deliveryDeadline': 1, status: 1 });
transactionSchema.index({ 'timeline.buyerDeadline': 1, status: 1 });

// Generar número de transacción único
transactionSchema.pre('save', function(next) {
  if (!this.transactionNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.transactionNumber = `TT${timestamp}${random}`;
  }
  next();
});

// Métodos del schema
transactionSchema.methods.accept = function(originStore) {
  if (this.status !== 'pending_seller_response') {
    throw new Error('Transaction cannot be accepted in current state');
  }
  
  const now = new Date();
  this.status = 'accepted_pending_delivery';
  this.timeline.sellerResponded = now;
  this.timeline.deliveryDeadline = new Date(now.getTime() + (6 * 24 * 60 * 60 * 1000)); // +6 días
  
  if (originStore) {
    this.delivery.originStore = originStore;
  }
  
  return this.save();
};

transactionSchema.methods.reject = function(reason) {
  if (this.status !== 'pending_seller_response') {
    throw new Error('Transaction cannot be rejected in current state');
  }
  
  this.status = 'cancelled_by_seller';
  this.timeline.cancelled = new Date();
  this.cancellation = {
    reason: reason || 'Rejected by seller',
    cancelledBy: 'seller',
    timestamp: new Date()
  };
  
  return this.save();
};

transactionSchema.methods.confirmDelivery = function(proofData) {
  if (this.status !== 'accepted_pending_delivery') {
    throw new Error('Cannot confirm delivery in current state');
  }
  
  const now = new Date();
  this.status = 'delivered_pending_payment';
  this.timeline.delivered = now;
  this.timeline.buyerDeadline = new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000)); // +10 días
  
  if (proofData) {
    this.delivery.proof = {
      ...proofData,
      uploadedAt: now
    };
  }
  
  return this.save();
};

transactionSchema.methods.confirmPayment = function(proofData) {
  if (this.status !== 'delivered_pending_payment') {
    throw new Error('Cannot confirm payment in current state');
  }
  
  this.status = 'payment_confirmed';
  this.timeline.paymentConfirmed = new Date();
  
  if (proofData) {
    this.payment.proof = {
      ...proofData,
      uploadedAt: new Date()
    };
  }
  
  return this.save();
};

transactionSchema.methods.complete = function() {
  if (!['payment_confirmed', 'completed_no_rating'].includes(this.status)) {
    throw new Error('Cannot complete transaction in current state');
  }
  
  this.status = 'completed';
  this.timeline.completed = new Date();
  
  return this.save();
};

transactionSchema.methods.addRating = function(userRole, ratingData) {
  const ratingKey = userRole === 'buyer' ? 'buyerToSeller' : 'sellerToBuyer';
  
  this.ratings[ratingKey] = {
    ...ratingData,
    createdAt: new Date()
  };
  
  // Si ambos han calificado, completar la transacción
  if (this.ratings.buyerToSeller && this.ratings.sellerToBuyer) {
    this.status = 'completed';
    this.timeline.completed = new Date();
  }
  
  return this.save();
};

transactionSchema.methods.reportDispute = function(reportedBy, disputeData) {
  this.status = 'disputed';
  this.dispute = {
    reportedBy: reportedBy,
    reportedAgainst: reportedBy.toString() === this.buyer.userId.toString() ? 
      this.seller.userId : this.buyer.userId,
    ...disputeData,
    timestamp: new Date()
  };
  
  return this.save();
};

// Método para verificar timeouts
transactionSchema.methods.checkTimeouts = function() {
  const now = new Date();
  let hasChanges = false;
  
  // Timeout del vendedor (24h)
  if (this.status === 'pending_seller_response' && 
      this.timeline.sellerDeadline && 
      now > this.timeline.sellerDeadline) {
    this.status = 'cancelled_timeout_seller';
    this.timeline.cancelled = now;
    this.cancellation = {
      reason: 'Seller did not respond within 24 hours',
      cancelledBy: 'system',
      timestamp: now
    };
    hasChanges = true;
  }
  
  // Timeout de entrega (6 días)
  if (this.status === 'accepted_pending_delivery' && 
      this.timeline.deliveryDeadline && 
      now > this.timeline.deliveryDeadline) {
    this.status = 'cancelled_timeout_delivery';
    this.timeline.cancelled = now;
    this.cancellation = {
      reason: 'Delivery not confirmed within 6 days',
      cancelledBy: 'system',
      timestamp: now
    };
    hasChanges = true;
  }
  
  if (hasChanges) {
    return this.save();
  }
  
  return Promise.resolve(this);
};

module.exports = mongoose.model('Transaction', transactionSchema);