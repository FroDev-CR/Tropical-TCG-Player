// Backend API Service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class BackendAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Set tokens after login
  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Clear tokens on logout
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get auth headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Refresh access token using refresh token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Server offline or returned non-JSON
        this.clearTokens();
        throw new Error('Server connection failed during token refresh');
      }

      if (response.ok && data.success) {
        // Update tokens
        this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        return data.tokens.accessToken;
      } else {
        // Refresh token is invalid, clear all tokens
        this.clearTokens();
        throw new Error('Refresh token invalid');
      }
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  // Generic API request method with automatic token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      let response = await fetch(url, config);
      
      // Parse JSON safely
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON (server offline, HTML error page, etc.)
        throw new Error(`Server connection failed or invalid response`);
      }

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh')) {
        try {
          // Try to refresh the token
          await this.refreshAccessToken();
          
          // Retry the original request with new token
          config.headers = this.getAuthHeaders();
          response = await fetch(url, config);
          
          // Parse JSON safely on retry
          try {
            data = await response.json();
          } catch (jsonError) {
            throw new Error(`Server connection failed on retry`);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, throw the original 401 error
          throw new Error(data?.message || 'Authentication failed');
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // PUT request
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ========== AUTHENTICATION ENDPOINTS ==========

  async register(userData) {
    const response = await this.post('/api/v1/auth/register', userData);
    if (response.success && response.tokens) {
      this.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    }
    return response;
  }

  async login(email, password) {
    const response = await this.post('/api/v1/auth/login', { email, password });
    if (response.success && response.tokens) {
      this.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    }
    return response;
  }

  async verifyToken() {
    return this.get('/api/v1/auth/verify');
  }

  async logout() {
    try {
      // Intentar hacer logout en el servidor, pero no es crítico
      await this.post('/api/v1/auth/logout');
    } catch (error) {
      // Si el servidor no está disponible, solo limpiar tokens localmente
      console.warn('Server logout failed (server may be offline):', error.message);
    } finally {
      // Siempre limpiar tokens localmente, independientemente del servidor
      this.clearTokens();
    }
  }

  async refresh() {
    return this.refreshAccessToken();
  }

  // ========== USER ENDPOINTS ==========

  async getProfile() {
    return this.get('/api/v1/users/profile');
  }

  async updateProfile(userData) {
    return this.put('/api/v1/users/profile', userData);
  }

  async getUserListings() {
    return this.get('/api/v1/users/listings');
  }

  // ========== LISTING ENDPOINTS ==========

  async getListings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/listings${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getListing(id) {
    return this.get(`/api/v1/listings/${id}`);
  }

  async createListing(listingData) {
    return this.post('/api/v1/listings', listingData);
  }

  async updateListing(id, listingData) {
    return this.put(`/api/v1/listings/${id}`, listingData);
  }

  // ========== BINDER ENDPOINTS ==========

  async getBinders() {
    return this.get('/api/v1/binders');
  }

  async getBinder(id) {
    return this.get(`/api/v1/binders/${id}`);
  }

  async createBinder(binderData) {
    return this.post('/api/v1/binders', binderData);
  }

  async updateBinder(id, binderData) {
    return this.put(`/api/v1/binders/${id}`, binderData);
  }

  async addCardToBinder(binderId, cardData) {
    return this.post(`/api/v1/binders/${binderId}/cards`, cardData);
  }

  // ========== TRANSACTION ENDPOINTS ==========

  async getTransactions() {
    return this.get('/api/v1/transactions');
  }

  async createTransaction(transactionData) {
    return this.post('/api/v1/transactions', transactionData);
  }

  async acceptTransaction(id, originStore) {
    return this.put(`/api/v1/transactions/${id}/accept`, { originStore });
  }

  // ========== DASHBOARD ENDPOINTS ==========

  async getDashboardStats() {
    return this.get('/api/v1/stats/dashboard');
  }

  // ========== HEALTH CHECK ==========

  async healthCheck() {
    return this.get('/health');
  }
}

// Create and export a singleton instance
const backendAPI = new BackendAPI();
export default backendAPI;