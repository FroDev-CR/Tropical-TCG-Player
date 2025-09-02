// src/routes/binders.js
const express = require('express');
const router = express.Router();
const {
  getBinders,
  getBinderById,
  createBinder,
  updateBinder,
  deleteBinder,
  addCardToBinder,
  updateCardInBinder,
  removeCardFromBinder
} = require('../controllers/binderController');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

// @desc    Obtener todos los binders del usuario
// @route   GET /api/v1/binders
// @access  Private
router.get('/', getBinders);

// @desc    Crear nuevo binder
// @route   POST /api/v1/binders
// @access  Private
router.post('/', createBinder);

// @desc    Obtener binder por ID
// @route   GET /api/v1/binders/:id
// @access  Private (solo owner)
router.get('/:id', getBinderById);

// @desc    Actualizar binder
// @route   PUT /api/v1/binders/:id
// @access  Private (solo owner)
router.put('/:id', updateBinder);

// @desc    Eliminar binder
// @route   DELETE /api/v1/binders/:id
// @access  Private (solo owner)
router.delete('/:id', deleteBinder);

// @desc    Añadir carta a binder
// @route   POST /api/v1/binders/:id/cards
// @access  Private (solo owner)
router.post('/:id/cards', addCardToBinder);

// @desc    Actualizar carta en binder
// @route   PUT /api/v1/binders/:binderId/cards/:cardId
// @access  Private (solo owner)
router.put('/:binderId/cards/:cardId', updateCardInBinder);

// @desc    Remover carta de binder
// @route   DELETE /api/v1/binders/:binderId/cards/:cardId
// @access  Private (solo owner)
router.delete('/:binderId/cards/:cardId', removeCardFromBinder);

module.exports = router;