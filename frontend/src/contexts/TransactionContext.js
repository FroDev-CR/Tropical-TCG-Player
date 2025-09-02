// src/contexts/TransactionContext.js
// Context específico para manejo de transacciones P2P - MIGRADO A BACKEND

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import backendAPI from '../services/backendAPI';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [buyerTransactions, setBuyerTransactions] = useState([]);
  const [sellerTransactions, setSellerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Cargar transacciones cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setBuyerTransactions([]);
      setSellerTransactions([]);
      setUnreadNotifications(0);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await backendAPI.getTransactions();
      
      if (response.success) {
        const allTransactions = (response.data?.transactions || []).map(t => ({
          ...t,
          id: t._id,
          createdAt: new Date(t.timeline?.created || t.createdAt),
          type: t.buyer.userId === user._id ? 'buyer' : 'seller'
        }));
        
        const buyer = allTransactions.filter(t => t.type === 'buyer');
        const seller = allTransactions.filter(t => t.type === 'seller');
        
        setTransactions(allTransactions);
        setBuyerTransactions(buyer);
        setSellerTransactions(seller);
        
        // TODO: Implementar conteo de notificaciones no leídas
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
    setLoading(false);
  };

  // Función para crear una nueva transacción
  const createTransaction = async (transactionData) => {
    try {
      const response = await backendAPI.createTransaction(transactionData);
      
      if (response.success) {
        await fetchTransactions(); // Refrescar la lista
        return { success: true, transaction: response.transaction };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { success: false, error: error.message };
    }
  };

  // Función para aceptar una transacción (vendedor)
  const acceptTransaction = async (transactionId, originStore) => {
    try {
      const response = await backendAPI.acceptTransaction(transactionId, originStore);
      
      if (response.success) {
        await fetchTransactions(); // Refrescar la lista
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Error accepting transaction:', error);
      return { success: false, error: error.message };
    }
  };

  // TODO: Implementar más funciones de transacción según se necesiten
  const rejectTransaction = async (transactionId, reason) => {
    try {
      // TODO: Implementar endpoint en backend
      console.log('Reject transaction:', transactionId, reason);
      return { success: false, error: 'Funcionalidad pendiente de implementar' };
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      return { success: false, error: error.message };
    }
  };

  const confirmDelivery = async (transactionId, proofData) => {
    try {
      // TODO: Implementar endpoint en backend
      console.log('Confirm delivery:', transactionId, proofData);
      return { success: false, error: 'Funcionalidad pendiente de implementar' };
    } catch (error) {
      console.error('Error confirming delivery:', error);
      return { success: false, error: error.message };
    }
  };

  const confirmPayment = async (transactionId, proofData) => {
    try {
      // TODO: Implementar endpoint en backend
      console.log('Confirm payment:', transactionId, proofData);
      return { success: false, error: 'Funcionalidad pendiente de implementar' };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: error.message };
    }
  };

  const addRating = async (transactionId, rating, comment) => {
    try {
      // TODO: Implementar endpoint en backend
      console.log('Add rating:', transactionId, rating, comment);
      return { success: false, error: 'Funcionalidad pendiente de implementar' };
    } catch (error) {
      console.error('Error adding rating:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    // Estado
    user,
    transactions,
    buyerTransactions,
    sellerTransactions,
    loading,
    unreadNotifications,
    
    // Funciones
    fetchTransactions,
    createTransaction,
    acceptTransaction,
    rejectTransaction,
    confirmDelivery,
    confirmPayment,
    addRating,
    
    // Utilidades
    refreshTransactions: fetchTransactions
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}

export default TransactionContext;