// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyToken, 
  logout, 
  refreshToken 
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// @desc    Registrar nuevo usuario
// @route   POST /api/v1/auth/register
// @access  Public
router.post('/register', register);

// @desc    Login de usuario
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', login);

// @desc    Verificar token
// @route   GET /api/v1/auth/verify
// @access  Private
router.get('/verify', authenticate, verifyToken);

// @desc    Logout
// @route   POST /api/v1/auth/logout
// @access  Private
router.post('/logout', authenticate, logout);

// @desc    Refrescar access token
// @route   POST /api/v1/auth/refresh
// @access  Public
router.post('/refresh', refreshToken);

module.exports = router;