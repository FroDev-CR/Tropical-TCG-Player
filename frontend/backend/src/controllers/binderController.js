// src/controllers/binderController.js
const Binder = require('../models/Binder');
const User = require('../models/User');

// @desc    Obtener todos los binders del usuario
// @route   GET /api/v1/binders
// @access  Private
const getBinders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    const [binders, total] = await Promise.all([
      Binder.find({ 
        userId: req.user._id, 
        status: 'active' 
      })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Binder.countDocuments({ 
        userId: req.user._id, 
        status: 'active' 
      })
    ]);
    
    res.json({
      success: true,
      data: {
        binders,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo binders:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener binder por ID
// @route   GET /api/v1/binders/:id
// @access  Private (solo owner)
const getBinderById = async (req, res) => {
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
      data: binder
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo binder:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Crear nuevo binder
// @route   POST /api/v1/binders
// @access  Private
const createBinder = async (req, res) => {
  try {
    const binderData = {
      ...req.body,
      userId: req.user._id
    };
    
    const binder = new Binder(binderData);
    await binder.save();
    
    // Añadir binder al usuario
    await User.findByIdAndUpdate(req.user._id, {
      $push: { binders: binder._id }
    });
    
    res.status(201).json({
      success: true,
      message: 'Binder creado exitosamente',
      data: binder
    });
    
  } catch (error) {
    console.error('❌ Error creando binder:', error);
    res.status(400).json({
      success: false,
      message: 'Error creando binder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar binder
// @route   PUT /api/v1/binders/:id
// @access  Private (solo owner)
const updateBinder = async (req, res) => {
  try {
    const binder = await Binder.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
        status: 'active'
      },
      req.body,
      { 
        new: true,
        runValidators: true
      }
    );
    
    if (!binder) {
      return res.status(404).json({
        success: false,
        message: 'Binder no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Binder actualizado exitosamente',
      data: binder
    });
    
  } catch (error) {
    console.error('❌ Error actualizando binder:', error);
    res.status(400).json({
      success: false,
      message: 'Error actualizando binder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Eliminar binder
// @route   DELETE /api/v1/binders/:id
// @access  Private (solo owner)
const deleteBinder = async (req, res) => {
  try {
    const binder = await Binder.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
        status: 'active'
      },
      { status: 'deleted' },
      { new: true }
    );
    
    if (!binder) {
      return res.status(404).json({
        success: false,
        message: 'Binder no encontrado'
      });
    }
    
    // Remover del usuario
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { binders: binder._id }
    });
    
    res.json({
      success: true,
      message: 'Binder eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando binder:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Añadir carta a binder
// @route   POST /api/v1/binders/:id/cards
// @access  Private (solo owner)
const addCardToBinder = async (req, res) => {
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
    
    // Usar el método del modelo para añadir carta
    await binder.addCard(req.body);
    
    res.json({
      success: true,
      message: 'Carta añadida exitosamente',
      data: binder
    });
    
  } catch (error) {
    console.error('❌ Error añadiendo carta:', error);
    res.status(400).json({
      success: false,
      message: 'Error añadiendo carta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar carta en binder
// @route   PUT /api/v1/binders/:binderId/cards/:cardId
// @access  Private (solo owner)
const updateCardInBinder = async (req, res) => {
  try {
    const binder = await Binder.findOne({
      _id: req.params.binderId,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!binder) {
      return res.status(404).json({
        success: false,
        message: 'Binder no encontrado'
      });
    }
    
    const cardIndex = binder.cards.findIndex(
      card => card._id.toString() === req.params.cardId
    );
    
    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Carta no encontrada en el binder'
      });
    }
    
    // Actualizar carta
    Object.assign(binder.cards[cardIndex], req.body);
    
    // Recalcular estadísticas
    await binder.updateStats();
    
    res.json({
      success: true,
      message: 'Carta actualizada exitosamente',
      data: binder
    });
    
  } catch (error) {
    console.error('❌ Error actualizando carta:', error);
    res.status(400).json({
      success: false,
      message: 'Error actualizando carta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remover carta de binder
// @route   DELETE /api/v1/binders/:binderId/cards/:cardId
// @access  Private (solo owner)
const removeCardFromBinder = async (req, res) => {
  try {
    const binder = await Binder.findOne({
      _id: req.params.binderId,
      userId: req.user._id,
      status: 'active'
    });
    
    if (!binder) {
      return res.status(404).json({
        success: false,
        message: 'Binder no encontrado'
      });
    }
    
    const cardIndex = binder.cards.findIndex(
      card => card._id.toString() === req.params.cardId
    );
    
    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Carta no encontrada en el binder'
      });
    }
    
    // Remover carta
    binder.cards.splice(cardIndex, 1);
    
    // Recalcular estadísticas
    await binder.updateStats();
    
    res.json({
      success: true,
      message: 'Carta removida exitosamente',
      data: binder
    });
    
  } catch (error) {
    console.error('❌ Error removiendo carta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getBinders,
  getBinderById,
  createBinder,
  updateBinder,
  deleteBinder,
  addCardToBinder,
  updateCardInBinder,
  removeCardFromBinder
};