// src/controllers/userController.js
const User = require('../models/User');
const Listing = require('../models/Listing');

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar perfil del usuario
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'fullName', 
      'phone', 
      'province', 
      'settings.notifications',
      'settings.privacy'
    ];
    
    const updates = {};
    
    // Filtrar solo campos permitidos
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Manejar nested objects (settings)
    if (req.body.settings) {
      if (req.body.settings.notifications) {
        updates['settings.notifications'] = {
          ...req.user.settings.notifications.toObject(),
          ...req.body.settings.notifications
        };
      }
      if (req.body.settings.privacy) {
        updates['settings.privacy'] = {
          ...req.user.settings.privacy.toObject(),
          ...req.body.settings.privacy
        };
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { 
        new: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user.toPublicJSON()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(400).json({
      success: false,
      message: 'Error actualizando perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener listings del usuario autenticado
// @route   GET /api/v1/users/listings
// @access  Private
const getUserListings = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    
    let query = { sellerId: req.user._id };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo listings del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener perfil público de usuario
// @route   GET /api/v1/users/:id/public
// @access  Public
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username rating stats verification createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener estadísticas de listings
    const [activeListings, totalListings] = await Promise.all([
      Listing.countDocuments({ sellerId: user._id, status: 'active' }),
      Listing.countDocuments({ sellerId: user._id })
    ]);
    
    res.json({
      success: true,
      data: {
        username: user.username,
        rating: user.rating,
        stats: {
          ...user.stats.toObject(),
          activeListings,
          totalListings
        },
        verification: user.verification,
        memberSince: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo perfil público:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Cambiar contraseña
// @route   PUT /api/v1/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }
    
    // Verificar contraseña actual
    const user = await User.findById(req.user._id);
    
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Desactivar cuenta
// @route   DELETE /api/v1/users/deactivate
// @access  Private
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña requerida para desactivar cuenta'
      });
    }
    
    // Verificar contraseña
    const user = await User.findById(req.user._id);
    
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }
    
    // Desactivar cuenta y listings activas
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, {
        'status.active': false
      }),
      Listing.updateMany(
        { sellerId: req.user._id, status: 'active' },
        { status: 'inactive' }
      )
    ]);
    
    res.json({
      success: true,
      message: 'Cuenta desactivada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error desactivando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserListings,
  getPublicProfile,
  changePassword,
  deactivateAccount
};