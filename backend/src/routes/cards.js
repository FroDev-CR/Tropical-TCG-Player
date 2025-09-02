// src/routes/cards.js
// Rutas de búsqueda de cartas externas (temporal)

const express = require('express');
const router = express.Router();

// Buscar cartas
router.get('/search', (req, res) => {
  res.json({
    message: 'Endpoint de búsqueda de cartas - próximamente implementado',
    status: 'coming_soon'
  });
});

module.exports = router;