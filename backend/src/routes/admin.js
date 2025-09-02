// src/routes/admin.js
// Rutas de administración (temporal)

const express = require('express');
const router = express.Router();

// Dashboard admin
router.get('/dashboard', (req, res) => {
  res.json({
    message: 'Endpoint de administración - próximamente implementado',
    status: 'coming_soon'
  });
});

module.exports = router;