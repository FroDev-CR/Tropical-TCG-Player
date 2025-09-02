// src/controllers/authController.js
// Controlador de autenticación

const User = require('../models/User');
const jwtUtil = require('../utils/jwt');
const { validateRegistrationData, validateEmail, validatePassword } = require('../utils/validation');

class AuthController {
  
  /**
   * Registro de nuevo usuario
   */
  async register(req, res) {
    try {
      const userData = req.body;
      
      // Validar datos de entrada
      const validation = validateRegistrationData(userData);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: 'Por favor corrige los errores en el formulario',
          details: validation.errors
        });
      }
      
      const formattedData = validation.formattedData;
      
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        $or: [
          { email: formattedData.email },
          { username: formattedData.username },
          { cedula: formattedData.cedula }
        ]
      });
      
      if (existingUser) {
        let field = 'usuario';
        if (existingUser.email === formattedData.email) field = 'email';
        else if (existingUser.cedula === formattedData.cedula) field = 'cédula';
        
        return res.status(409).json({
          error: 'Usuario ya existe',
          message: `Ya existe un usuario con ese ${field}`,
          field
        });
      }
      
      // Crear nuevo usuario
      const newUser = new User(formattedData);
      await newUser.save();
      
      // Generar tokens
      const tokens = jwtUtil.generateTokens(newUser);
      
      // Agregar refresh token al usuario
      const deviceInfo = req.get('User-Agent') || 'Unknown Device';
      const clientIP = req.ip || req.connection.remoteAddress || 'Unknown IP';
      
      newUser.addRefreshToken(tokens.refreshToken, deviceInfo, clientIP);
      newUser.lastLogin = new Date();
      await newUser.save();
      
      // Log de registro exitoso
      console.log(`✅ Nuevo usuario registrado: ${newUser.username} (${newUser.email})`);
      
      res.status(201).json({
        success: true,
        message: '¡Registro exitoso! Bienvenido a Tropical TCG',
        user: newUser.toPublicJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      // Manejar errores específicos de MongoDB
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          error: 'Datos duplicados',
          message: `Ya existe un usuario con ese ${field}`,
          field
        });
      }
      
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno durante el registro'
      });
    }
  }
  
  /**
   * Login de usuario
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({
          error: 'Datos faltantes',
          message: 'Email y contraseña son requeridos'
        });
      }
      
      // Buscar usuario por email o username
      const user = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      }).select('+password'); // Incluir password para comparar
      
      if (!user) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          message: 'Email/usuario o contraseña incorrectos'
        });
      }
      
      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          message: 'Email/usuario o contraseña incorrectos'
        });
      }
      
      // Verificar si está suspendido
      if (user.suspension.suspended) {
        const suspendedUntil = user.suspension.until 
          ? ` hasta ${user.suspension.until.toLocaleDateString()}`
          : ' permanentemente';
          
        return res.status(403).json({
          error: 'Usuario suspendido',
          message: `Tu cuenta está suspendida${suspendedUntil}. Razón: ${user.suspension.reason}`
        });
      }
      
      // Generar tokens
      const tokens = jwtUtil.generateTokens(user);
      
      // Agregar refresh token al usuario
      const deviceInfo = req.get('User-Agent') || 'Unknown Device';
      const clientIP = req.ip || req.connection.remoteAddress || 'Unknown IP';
      
      user.addRefreshToken(tokens.refreshToken, deviceInfo, clientIP);
      user.lastLogin = new Date();
      user.lastActivity = new Date();
      await user.save();
      
      // Log de login exitoso
      console.log(`✅ Usuario logueado: ${user.username} desde ${clientIP}`);
      
      res.json({
        success: true,
        message: `¡Bienvenido de vuelta, ${user.username}!`,
        user: user.toPublicJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno durante el login'
      });
    }
  }
  
  /**
   * Refresh token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          error: 'Token faltante',
          message: 'Refresh token es requerido'
        });
      }
      
      // Verificar refresh token
      let decoded;
      try {
        decoded = jwtUtil.verifyRefreshToken(refreshToken);
      } catch (error) {
        return res.status(401).json({
          error: 'Token inválido',
          message: 'Refresh token inválido o expirado'
        });
      }
      
      // Buscar usuario
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          error: 'Usuario no encontrado',
          message: 'Usuario asociado al token no existe'
        });
      }
      
      // Verificar que el refresh token existe en la base de datos
      const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
      if (!tokenExists) {
        return res.status(401).json({
          error: 'Token revocado',
          message: 'El refresh token ha sido revocado'
        });
      }
      
      // Generar nuevos tokens
      const tokens = jwtUtil.generateTokens(user);
      
      // Reemplazar el refresh token viejo con el nuevo
      user.removeRefreshToken(refreshToken);
      const deviceInfo = req.get('User-Agent') || 'Unknown Device';
      const clientIP = req.ip || req.connection.remoteAddress || 'Unknown IP';
      user.addRefreshToken(tokens.refreshToken, deviceInfo, clientIP);
      
      user.lastActivity = new Date();
      await user.save();
      
      res.json({
        success: true,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });
      
    } catch (error) {
      console.error('❌ Error en refresh token:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno durante refresh token'
      });
    }
  }
  
  /**
   * Logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const user = req.user; // Viene del middleware de auth
      
      if (refreshToken && user) {
        // Remover el refresh token específico
        user.removeRefreshToken(refreshToken);
        await user.save();
        
        console.log(`👋 Usuario deslogueado: ${user.username}`);
      }
      
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
      
    } catch (error) {
      console.error('❌ Error en logout:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno durante logout'
      });
    }
  }
  
  /**
   * Logout de todos los dispositivos
   */
  async logoutAll(req, res) {
    try {
      const user = req.user; // Viene del middleware de auth
      
      // Limpiar todos los refresh tokens
      user.refreshTokens = [];
      await user.save();
      
      console.log(`👋 Usuario deslogueado de todos los dispositivos: ${user.username}`);
      
      res.json({
        success: true,
        message: 'Deslogueado de todos los dispositivos exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en logout all:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno durante logout'
      });
    }
  }
  
  /**
   * Verificar token actual
   */
  async verifyToken(req, res) {
    try {
      const user = req.user; // Viene del middleware de auth
      
      res.json({
        success: true,
        user: user.toPublicJSON(),
        tokenValid: true
      });
      
    } catch (error) {
      console.error('❌ Error en verify token:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno durante verificación'
      });
    }
  }
  
  /**
   * Cambiar contraseña
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user; // Viene del middleware de auth
      
      // Validaciones
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Datos faltantes',
          message: 'Contraseña actual y nueva son requeridas'
        });
      }
      
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: 'Contraseña inválida',
          message: passwordValidation.error
        });
      }
      
      // Obtener usuario con contraseña
      const userWithPassword = await User.findById(user._id).select('+password');
      
      // Verificar contraseña actual
      const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Contraseña incorrecta',
          message: 'La contraseña actual es incorrecta'
        });
      }
      
      // Actualizar contraseña
      userWithPassword.password = newPassword;
      
      // Revocar todos los refresh tokens por seguridad
      userWithPassword.refreshTokens = [];
      
      await userWithPassword.save();
      
      console.log(`🔐 Contraseña cambiada: ${user.username}`);
      
      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente. Por favor inicia sesión nuevamente.'
      });
      
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      res.status(500).json({
        error: 'Error del servidor',
        message: 'Error interno cambiando contraseña'
      });
    }
  }
}

module.exports = new AuthController();