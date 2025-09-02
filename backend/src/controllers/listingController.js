// src/controllers/listingController.js
// Controlador de listings - Gestión completa de cartas en venta

const Listing = require('../models/Listing');
const User = require('../models/User');

class ListingController {
  
  /**
   * Crear nuevo listing
   */
  async createListing(req, res) {
    try {
      const seller = req.user;
      const listingData = req.body;
      
      // Validaciones básicas
      const requiredFields = ['cardId', 'cardName', 'cardImage', 'tcgType', 'setName', 'rarity', 'price', 'condition', 'quantity'];
      const missingFields = requiredFields.filter(field => !listingData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Datos faltantes',
          message: 'Campos requeridos faltantes',
          missingFields
        });
      }
      
      // Crear nuevo listing
      const newListing = new Listing({
        ...listingData,
        sellerId: seller._id,
        sellerName: seller.username,
        sellerLocation: seller.province,
        availableQuantity: listingData.quantity // Inicialmente toda la cantidad está disponible
      });
      
      await newListing.save();
      
      console.log(`📦 Nuevo listing creado: ${newListing.cardName} por ${seller.username}`);
      
      res.status(201).json({
        success: true,
        message: 'Listing creado exitosamente',
        listing: newListing.toPublicJSON()
      });
      
    } catch (error) {
      console.error('❌ Error creando listing:', error);
      
      // Manejar errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          error: 'Datos inválidos',
          message: 'Error en validación de datos',
          details: errors
        });
      }
      
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno creando listing'
      });
    }
  }
  
  /**
   * Obtener todos los listings con filtros y paginación
   */
  async getListings(req, res) {
    try {
      const {
        search,
        tcgType,
        condition,
        minPrice,
        maxPrice,
        rarity,
        province,
        shippingIncluded,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 48
      } = req.query;
      
      // Construir filtros
      let filters = { status: 'active', availableQuantity: { $gt: 0 } };
      
      if (tcgType) filters.tcgType = tcgType;
      if (condition) filters.condition = condition;
      if (rarity) filters.rarity = new RegExp(rarity, 'i');
      if (province) filters.sellerLocation = province;
      if (shippingIncluded !== undefined) filters.shippingIncluded = shippingIncluded === 'true';
      
      // Filtros de precio
      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = parseInt(minPrice);
        if (maxPrice) filters.price.$lte = parseInt(maxPrice);
      }
      
      // Configurar ordenamiento
      const sortOptions = {};
      const validSortFields = ['price', 'createdAt', 'views', 'favorites', 'cardName'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
      
      // Si hay ordenamiento secundario, agregar createdAt como fallback
      if (sortField !== 'createdAt') {
        sortOptions.createdAt = -1;
      }
      
      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = Math.min(parseInt(limit), 100); // Máximo 100 por página
      
      // Buscar listings
      let query;
      if (search && search.trim()) {
        // Búsqueda por texto
        query = Listing.searchByText(search.trim(), filters);
      } else {
        // Búsqueda normal con filtros
        query = Listing.findActive(filters);
      }
      
      const listings = await query
        .populate('sellerId', 'username rating totalRatings verification')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .exec();
      
      // Contar total para paginación
      const total = await Listing.countDocuments(filters);
      
      // Incrementar vistas si no es el vendedor
      const currentUserId = req.user?._id.toString();
      
      res.json({
        success: true,
        listings: listings.map(listing => {
          const publicData = listing.toPublicJSON();
          
          // Agregar información del vendedor
          if (listing.sellerId) {
            publicData.seller = {
              id: listing.sellerId._id,
              username: listing.sellerId.username,
              rating: listing.sellerId.rating,
              totalRatings: listing.sellerId.totalRatings,
              verified: listing.sellerId.verification
            };
          }
          
          return publicData;
        }),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        filters: {
          search,
          tcgType,
          condition,
          minPrice,
          maxPrice,
          rarity,
          province,
          shippingIncluded,
          sortBy: sortField,
          sortOrder
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo listings:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno obteniendo listings'
      });
    }
  }
  
  /**
   * Obtener listing por ID
   */
  async getListingById(req, res) {
    try {
      const { listingId } = req.params;
      const currentUser = req.user;
      
      const listing = await Listing.findById(listingId)
        .populate('sellerId', 'username rating totalRatings verification stats settings.privacy')
        .exec();
      
      if (!listing) {
        return res.status(404).json({
          error: 'Listing no encontrado',
          message: 'El listing solicitado no existe'
        });
      }
      
      // Incrementar vistas si no es el vendedor
      if (!currentUser || !listing.sellerId._id.equals(currentUser._id)) {
        listing.incrementViews().catch(err => console.error('Error incrementando vistas:', err));
      }
      
      const listingData = listing.toPublicJSON();
      
      // Agregar información detallada del vendedor
      if (listing.sellerId) {
        const seller = listing.sellerId;
        listingData.seller = {
          id: seller._id,
          username: seller.username,
          rating: seller.rating,
          totalRatings: seller.totalRatings,
          stats: seller.stats,
          verification: seller.verification,
          memberSince: seller.createdAt
        };
        
        // Información de contacto según configuraciones de privacidad
        if (seller.settings?.privacy?.showPhone) {
          listingData.seller.phone = seller.phone;
        }
        if (seller.settings?.privacy?.showEmail) {
          listingData.seller.email = seller.email;
        }
      }
      
      res.json({
        success: true,
        listing: listingData
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo listing:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno obteniendo listing'
      });
    }
  }
  
  /**
   * Obtener listings del usuario autenticado
   */
  async getMyListings(req, res) {
    try {
      const user = req.user;
      const { status, page = 1, limit = 20 } = req.query;
      
      // Filtros
      const filters = { sellerId: user._id };
      if (status) {
        filters.status = status;
      }
      
      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = Math.min(parseInt(limit), 50);
      
      const listings = await Listing.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec();
      
      const total = await Listing.countDocuments(filters);
      
      res.json({
        success: true,
        listings: listings.map(listing => ({
          ...listing.toPublicJSON(),
          // Para listings propios, incluir información sensible
          reservedQuantity: listing.reservedQuantity,
          reservations: listing.reservations
        })),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo mis listings:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno obteniendo listings'
      });
    }
  }
  
  /**
   * Actualizar listing
   */
  async updateListing(req, res) {
    try {
      const { listingId } = req.params;
      const user = req.user;
      const updates = req.body;
      
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({
          error: 'Listing no encontrado',
          message: 'El listing que intentas actualizar no existe'
        });
      }
      
      // Verificar ownership
      if (!listing.sellerId.equals(user._id)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo puedes editar tus propios listings'
        });
      }
      
      // Campos que se pueden actualizar
      const allowedUpdates = ['price', 'condition', 'description', 'quantity', 'shippingIncluded', 'status', 'originStore'];
      const actualUpdates = Object.keys(updates).filter(key => allowedUpdates.includes(key));
      
      if (actualUpdates.length === 0) {
        return res.status(400).json({
          error: 'Sin cambios',
          message: 'No se proporcionaron campos válidos para actualizar'
        });
      }
      
      // Validaciones especiales
      if (updates.quantity !== undefined) {
        const newQuantity = parseInt(updates.quantity);
        const totalReserved = listing.reservedQuantity || 0;
        const totalSold = listing.totalSold || 0;
        
        if (newQuantity < totalSold) {
          return res.status(400).json({
            error: 'Cantidad inválida',
            message: `No puedes reducir la cantidad por debajo de lo ya vendido (${totalSold})`
          });
        }
        
        // Ajustar availableQuantity proporcionalmente
        const difference = newQuantity - listing.quantity;
        updates.availableQuantity = Math.max(0, listing.availableQuantity + difference);
      }
      
      // Aplicar updates
      actualUpdates.forEach(key => {
        listing[key] = updates[key];
      });
      
      await listing.save();
      
      console.log(`📝 Listing actualizado: ${listing.cardName} por ${user.username}`);
      
      res.json({
        success: true,
        message: 'Listing actualizado exitosamente',
        listing: listing.toPublicJSON()
      });
      
    } catch (error) {
      console.error('❌ Error actualizando listing:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          error: 'Datos inválidos',
          message: 'Error en validación de datos',
          details: errors
        });
      }
      
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno actualizando listing'
      });
    }
  }
  
  /**
   * Eliminar listing
   */
  async deleteListing(req, res) {
    try {
      const { listingId } = req.params;
      const user = req.user;
      
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({
          error: 'Listing no encontrado',
          message: 'El listing que intentas eliminar no existe'
        });
      }
      
      // Verificar ownership
      if (!listing.sellerId.equals(user._id)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo puedes eliminar tus propios listings'
        });
      }
      
      // Verificar que no tenga reservas activas
      if (listing.reservedQuantity > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'No puedes eliminar un listing con reservas activas'
        });
      }
      
      await Listing.findByIdAndDelete(listingId);
      
      console.log(`🗑️ Listing eliminado: ${listing.cardName} por ${user.username}`);
      
      res.json({
        success: true,
        message: 'Listing eliminado exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error eliminando listing:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno eliminando listing'
      });
    }
  }
  
  /**
   * Obtener estadísticas de TCG (para filtros frontend)
   */
  async getTCGStats(req, res) {
    try {
      // Aggregation para obtener estadísticas
      const stats = await Listing.aggregate([
        { $match: { status: 'active', availableQuantity: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalListings: { $sum: 1 },
            tcgTypes: { $addToSet: '$tcgType' },
            conditions: { $addToSet: '$condition' },
            provinces: { $addToSet: '$sellerLocation' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgPrice: { $avg: '$price' }
          }
        }
      ]);
      
      // Estadísticas por TCG
      const tcgStats = await Listing.aggregate([
        { $match: { status: 'active', availableQuantity: { $gt: 0 } } },
        {
          $group: {
            _id: '$tcgType',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      const result = stats[0] || {
        totalListings: 0,
        tcgTypes: [],
        conditions: [],
        provinces: [],
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0
      };
      
      res.json({
        success: true,
        stats: {
          ...result,
          avgPrice: Math.round(result.avgPrice || 0),
          tcgStats
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas TCG:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno obteniendo estadísticas'
      });
    }
  }
}

module.exports = new ListingController();