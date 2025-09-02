// src/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

// @desc    Obtener transacciones del usuario
// @route   GET /api/v1/transactions
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    
    // Construir query base
    let query = {
      $or: [
        { 'buyer.userId': req.user._id },
        { 'seller.userId': req.user._id }
      ]
    };
    
    // Filtrar por estado si se especifica
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filtrar por rol si se especifica
    if (role === 'buyer') {
      query = { 'buyer.userId': req.user._id };
    } else if (role === 'seller') {
      query = { 'seller.userId': req.user._id };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ 'timeline.created': -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Obtener transacción por ID
// @route   GET /api/v1/transactions/:id
// @access  Private (solo participantes)
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      $or: [
        { 'buyer.userId': req.user._id },
        { 'seller.userId': req.user._id }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Crear nueva transacción
// @route   POST /api/v1/transactions
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { items, destinationStore, paymentMethod } = req.body;
    
    // Validar datos requeridos
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items son requeridos'
      });
    }
    
    // Calcular totales
    let subtotal = 0;
    let shippingCost = 0;
    
    for (const item of items) {
      subtotal += item.price * item.quantity;
      if (!item.shippingIncluded) {
        shippingCost = 600; // Solo una vez por vendedor
      }
    }
    
    const total = subtotal + shippingCost;
    
    // Crear transacción
    const transaction = new Transaction({
      buyer: {
        userId: req.user._id,
        username: req.user.username,
        phone: req.user.phone,
        email: req.user.email
      },
      seller: {
        userId: items[0].sellerId, // Todos los items son del mismo vendedor
        username: items[0].sellerName,
        phone: items[0].sellerPhone,
        email: items[0].sellerEmail
      },
      items: items.map(item => ({
        listingId: item.listingId,
        cardId: item.cardId,
        cardName: item.cardName,
        cardImage: item.cardImage,
        condition: item.condition,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      amounts: {
        subtotal,
        shipping: shippingCost,
        taxes: 0,
        total
      },
      delivery: {
        method: 'store_network',
        destinationStore
      },
      payment: {
        method: paymentMethod || 'sinpe'
      }
    });
    
    // Establecer deadlines
    const now = new Date();
    transaction.timeline.sellerDeadline = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // +24h
    
    await transaction.save();
    
    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: transaction
    });
    
  } catch (error) {
    console.error('❌ Error creando transacción:', error);
    res.status(400).json({
      success: false,
      message: 'Error creando transacción',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Aceptar transacción (vendedor)
// @route   PUT /api/v1/transactions/:id/accept
// @access  Private (solo seller)
router.put('/:id/accept', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    if (transaction.seller.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el vendedor puede aceptar la transacción'
      });
    }
    
    if (transaction.status !== 'pending_seller_response') {
      return res.status(400).json({
        success: false,
        message: 'Transacción no puede ser aceptada en su estado actual'
      });
    }
    
    // Aceptar transacción (usar método del modelo si existe)
    if (typeof transaction.accept === 'function') {
      await transaction.accept(req.body.originStore);
    } else {
      // Implementación básica
      transaction.status = 'accepted_pending_delivery';
      transaction.timeline.sellerResponded = new Date();
      transaction.delivery.originStore = req.body.originStore;
      
      // Establecer deadline de entrega (+6 días)
      transaction.timeline.deliveryDeadline = new Date(Date.now() + (6 * 24 * 60 * 60 * 1000));
      
      await transaction.save();
    }
    
    res.json({
      success: true,
      message: 'Transacción aceptada exitosamente',
      data: transaction
    });
    
  } catch (error) {
    console.error('❌ Error aceptando transacción:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// @desc    Cancelar transacción
// @route   PUT /api/v1/transactions/:id/cancel
// @access  Private (buyer o seller)
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    // Verificar permisos
    const isBuyer = transaction.buyer.userId.toString() === req.user._id.toString();
    const isSeller = transaction.seller.userId.toString() === req.user._id.toString();
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cancelar esta transacción'
      });
    }
    
    // Verificar si se puede cancelar
    const cancellableStatuses = [
      'pending_seller_response',
      'accepted_pending_delivery'
    ];
    
    if (!cancellableStatuses.includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        message: 'Transacción no puede ser cancelada en su estado actual'
      });
    }
    
    // Cancelar transacción
    transaction.status = isBuyer ? 'cancelled_by_buyer' : 'cancelled_by_seller';
    transaction.cancellationInfo = {
      cancelledBy: isBuyer ? 'buyer' : 'seller',
      reason: reason || 'Sin razón especificada',
      timestamp: new Date()
    };
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Transacción cancelada exitosamente',
      data: transaction
    });
    
  } catch (error) {
    console.error('❌ Error cancelando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;