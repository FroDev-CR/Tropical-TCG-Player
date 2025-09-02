// src/routes/users.js
// Rutas de usuarios completas

const express = require('express');
const userController = require('../controllers/userController');
const { authRequired } = require('../middleware/auth');
const uploadService = require('../middleware/upload');

const router = express.Router();

// NOTA: Todas las rutas ya tienen authRequired del app.js

// Rutas del perfil propio
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/settings', userController.updateSettings);
router.get('/stats', userController.getUserStats);
router.delete('/account', userController.deleteAccount);

// Rutas de imágenes de perfil
router.post('/profile/picture', 
  uploadService.profilePicture.single('profilePicture'),
  uploadService.handleUploadError,
  userController.updateProfilePicture
);
router.delete('/profile/picture', userController.deleteProfilePicture);

// Rutas públicas de otros usuarios
router.get('/search', userController.searchUsers);
router.get('/:userId', userController.getPublicProfile);
router.post('/:userId/recommend', userController.toggleRecommendation);

module.exports = router;