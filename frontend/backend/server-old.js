// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Importar modelos
const User = require('./src/models/User');
const Listing = require('./src/models/Listing');
const Binder = require('./src/models/Binder');
const Transaction = require('./src/models/Transaction');

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000 // máximo 1000 requests por IP por ventana (más generoso)
});
app.use('/api/', limiter);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('🚀 Servidor backend iniciando con base de datos completa...');

// Configurar MongoDB (en memoria para desarrollo)
if (process.env.USE_MEMORY_DB === 'true') {
  // Usar MongoDB en memoria para desarrollo rápido
  const { MongoMemoryServer } = require('mongodb-memory-server');
  
  let mongod;
  
  const startDatabase = async () => {
    try {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log('📦 Usando MongoDB en memoria:', uri);
      
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      console.log('✅ Conectado a MongoDB en memoria');
      
      // Seed inicial de datos
      await seedInitialData();
      
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
    }
  };
  
  startDatabase();
} else {
  // Usar MongoDB Atlas para producción
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const db = mongoose.connection;
  db.on('error', (error) => console.error('❌ Error conexión MongoDB:', error));
  db.once('open', () => console.log('✅ Conectado a MongoDB Atlas'));
}

// Función para seed inicial de datos
const seedInitialData = async () => {
  try {
    console.log('🌱 Seeding datos iniciales...');
    
    // Crear usuario administrador
    const adminExists = await User.findOne({ email: 'admin@tropicaltcg.com' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@tropicaltcg.com',
        password: 'admin123',
        fullName: 'Administrador',
        role: 'admin',
        verification: {
          email: { verified: true, verifiedAt: new Date() },
          phone: { verified: true, verifiedAt: new Date() }
        }
      });
      await admin.save();
      console.log('👤 Usuario admin creado');
    }
    
    // Crear usuario de prueba
    const testUserExists = await User.findOne({ email: 'test@test.com' });
    let testUser = testUserExists;
    if (!testUserExists) {
      testUser = new User({
        username: 'testuser',
        email: 'test@test.com',
        password: 'test123',
        fullName: 'Usuario de Prueba',
        phone: '8888-8888',
        province: 'San José'
      });
      await testUser.save();
      console.log('👤 Usuario test creado');
    }
    
    // Crear listings de prueba
    const listingsCount = await Listing.countDocuments();
    if (listingsCount === 0) {
      const sampleListings = [
        {
          cardId: 'xy1-1',
          cardName: 'Charizard EX',
          cardImage: 'https://images.pokemontcg.io/xy1/1.png',
          tcgType: 'pokemon',
          setName: 'XY Base Set',
          rarity: 'Ultra Rare',
          price: 25000,
          condition: 'near_mint',
          quantity: 2,
          availableQuantity: 2,
          sellerId: testUser._id,
          description: 'Carta en excelente estado, directo del pack'
        },
        {
          cardId: 'op01-001',
          cardName: 'Monkey D. Luffy',
          cardImage: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
          tcgType: 'onepiece',
          setName: 'Romance Dawn',
          rarity: 'Leader',
          price: 15000,
          condition: 'mint',
          quantity: 1,
          availableQuantity: 1,
          sellerId: testUser._id,
          description: 'Leader card en condición mint'
        }
      ];
      
      await Listing.insertMany(sampleListings);
      console.log('🃏 Listings de muestra creados');
    }
    
    // Crear binder de prueba
    const bindersCount = await Binder.countDocuments();
    if (bindersCount === 0) {
      const sampleBinder = new Binder({
        name: 'Mi Colección Pokémon',
        description: 'Mis cartas favoritas de Pokémon',
        userId: testUser._id,
        cards: [{
          cardId: 'xy1-1',
          cardName: 'Charizard EX',
          cardImage: 'https://images.pokemontcg.io/xy1/1.png',
          tcgType: 'pokemon',
          setName: 'XY Base Set',
          rarity: 'Ultra Rare',
          condition: 'near_mint',
          quantity: 1,
          estimatedValue: 25000,
          notes: 'Mi carta más preciada'
        }]
      });
      await sampleBinder.save();
      console.log('📚 Binder de muestra creado');
    }
    
    console.log('✅ Seed completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
  }
};

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server running with complete database',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ======== ENDPOINTS DE AUTENTICACIÓN ========

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { username, email, password, fullName, phone, cedula, province } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Usuario o email ya existe'
      });
    }
    
    // Crear nuevo usuario
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullName,
      phone,
      cedula,
      province
    });
    
    await user.save();
    
    // Generar tokens
    const accessToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );
    
    res.status(201).json({
      success: true,
      user: user.toPublicJSON(),
      tokens: { accessToken, refreshToken }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // Actualizar última actividad
    user.stats.lastActivity = new Date();
    await user.save();
    
    // Generar tokens
    const accessToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );
    
    res.json({
      success: true,
      user: user.toPublicJSON(),
      tokens: { accessToken, refreshToken }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/v1/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user.toPublicJSON()
  });
});

// ======== ENDPOINTS DE LISTINGS ========

app.get('/api/v1/listings', async (req, res) => {
  try {
    const { 
      search, 
      tcgType, 
      condition, 
      minPrice, 
      maxPrice, 
      sortBy = 'publishedAt', 
      page = 1, 
      limit = 48 
    } = req.query;
    
    // Construir query
    let query = { status: 'active', availableQuantity: { $gt: 0 } };
    
    if (search) {
      query.$or = [
        { cardName: { $regex: search, $options: 'i' } },
        { setName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tcgType) query.tcgType = tcgType;
    if (condition) query.condition = condition;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Opciones de ordenamiento
    const sortOptions = {};
    switch (sortBy) {
      case 'price-low': sortOptions.price = 1; break;
      case 'price-high': sortOptions.price = -1; break;
      case 'name': sortOptions.cardName = 1; break;
      case 'newest': 
      default: sortOptions.publishedAt = -1; break;
    }
    
    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Ejecutar query
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('sellerId', 'username rating verification')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      listings,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo listings:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/v1/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'username rating verification phone')
      .lean();
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing no encontrado'
      });
    }
    
    // Incrementar views
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    res.json({
      success: true,
      listing
    });
    
  } catch (error) {
    console.error('Error obteniendo listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ======== ENDPOINTS DE USUARIOS ========

app.get('/api/v1/users/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user.toPublicJSON()
  });
});

app.put('/api/v1/users/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['fullName', 'phone', 'province', 'settings'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { new: true }
    );
    
    res.json({
      success: true,
      user: user.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ======== ENDPOINTS DE BINDERS ========

app.get('/api/v1/binders', authenticateToken, async (req, res) => {
  try {
    const binders = await Binder.find({ 
      userId: req.user._id, 
      status: 'active' 
    }).sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      binders
    });
    
  } catch (error) {
    console.error('Error obteniendo binders:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.post('/api/v1/binders', authenticateToken, async (req, res) => {
  try {
    const binder = new Binder({
      ...req.body,
      userId: req.user._id
    });
    
    await binder.save();
    
    res.status(201).json({
      success: true,
      binder
    });
    
  } catch (error) {
    console.error('Error creando binder:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/v1/binders/:id', authenticateToken, async (req, res) => {
  try {
    const binder = await Binder.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!binder) {
      return res.status(404).json({
        success: false,
        message: 'Binder no encontrado'
      });
    }
    
    res.json({
      success: true,
      binder
    });
    
  } catch (error) {
    console.error('Error obteniendo binder:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.put('/api/v1/binders/:id', authenticateToken, async (req, res) => {
  try {
    const binder = await Binder.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
        status: 'active'
      },
      req.body,
      { new: true }
    );
    
    if (!binder) {
      return res.status(404).json({
        success: false,
        message: 'Binder no encontrado'
      });
    }
    
    res.json({
      success: true,
      binder
    });
    
  } catch (error) {
    console.error('Error actualizando binder:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.post('/api/v1/binders/:id/cards', authenticateToken, async (req, res) => {
  try {
    const binder = await Binder.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!binder) {
      return res.status(404).json({
        success: false,
        message: 'Binder no encontrado'
      });
    }
    
    await binder.addCard(req.body);
    
    res.json({
      success: true,
      binder
    });
    
  } catch (error) {
    console.error('Error agregando carta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ======== ENDPOINTS DE LISTINGS PARA VENDEDORES ========

app.post('/api/v1/listings', authenticateToken, async (req, res) => {
  try {
    const listing = new Listing({
      ...req.body,
      sellerId: req.user._id
    });
    
    await listing.save();
    
    res.status(201).json({
      success: true,
      listing
    });
    
  } catch (error) {
    console.error('Error creando listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/v1/users/listings', authenticateToken, async (req, res) => {
  try {
    const listings = await Listing.find({
      sellerId: req.user._id
    }).sort({ publishedAt: -1 });
    
    res.json({
      success: true,
      listings
    });
    
  } catch (error) {
    console.error('Error obteniendo listings del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.put('/api/v1/listings/:id', authenticateToken, async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      {
        _id: req.params.id,
        sellerId: req.user._id
      },
      req.body,
      { new: true }
    );
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing no encontrado'
      });
    }
    
    res.json({
      success: true,
      listing
    });
    
  } catch (error) {
    console.error('Error actualizando listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ======== ENDPOINTS DE TRANSACCIONES ========

app.post('/api/v1/transactions', authenticateToken, async (req, res) => {
  try {
    const { items, destinationStore, paymentMethod } = req.body;
    
    // Calcular totales
    let subtotal = 0;
    let shippingCost = 0;
    
    for (const item of items) {
      subtotal += item.price * item.quantity;
      if (!item.shippingIncluded) {
        shippingCost = 600; // Solo una vez por vendedor
      }
    }
    
    const total = subtotal + shippingCost;
    
    // Crear transacción
    const transaction = new Transaction({
      buyer: {
        userId: req.user._id,
        username: req.user.username,
        phone: req.user.phone,
        email: req.user.email
      },
      seller: {
        userId: items[0].sellerId, // Todos los items son del mismo vendedor
        username: items[0].sellerName,
        phone: items[0].sellerPhone,
        email: items[0].sellerEmail
      },
      items: items.map(item => ({
        listingId: item.listingId,
        cardId: item.cardId,
        cardName: item.cardName,
        cardImage: item.cardImage,
        condition: item.condition,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      amounts: {
        subtotal,
        shipping: shippingCost,
        taxes: 0,
        total
      },
      delivery: {
        method: 'store_network',
        destinationStore
      },
      payment: {
        method: paymentMethod || 'sinpe'
      }
    });
    
    // Establecer deadlines
    const now = new Date();
    transaction.timeline.sellerDeadline = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // +24h
    
    await transaction.save();
    
    res.status(201).json({
      success: true,
      transaction
    });
    
  } catch (error) {
    console.error('Error creando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/v1/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { 'buyer.userId': req.user._id },
        { 'seller.userId': req.user._id }
      ]
    }).sort({ 'timeline.created': -1 });
    
    res.json({
      success: true,
      transactions
    });
    
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.put('/api/v1/transactions/:id/accept', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    if (transaction.seller.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }
    
    await transaction.accept(req.body.originStore);
    
    res.json({
      success: true,
      transaction
    });
    
  } catch (error) {
    console.error('Error aceptando transacción:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// ======== ENDPOINTS DE ESTADÍSTICAS ========

app.get('/api/v1/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    // Estadísticas del usuario
    const userListings = await Listing.countDocuments({ sellerId: req.user._id });
    const userBinders = await Binder.countDocuments({ userId: req.user._id, status: 'active' });
    const userTransactions = await Transaction.countDocuments({
      $or: [
        { 'buyer.userId': req.user._id },
        { 'seller.userId': req.user._id }
      ]
    });
    
    // Transacciones activas
    const activeTransactions = await Transaction.find({
      $or: [
        { 'buyer.userId': req.user._id },
        { 'seller.userId': req.user._id }
      ],
      status: { $nin: ['completed', 'cancelled_by_seller', 'cancelled_by_buyer'] }
    }).sort({ 'timeline.created': -1 }).limit(5);
    
    // Listings recientes
    const recentListings = await Listing.find({ sellerId: req.user._id })
      .sort({ publishedAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      stats: {
        totalListings: userListings,
        totalBinders: userBinders,
        totalTransactions: userTransactions,
        rating: req.user.rating.average,
        completedSales: req.user.stats.completedSales,
        completedPurchases: req.user.stats.completedPurchases
      },
      recentActivity: {
        activeTransactions,
        recentListings
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor backend MOCK ejecutándose en puerto ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🛍️ Listings: http://localhost:${PORT}/api/v1/listings`);
});