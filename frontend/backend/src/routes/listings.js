// src/routes/listings.js
const express = require('express');
const router = express.Router();
const {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
} = require('../controllers/listingController');
const { authenticate } = require('../middleware/auth');

// @desc    Obtener todas las listings con filtros
// @route   GET /api/v1/listings
// @access  Public
router.get('/', getListings);

// @desc    Obtener listing por ID
// @route   GET /api/v1/listings/:id
// @access  Public
router.get('/:id', getListingById);

// @desc    Crear nuevo listing
// @route   POST /api/v1/listings
// @access  Private
router.post('/', authenticate, createListing);

// @desc    Actualizar listing
// @route   PUT /api/v1/listings/:id
// @access  Private (solo owner)
router.put('/:id', authenticate, updateListing);

// @desc    Eliminar listing
// @route   DELETE /api/v1/listings/:id
// @access  Private (solo owner)
router.delete('/:id', authenticate, deleteListing);

module.exports = router;