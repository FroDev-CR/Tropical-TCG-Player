// src/routes/users.js
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserListings,
  getPublicProfile,
  changePassword,
  deactivateAccount
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/v1/users/profile
// @access  Private
router.get('/profile', authenticate, getProfile);

// @desc    Actualizar perfil del usuario
// @route   PUT /api/v1/users/profile
// @access  Private
router.put('/profile', authenticate, updateProfile);

// @desc    Obtener listings del usuario autenticado
// @route   GET /api/v1/users/listings
// @access  Private
router.get('/listings', authenticate, getUserListings);

// @desc    Cambiar contraseña
// @route   PUT /api/v1/users/change-password
// @access  Private
router.put('/change-password', authenticate, changePassword);

// @desc    Desactivar cuenta
// @route   DELETE /api/v1/users/deactivate
// @access  Private
router.delete('/deactivate', authenticate, deactivateAccount);

// @desc    Obtener perfil público de usuario
// @route   GET /api/v1/users/:id/public
// @access  Public
router.get('/:id/public', getPublicProfile);

module.exports = router;