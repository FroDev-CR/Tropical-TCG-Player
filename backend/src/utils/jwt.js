// src/utils/jwt.js
// Utilidades para manejo de JWT

const jwt = require('jsonwebtoken');
const config = require('../config');

class JWTUtil {
  
  /**
   * Genera un access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expire,
      issuer: 'tropical-tcg-api',
      audience: 'tropical-tcg-frontend'
    });
  }
  
  /**
   * Genera un refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpire,
      issuer: 'tropical-tcg-api',
      audience: 'tropical-tcg-frontend'
    });
  }
  
  /**
   * Genera ambos tokens
   */
  generateTokens(user) {
    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      verified: user.canUseP2P()
    };
    
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ userId: user._id });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expire
    };
  }
  
  /**
   * Verifica un access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'tropical-tcg-api',
        audience: 'tropical-tcg-frontend'
      });
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }
  
  /**
   * Verifica un refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'tropical-tcg-api',
        audience: 'tropical-tcg-frontend'
      });
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }
  
  /**
   * Extrae el token del header Authorization
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('Header Authorization faltante');
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Formato de Authorization inválido. Use: Bearer <token>');
    }
    
    return parts[1];
  }
  
  /**
   * Genera un código de verificación numérico
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  /**
   * Genera un token temporal para verificación
   */
  generateVerificationToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn,
      issuer: 'tropical-tcg-api'
    });
  }
  
  /**
   * Verifica un token temporal
   */
  verifyVerificationToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'tropical-tcg-api'
      });
    } catch (error) {
      throw new Error('Token de verificación inválido o expirado');
    }
  }
  
  /**
   * Decodifica un token sin verificar (útil para debugging)
   */
  decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }
  
  /**
   * Obtiene información del usuario desde el token
   */
  getUserInfoFromToken(token) {
    try {
      const decoded = this.verifyAccessToken(token);
      return {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        verified: decoded.verified
      };
    } catch (error) {
      throw new Error('No se pudo extraer información del token');
    }
  }
  
  /**
   * Verifica si un token está próximo a expirar
   */
  isTokenNearExpiry(token, thresholdMinutes = 30) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded.exp) return false;
      
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const thresholdTime = thresholdMinutes * 60 * 1000;
      
      return (expiryTime - currentTime) < thresholdTime;
    } catch (error) {
      return true; // Si hay error, asumir que está expirado
    }
  }
}

// Instancia singleton
const jwtUtil = new JWTUtil();

module.exports = jwtUtil;