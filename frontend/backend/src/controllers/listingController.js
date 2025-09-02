// src/controllers/listingController.js
const Listing = require('../models/Listing');
const User = require('../models/User');

// @desc    Obtener todas las listings con filtros y paginación
// @route   GET /api/v1/listings
// @access  Public
const getListings = async (req, res) => {
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
    
    // Construir query de búsqueda
    let query = { 
      status: 'active', 
      availableQuantity: { $gt: 0 } 
    };
    
    // Filtro de búsqueda por texto
    if (search) {
      query.$or = [
        { cardName: { $regex: search, $options: 'i' } },
        { setName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtros específicos
    if (tcgType) query.tcgType = tcgType;
    if (condition) query.condition = condition;
    
    // Filtro de precios
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Opciones de ordenamiento
    const sortOptions = {};
    switch (sortBy) {
      case 'price-low': 
        sortOptions.price = 1; 
        break;
      case 'price-high': 
        sortOptions.price = -1; 
        break;
      case 'name': 
        sortOptions.cardName = 1; 
        break;
      case 'newest': 
      default: 
        sortOptions.publishedAt = -1; 
        break;
    }
    
    // Configurar paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Ejecutar consulta con populate del vendedor
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('sellerId', 'username rating verification phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
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
    console.error('❌ Error obteniendo listings:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener listing por ID
// @route   GET /api/v1/listings/:id
// @access  Public
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'username rating verification phone email');
    
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
      data: listing
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Crear nuevo listing
// @route   POST /api/v1/listings
// @access  Private
const createListing = async (req, res) => {
  try {
    const listingData = {
      ...req.body,
      sellerId: req.user._id,
      sellerName: req.user.username,
      userPhone: req.user.phone,
      userEmail: req.user.email
    };
    
    const listing = new Listing(listingData);
    await listing.save();
    
    // Añadir listing al usuario
    await User.findByIdAndUpdate(req.user._id, {
      $push: { listings: listing._id }
    });
    
    res.status(201).json({
      success: true,
      message: 'Listing creado exitosamente',
      data: listing
    });
    
  } catch (error) {
    console.error('❌ Error creando listing:', error);
    res.status(400).json({
      success: false,
      message: 'Error creando listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar listing
// @route   PUT /api/v1/listings/:id
// @access  Private (solo el owner)
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      {
        _id: req.params.id,
        sellerId: req.user._id
      },
      req.body,
      { 
        new: true,
        runValidators: true
      }
    );
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing no encontrado o no tienes permisos'
      });
    }
    
    res.json({
      success: true,
      message: 'Listing actualizado exitosamente',
      data: listing
    });
    
  } catch (error) {
    console.error('❌ Error actualizando listing:', error);
    res.status(400).json({
      success: false,
      message: 'Error actualizando listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Eliminar listing
// @route   DELETE /api/v1/listings/:id
// @access  Private (solo el owner)
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({
      _id: req.params.id,
      sellerId: req.user._id
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing no encontrado o no tienes permisos'
      });
    }
    
    // Remover del usuario
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { listings: listing._id }
    });
    
    res.json({
      success: true,
      message: 'Listing eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
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

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getUserListings
};