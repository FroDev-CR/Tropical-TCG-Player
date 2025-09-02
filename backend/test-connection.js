// test-connection.js
// Script simple para probar la conexión frontend-backend

const express = require('express');
const cors = require('cors');
const app = express();

// CORS para el frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({
    message: '✅ Conexión frontend-backend funcionando!',
    timestamp: new Date().toISOString(),
    server: 'tropical-tcg-backend',
    status: 'connected'
  });
});

// Endpoint para probar CORS
app.post('/api/test-cors', (req, res) => {
  res.json({
    message: '✅ CORS funcionando correctamente!',
    receivedData: req.body,
    headers: req.headers.origin
  });
});

const PORT = 5001; // Puerto diferente para no interferir

app.listen(PORT, () => {
  console.log('🧪 Test server corriendo en http://localhost:5001');
  console.log('📝 Endpoints de prueba:');
  console.log('   GET  http://localhost:5001/api/test');
  console.log('   POST http://localhost:5001/api/test-cors');
  console.log('');
  console.log('💡 Puedes probar desde tu React app:');
  console.log('   fetch("http://localhost:5001/api/test")');
  console.log('     .then(res => res.json())');
  console.log('     .then(console.log)');
});