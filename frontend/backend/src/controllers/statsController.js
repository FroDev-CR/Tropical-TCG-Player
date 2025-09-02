// src/controllers/statsController.js
const User = require('../models/User');
const Listing = require('../models/Listing');
const Binder = require('../models/Binder');
const Transaction = require('../models/Transaction');

// @desc    Obtener estadísticas del dashboard del usuario
// @route   GET /api/v1/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Estadísticas básicas del usuario
    const [
      userListingsCount,
      userBindersCount,
      userTransactionsCount,
      activeTransactions,
      recentListings
    ] = await Promise.all([
      // Total de listings del usuario
      Listing.countDocuments({ sellerId: userId }),
      
      // Total de binders del usuario
      Binder.countDocuments({ userId, status: 'active' }),
      
      // Total de transacciones del usuario
      Transaction.countDocuments({
        $or: [
          { 'buyer.userId': userId },
          { 'seller.userId': userId }
        ]
      }),
      
      // Transacciones activas (no completadas ni canceladas)
      Transaction.find({
        $or: [
          { 'buyer.userId': userId },
          { 'seller.userId': userId }
        ],
        status: { 
          $nin: ['completed', 'cancelled_by_seller', 'cancelled_by_buyer', 'cancelled_timeout_seller'] 
        }
      })
        .sort({ 'timeline.created': -1 })
        .limit(5)
        .lean(),
        
      // Listings recientes del usuario
      Listing.find({ sellerId: userId })
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean()
    ]);
    
    // Calcular estadísticas de ventas/compras
    const salesStats = await Transaction.aggregate([
      {
        $match: {
          'seller.userId': userId,
          status: { $in: ['completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalEarned: { $sum: '$amounts.total' }
        }
      }
    ]);
    
    const purchaseStats = await Transaction.aggregate([
      {
        $match: {
          'buyer.userId': userId,
          status: { $in: ['completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: '$amounts.total' }
        }
      }
    ]);
    
    // Listings por estado
    const listingsByStatus = await Listing.aggregate([
      { $match: { sellerId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Formatear estadísticas
    const stats = {
      listings: {
        total: userListingsCount,
        byStatus: listingsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      binders: {
        total: userBindersCount
      },
      transactions: {
        total: userTransactionsCount,
        active: activeTransactions.length,
        sales: {
          total: salesStats[0]?.totalSales || 0,
          earned: salesStats[0]?.totalEarned || 0
        },
        purchases: {
          total: purchaseStats[0]?.totalPurchases || 0,
          spent: purchaseStats[0]?.totalSpent || 0
        }
      },
      user: {
        rating: req.user.rating.average,
        completedSales: req.user.stats.completedSales,
        completedPurchases: req.user.stats.completedPurchases,
        memberSince: req.user.stats.memberSince,
        lastActivity: req.user.stats.lastActivity
      }
    };
    
    const recentActivity = {
      activeTransactions,
      recentListings
    };
    
    res.json({
      success: true,
      data: {
        stats,
        recentActivity
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener estadísticas generales de la plataforma
// @route   GET /api/v1/stats/platform
// @access  Public
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalListings,
      totalTransactions,
      activeListings,
      topTCGs
    ] = await Promise.all([
      User.countDocuments({ 'status.active': true }),
      Listing.countDocuments(),
      Transaction.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      
      // TCGs más populares
      Listing.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$tcgType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    // Valor total del mercado (listings activas)
    const marketValue = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        platform: {
          totalUsers,
          totalListings,
          totalTransactions,
          activeListings,
          marketValue: marketValue[0]?.total || 0
        },
        topTCGs: topTCGs.map(tcg => ({
          name: tcg._id,
          listings: tcg.count
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de plataforma:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener estadísticas de transacciones por período
// @route   GET /api/v1/stats/transactions
// @access  Private
const getTransactionStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user._id;
    
    // Calcular fecha de inicio según el período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Transacciones por día
    const transactionsByDay = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { 'buyer.userId': userId },
            { 'seller.userId': userId }
          ],
          'timeline.created': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$timeline.created' 
            }
          },
          count: { $sum: 1 },
          volume: { $sum: '$amounts.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Transacciones por estado
    const transactionsByStatus = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { 'buyer.userId': userId },
            { 'seller.userId': userId }
          ],
          'timeline.created': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        transactionsByDay,
        transactionsByStatus: transactionsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getDashboardStats,
  getPlatformStats,
  getTransactionStats
};