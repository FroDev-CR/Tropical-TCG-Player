// src/routes/stats.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPlatformStats,
  getTransactionStats
} = require('../controllers/statsController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// @desc    Obtener estadísticas del dashboard del usuario
// @route   GET /api/v1/stats/dashboard
// @access  Private
router.get('/dashboard', authenticate, getDashboardStats);

// @desc    Obtener estadísticas de transacciones por período
// @route   GET /api/v1/stats/transactions
// @access  Private
router.get('/transactions', authenticate, getTransactionStats);

// @desc    Obtener estadísticas generales de la plataforma
// @route   GET /api/v1/stats/platform
// @access  Public
router.get('/platform', getPlatformStats);

module.exports = router;