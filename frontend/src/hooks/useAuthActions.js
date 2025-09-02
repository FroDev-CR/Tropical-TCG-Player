// src/hooks/useAuthActions.js
// Migrado completamente al backend - usa AuthContext

import { useAuth } from '../contexts/AuthContext';

export const useAuthActions = () => {
  const { user, isAuthenticated } = useAuth();

  const requireAuth = (action, options = {}) => {
    const { 
      message = 'Debes iniciar sesión para realizar esta acción',
      onLogin = null 
    } = options;

    if (!isAuthenticated) {
      if (window.confirm(`${message}\n\n¿Deseas iniciar sesión ahora?`)) {
        if (onLogin) {
          onLogin();
        } else {
          // Trigger del modal de autenticación
          const event = new CustomEvent('showAuthModal');
          window.dispatchEvent(event);
        }
      }
      return false;
    }
    
    // Usuario autenticado, ejecutar acción
    if (typeof action === 'function') {
      action();
    }
    return true;
  };

  const protectedAction = (action, authMessage) => {
    return () => requireAuth(action, { message: authMessage });
  };

  return {
    user,
    isAuthenticated,
    requireAuth,
    protectedAction
  };
};