// src/controllers/userController.js
// Controlador de usuarios - Gestión completa de perfiles y estadísticas

const User = require('../models/User');
const { validateEmail, validatePassword, validatePhoneFormat, validateCedulaFormat } = require('../utils/validation');

class UserController {
  
  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req, res) {
    try {
      const user = req.user; // Viene del middleware auth
      
      res.json({
        success: true,
        user: user.toPublicJSON()
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno obteniendo perfil'
      });
    }
  }
  
  /**
   * Actualizar información básica del perfil
   */
  async updateProfile(req, res) {
    try {
      const user = req.user;
      const { fullName, bio, canton, distrito, address } = req.body;
      
      // Validaciones básicas
      const updates = {};
      
      if (fullName !== undefined) {
        if (fullName.trim().length < 2) {
          return res.status(400).json({
            error: 'Nombre inválido',
            message: 'El nombre debe tener al menos 2 caracteres'
          });
        }
        updates.fullName = fullName.trim();
      }
      
      if (bio !== undefined) {
        if (bio.length > 500) {
          return res.status(400).json({
            error: 'Bio muy larga',
            message: 'La biografía no puede exceder 500 caracteres'
          });
        }
        updates.bio = bio.trim();
      }
      
      // Ubicación opcional
      if (canton !== undefined) updates.canton = canton.trim();
      if (distrito !== undefined) updates.distrito = distrito.trim();
      if (address !== undefined) updates.address = address.trim();
      
      // Actualizar en base de datos
      Object.assign(user, updates);
      await user.save();
      
      console.log(`✅ Perfil actualizado: ${user.username}`);
      
      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        user: user.toPublicJSON()
      });
      
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno actualizando perfil'
      });
    }
  }
  
  /**
   * Actualizar configuraciones del usuario
   */
  async updateSettings(req, res) {
    try {
      const user = req.user;
      const { notifications, privacy } = req.body;
      
      // Actualizar notificaciones
      if (notifications) {
        if (notifications.email !== undefined) {
          user.settings.notifications.email = Boolean(notifications.email);
        }
        if (notifications.whatsapp !== undefined) {
          user.settings.notifications.whatsapp = Boolean(notifications.whatsapp);
        }
        if (notifications.inApp !== undefined) {
          user.settings.notifications.inApp = Boolean(notifications.inApp);
        }
      }
      
      // Actualizar privacidad
      if (privacy) {
        if (privacy.showPhone !== undefined) {
          user.settings.privacy.showPhone = Boolean(privacy.showPhone);
        }
        if (privacy.showEmail !== undefined) {
          user.settings.privacy.showEmail = Boolean(privacy.showEmail);
        }
        if (privacy.showLocation !== undefined) {
          user.settings.privacy.showLocation = Boolean(privacy.showLocation);
        }
      }
      
      await user.save();
      
      console.log(`⚙️ Configuraciones actualizadas: ${user.username}`);
      
      res.json({
        success: true,
        message: 'Configuraciones actualizadas exitosamente',
        settings: user.settings
      });
      
    } catch (error) {
      console.error('❌ Error actualizando configuraciones:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno actualizando configuraciones'
      });
    }
  }
  
  /**
   * Obtener perfil público de cualquier usuario
   */
  async getPublicProfile(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe'
        });
      }
      
      // Verificar si está suspendido
      if (user.suspension.suspended) {
        return res.status(403).json({
          error: 'Usuario suspendido',
          message: 'Este usuario está suspendido y su perfil no está disponible'
        });
      }
      
      // Obtener perfil público con respeto a configuraciones de privacidad
      const publicProfile = user.toPublicJSON();
      
      // Aplicar configuraciones de privacidad
      if (!user.settings.privacy.showPhone) {
        delete publicProfile.phone;
      }
      if (!user.settings.privacy.showEmail) {
        delete publicProfile.email;
      }
      if (!user.settings.privacy.showLocation) {
        delete publicProfile.canton;
        delete publicProfile.distrito;
        delete publicProfile.address;
      }
      
      res.json({
        success: true,
        user: publicProfile
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo perfil público:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno obteniendo perfil'
      });
    }
  }
  
  /**
   * Buscar usuarios públicos
   */
  async searchUsers(req, res) {
    try {
      const { username, province, minRating, page = 1, limit = 20 } = req.query;
      
      // Construir filtros de búsqueda
      const filters = {
        'suspension.suspended': { $ne: true }
      };
      
      if (username) {
        filters.username = new RegExp(username, 'i');
      }
      
      if (province) {
        filters.province = province;
      }
      
      if (minRating) {
        filters.rating = { $gte: parseFloat(minRating) };
      }
      
      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Búsqueda con paginación
      const users = await User.findPublic(filters)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ rating: -1, 'stats.asSeller.completed': -1 })
        .exec();
      
      // Total para paginación
      const total = await User.countDocuments(filters);
      
      res.json({
        success: true,
        users: users.map(user => user.toPublicJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('❌ Error buscando usuarios:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno en búsqueda'
      });
    }
  }
  
  /**
   * Obtener estadísticas detalladas del usuario
   */
  async getUserStats(req, res) {
    try {
      const user = req.user;
      
      // Calcular estadísticas adicionales
      const totalTransactions = user.stats.asBuyer.total + user.stats.asSeller.total;
      const completedTransactions = user.stats.asBuyer.completed + user.stats.asSeller.completed;
      const successRate = totalTransactions > 0 ? 
        Math.round((completedTransactions / totalTransactions) * 100) : 0;
      
      const stats = {
        basic: {
          totalRatings: user.totalRatings,
          averageRating: user.rating,
          successRate,
          memberSince: user.createdAt,
          lastActivity: user.lastActivity,
          recommendations: user.recommendations || 0
        },
        asBuyer: user.stats.asBuyer,
        asSeller: user.stats.asSeller,
        verification: user.verification,
        canUseP2P: user.canUseP2P()
      };
      
      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno obteniendo estadísticas'
      });
    }
  }
  
  /**
   * Recomendar/Des-recomendar un usuario (like/unlike)
   */
  async toggleRecommendation(req, res) {
    try {
      const { userId } = req.params;
      const currentUser = req.user;
      
      if (userId === currentUser._id.toString()) {
        return res.status(400).json({
          error: 'Acción inválida',
          message: 'No puedes recomendarte a ti mismo'
        });
      }
      
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario que intentas recomendar no existe'
        });
      }
      
      // Verificar si ya lo había recomendado
      const currentRecommendations = currentUser.recommendedUsers || [];
      const alreadyRecommended = currentRecommendations.includes(userId);
      
      if (alreadyRecommended) {
        // Quitar recomendación
        currentUser.recommendedUsers = currentRecommendations.filter(id => id !== userId);
        targetUser.recommendations = Math.max(0, (targetUser.recommendations || 0) - 1);
        
        await Promise.all([currentUser.save(), targetUser.save()]);
        
        res.json({
          success: true,
          message: 'Recomendación eliminada',
          recommended: false,
          newCount: targetUser.recommendations
        });
      } else {
        // Agregar recomendación
        if (!currentUser.recommendedUsers) currentUser.recommendedUsers = [];
        currentUser.recommendedUsers.push(userId);
        targetUser.recommendations = (targetUser.recommendations || 0) + 1;
        
        await Promise.all([currentUser.save(), targetUser.save()]);
        
        res.json({
          success: true,
          message: 'Usuario recomendado',
          recommended: true,
          newCount: targetUser.recommendations
        });
      }
      
    } catch (error) {
      console.error('❌ Error gestionando recomendación:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno gestionando recomendación'
      });
    }
  }
  
  /**
   * Subir/actualizar foto de perfil
   */
  async updateProfilePicture(req, res) {
    try {
      const user = req.user;
      
      if (!req.file) {
        return res.status(400).json({
          error: 'Archivo requerido',
          message: 'Debes subir una imagen para tu foto de perfil'
        });
      }
      
      const uploadService = require('../middleware/upload');
      
      // Si ya tenía foto de perfil, eliminar la anterior
      if (user.profilePhoto && user.profilePhoto.publicId) {
        await uploadService.deleteImage(user.profilePhoto.publicId);
      }
      
      // Actualizar con nueva foto
      user.profilePhoto = {
        url: req.file.path,
        publicId: req.file.filename
      };
      
      await user.save();
      
      console.log(`📷 Foto de perfil actualizada: ${user.username}`);
      
      res.json({
        success: true,
        message: 'Foto de perfil actualizada exitosamente',
        profilePhoto: {
          url: user.profilePhoto.url,
          variants: uploadService.getImageVariants(user.profilePhoto.publicId)
        }
      });
      
    } catch (error) {
      console.error('❌ Error actualizando foto de perfil:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno actualizando foto de perfil'
      });
    }
  }
  
  /**
   * Eliminar foto de perfil
   */
  async deleteProfilePicture(req, res) {
    try {
      const user = req.user;
      
      if (!user.profilePhoto || !user.profilePhoto.publicId) {
        return res.status(400).json({
          error: 'Sin foto de perfil',
          message: 'No tienes una foto de perfil para eliminar'
        });
      }
      
      const uploadService = require('../middleware/upload');
      
      // Eliminar de Cloudinary
      const deleted = await uploadService.deleteImage(user.profilePhoto.publicId);
      if (!deleted) {
        console.warn(`⚠️ No se pudo eliminar imagen de Cloudinary: ${user.profilePhoto.publicId}`);
      }
      
      // Limpiar de la base de datos
      user.profilePhoto = {
        url: null,
        publicId: null
      };
      
      await user.save();
      
      console.log(`🗑️ Foto de perfil eliminada: ${user.username}`);
      
      res.json({
        success: true,
        message: 'Foto de perfil eliminada exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error eliminando foto de perfil:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno eliminando foto de perfil'
      });
    }
  }
  
  /**
   * Eliminar cuenta del usuario
   */
  async deleteAccount(req, res) {
    try {
      const user = req.user;
      const { password, confirmation } = req.body;
      
      if (!password || confirmation !== 'ELIMINAR MI CUENTA') {
        return res.status(400).json({
          error: 'Confirmación requerida',
          message: 'Debes escribir "ELIMINAR MI CUENTA" y proporcionar tu contraseña'
        });
      }
      
      // Verificar contraseña
      const userWithPassword = await User.findById(user._id).select('+password');
      const isPasswordValid = await userWithPassword.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Contraseña incorrecta',
          message: 'La contraseña proporcionada es incorrecta'
        });
      }
      
      // TODO: Verificar que no tenga transacciones activas
      // TODO: Cancelar listings activos
      
      // Eliminar usuario
      await User.findByIdAndDelete(user._id);
      
      console.log(`🗑️ Cuenta eliminada: ${user.username} (${user.email})`);
      
      res.json({
        success: true,
        message: 'Cuenta eliminada exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error eliminando cuenta:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno eliminando cuenta'
      });
    }
  }
}

module.exports = new UserController();