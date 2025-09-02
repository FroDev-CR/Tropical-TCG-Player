// src/routes/listings.js
// Rutas de listados de cartas completas

const express = require('express');
const listingController = require('../controllers/listingController');
const { authRequired, authOptional } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas (con autenticación opcional para vistas)
router.get('/', authOptional, listingController.getListings);
router.get('/stats', listingController.getTCGStats);
router.get('/:listingId', authOptional, listingController.getListingById);

// Rutas protegidas (requieren autenticación)
router.post('/', authRequired, listingController.createListing);
router.get('/my/listings', authRequired, listingController.getMyListings);
router.put('/:listingId', authRequired, listingController.updateListing);
router.delete('/:listingId', authRequired, listingController.deleteListing);

module.exports = router;