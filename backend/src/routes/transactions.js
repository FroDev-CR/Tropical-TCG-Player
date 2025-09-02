// src/routes/transactions.js
// Rutas de transacciones P2P (temporal)

const express = require('express');
const router = express.Router();

// Obtener transacciones del usuario
router.get('/', (req, res) => {
  res.json({
    message: 'Endpoint de transacciones - próximamente implementado',
    status: 'coming_soon'
  });
});

module.exports = router;