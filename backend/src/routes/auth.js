// src/routes/auth.js
// Rutas de autenticación completas

const express = require('express');
const authController = require('../controllers/authController');
const { authRequired, authOptional } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Rutas protegidas
router.post('/logout', authRequired, authController.logout);
router.post('/logout-all', authRequired, authController.logoutAll);
router.get('/verify-token', authRequired, authController.verifyToken);
router.post('/change-password', authRequired, authController.changePassword);

module.exports = router;