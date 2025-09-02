// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generar tokens JWT
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'tropical-tcg-secret', 
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
  
  const refreshToken = jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET || 'tropical-tcg-refresh-secret', 
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  
  return { accessToken, refreshToken };
};

// @desc    Registrar nuevo usuario
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, cedula, province } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
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
    const tokens = generateTokens(user._id);
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: user.toPublicJSON(),
      tokens
    });
    
  } catch (error) {
    console.error('❌ Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login de usuario
// @route   POST /api/v1/auth/login  
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }
    
    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Email/usuario o contraseña incorrectos'
      });
    }
    
    // Verificar si el usuario está activo
    if (!user.status.active || user.status.suspended) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta suspendida o inactiva'
      });
    }
    
    // Actualizar última actividad
    user.stats.lastActivity = new Date();
    await user.save();
    
    // Generar tokens
    const tokens = generateTokens(user._id);
    
    res.json({
      success: true,
      message: 'Login exitoso',
      user: user.toPublicJSON(),
      tokens
    });
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Verificar token
// @route   GET /api/v1/auth/verify
// @access  Private
const verifyToken = async (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user.toPublicJSON()
  });
};

// @desc    Logout (limpiar tokens)
// @route   POST /api/v1/auth/logout
// @access  Private  
const logout = async (req, res) => {
  try {
    // En el futuro, podríamos invalidar el refresh token en la DB
    // Por ahora, el frontend maneja la limpieza local
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
    
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Refrescar access token
// @route   POST /api/v1/auth/refresh
// @access  Public (pero requiere refresh token)
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }
    
    // Verificar refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'tropical-tcg-refresh-secret');
    
    // Buscar usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    // Generar nuevo access token
    const newTokens = generateTokens(user._id);
    
    res.json({
      success: true,
      tokens: newTokens
    });
    
  } catch (error) {
    console.error('❌ Error en refresh token:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido'
    });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  logout,
  refreshToken
};