// src/contexts/AuthContext.js
// Contexto de autenticación que usa el backend Node.js

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import backendAPI from '../services/backendAPI';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        if (backendAPI.token) {
          // Verificar si el token es válido
          const response = await backendAPI.verifyToken();
          if (response.success) {
            setUser(response.user);
          } else {
            // Token inválido, intentar refresh si tenemos refresh token
            if (backendAPI.refreshToken) {
              try {
                await backendAPI.refresh();
                // Intentar verificar de nuevo con el nuevo token
                const retryResponse = await backendAPI.verifyToken();
                if (retryResponse.success) {
                  setUser(retryResponse.user);
                } else {
                  backendAPI.clearTokens();
                  setUser(null);
                }
              } catch (refreshError) {
                console.error('Token refresh failed on init:', refreshError);
                backendAPI.clearTokens();
                setUser(null);
              }
            } else {
              backendAPI.clearTokens();
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        // Si el error es 401 y tenemos refresh token, intentar refrescar
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          if (backendAPI.refreshToken) {
            try {
              await backendAPI.refresh();
              // Retry verification
              const retryResponse = await backendAPI.verifyToken();
              if (retryResponse.success) {
                setUser(retryResponse.user);
                return; // Exit early on success
              }
            } catch (refreshError) {
              console.error('Refresh attempt failed:', refreshError);
            }
          }
        }
        
        // Si llegamos aquí, limpiar todo
        backendAPI.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Función para registrar nuevo usuario
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await backendAPI.register(userData);
      
      if (response.success) {
        // Guardar tokens y usuario
        backendAPI.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
        setUser(response.user);
        setError(null);
        return { success: true, user: response.user };
      } else {
        setError(response.message || 'Error en el registro');
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Error registering:', error);
      const errorMessage = error.message || 'Error registrando usuario';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para iniciar sesión
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await backendAPI.login(email, password);
      
      if (response.success) {
        // Guardar tokens y usuario
        backendAPI.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
        setUser(response.user);
        setError(null);
        return { success: true, user: response.user };
      } else {
        setError(response.message || 'Credenciales inválidas');
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Error logging in:', error);
      const errorMessage = error.message || 'Error iniciando sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cerrar sesión
  const logout = useCallback(async () => {
    try {
      // Opcional: llamar al endpoint de logout del backend
      await backendAPI.logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // Limpiar estado local siempre
      backendAPI.clearTokens();
      setUser(null);
      setError(null);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user && !loading,
    register,
    login,
    logout,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const { user, loading } = useAuth();
  return { user, loading, isAuthenticated: !!user && !loading };
}

export default AuthContext;