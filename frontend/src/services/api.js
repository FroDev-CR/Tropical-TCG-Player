// src/services/api.js
// Cliente API REST para comunicarse con el backend Node.js
// Reemplaza toda la funcionalidad de Firebase

import axios from 'axios';

class APIClient {
  constructor() {
    // URL base del backend Node.js
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
    
    // Crear instancia de axios con configuración base
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000, // 10 segundos timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token automáticamente
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar respuestas y errores globalmente
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si el token expiró, intentar renovarlo
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const newToken = this.getStoredToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Si el refresh falla, limpiar tokens y redirigir al login
            this.clearTokens();
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ===================
  // GESTIÓN DE TOKENS
  // ===================

  getStoredToken() {
    return localStorage.getItem('tropical_tcg_token');
  }

  getStoredRefreshToken() {
    return localStorage.getItem('tropical_tcg_refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('tropical_tcg_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('tropical_tcg_refresh_token', refreshToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('tropical_tcg_token');
    localStorage.removeItem('tropical_tcg_refresh_token');
  }

  async refreshToken() {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${this.baseURL}/auth/refresh-token`, {
      refreshToken
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
    this.setTokens(accessToken, newRefreshToken);

    return response.data;
  }

  // ===================
  // AUTENTICACIÓN
  // ===================

  async register(userData) {
    try {
      const response = await this.client.post('/auth/register', userData);
      
      if (response.data.success && response.data.tokens) {
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', {
        email,
        password
      });
      
      if (response.data.success && response.data.tokens) {
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (refreshToken) {
        await this.client.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  async verifyToken() {
    try {
      const response = await this.client.get('/auth/verify-token');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.client.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===================
  // USUARIOS
  // ===================

  async getProfile() {
    try {
      const response = await this.client.get('/users/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.client.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateSettings(settings) {
    try {
      const response = await this.client.put('/users/settings', settings);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserStats() {
    try {
      const response = await this.client.get('/users/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchUsers(params = {}) {
    try {
      const response = await this.client.get('/users/search', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPublicProfile(userId) {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async toggleRecommendation(userId) {
    try {
      const response = await this.client.post(`/users/${userId}/recommend`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await this.client.post('/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteProfilePicture() {
    try {
      const response = await this.client.delete('/users/profile/picture');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===================
  // LISTINGS
  // ===================

  async getListings(params = {}) {
    try {
      const response = await this.client.get('/listings', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getListing(listingId) {
    try {
      const response = await this.client.get(`/listings/${listingId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMyListings(params = {}) {
    try {
      const response = await this.client.get('/listings/my/listings', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createListing(listingData) {
    try {
      const response = await this.client.post('/listings', listingData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateListing(listingId, updates) {
    try {
      const response = await this.client.put(`/listings/${listingId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteListing(listingId) {
    try {
      const response = await this.client.delete(`/listings/${listingId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTCGStats() {
    try {
      const response = await this.client.get('/listings/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===================
  // UTILIDADES
  // ===================

  handleError(error) {
    console.error('API Error:', error);

    // Si es un error de red
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        error: 'Error de conexión',
        message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR'
      };
    }

    // Si el servidor respondió con un error
    if (error.response) {
      const { status, data } = error.response;
      
      // Errores HTTP específicos
      if (status >= 500) {
        return {
          error: 'Error del servidor',
          message: 'Error interno del servidor. Intenta de nuevo más tarde.',
          code: 'SERVER_ERROR',
          status
        };
      }

      // Errores de cliente (400-499)
      return {
        error: data.error || 'Error de solicitud',
        message: data.message || 'Error procesando la solicitud',
        details: data.details,
        code: 'CLIENT_ERROR',
        status
      };
    }

    // Error genérico
    return {
      error: 'Error desconocido',
      message: error.message || 'Ocurrió un error inesperado',
      code: 'UNKNOWN_ERROR'
    };
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.getStoredToken();
  }

  // Obtener información del usuario desde el token (decodificado básico)
  getCurrentUser() {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      // Decodificar el payload del JWT (sin verificación de firma)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      // Verificar si el token no ha expirado
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }

      return {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        verified: payload.verified
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}

// Instancia singleton del cliente API
const apiClient = new APIClient();

export default apiClient;