// src/hooks/useP2PTransactions.js
// Hook personalizado para manejar transacciones P2P

import { useState, useEffect } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { useCart } from '../contexts/CartContext';

export function useP2PTransactions() {
  const {
    transactions,
    buyerTransactions,
    sellerTransactions,
    loading,
    unreadNotifications,
    getTransactionDetails,
    acceptTransaction,
    rejectTransaction,
    confirmDelivery,
    requestPayment,
    confirmPaymentReceived,
    confirmReceipt,
    submitRating,
    createDispute,
    markAsRead,
    getTransactionStatusText,
    getAvailableActions,
    requiresUrgentAttention,
    getTimeRemaining
  } = useTransactions();

  const {
    checkAtomicAvailability,
    createPendingTransaction,
    getCartByVendor
  } = useCart();

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // ===============================================
  // FUNCIONES DE TRANSACCIONES
  // ===============================================

  // Crear transacciones P2P para múltiples vendedores
  const createP2PTransactions = async (contactMethod = 'whatsapp', buyerNotes = '') => {
    setActionLoading(true);
    setError(null);

    try {
      const vendors = getCartByVendor();
      const results = [];

      for (const vendor of vendors) {
        try {
          const result = await createPendingTransaction(
            vendor.items,
            contactMethod,
            buyerNotes
          );
          results.push({
            vendorId: vendor.vendorId,
            vendorName: vendor.vendorName,
            success: true,
            transactionId: result.transactionId,
            data: result
          });
        } catch (error) {
          results.push({
            vendorId: vendor.vendorId,
            vendorName: vendor.vendorName,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Responder a una transacción como vendedor
  const handleSellerResponse = async (transactionId, action, responseData = {}) => {
    setActionLoading(true);
    setError(null);

    try {
      let result;
      if (action === 'accept') {
        result = await acceptTransaction(transactionId, responseData);
      } else if (action === 'reject') {
        result = await rejectTransaction(transactionId, responseData.reason || '');
      } else {
        throw new Error('Acción no válida');
      }

      await markAsRead(transactionId);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar entrega como vendedor
  const handleDeliveryConfirmation = async (transactionId, deliveryData) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await confirmDelivery(transactionId, deliveryData);
      await markAsRead(transactionId);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar pago recibido como vendedor
  const handlePaymentConfirmation = async (transactionId, paymentProof) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await confirmPaymentReceived(transactionId, paymentProof);
      await markAsRead(transactionId);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar recibo como comprador
  const handleReceiptConfirmation = async (transactionId, receiptData) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await confirmReceipt(transactionId, receiptData);
      await markAsRead(transactionId);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Enviar calificación
  const handleRatingSubmission = async (transactionId, ratingData) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await submitRating(transactionId, ratingData);
      await markAsRead(transactionId);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Crear disputa
  const handleDisputeCreation = async (transactionId, disputeData) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await createDispute(transactionId, disputeData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // ===============================================
  // FUNCIONES DE UTILIDAD
  // ===============================================

  // Obtener transacciones filtradas
  const getFilteredTransactions = (filters = {}) => {
    let filtered = [...transactions];

    if (filters.role) {
      filtered = filtered.filter(tx => tx.role === filters.role);
    }

    if (filters.status) {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    if (filters.urgent) {
      filtered = filtered.filter(tx => requiresUrgentAttention(tx));
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(tx => {
        const date = tx.createdAt?.toDate?.() || tx.createdAt;
        return date >= start && date <= end;
      });
    }

    return filtered;
  };

  // Obtener estadísticas del usuario
  const getUserStats = () => {
    const stats = {
      total: transactions.length,
      asBuyer: buyerTransactions.length,
      asSeller: sellerTransactions.length,
      completed: transactions.filter(tx => tx.status === 'completed').length,
      pending: transactions.filter(tx => !['completed', 'cancelled_by_seller', 'timeout_cancelled', 'disputed'].includes(tx.status)).length,
      urgent: transactions.filter(tx => requiresUrgentAttention(tx)).length
    };

    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0;

    return stats;
  };

  // Obtener próximas acciones requeridas
  const getUpcomingActions = () => {
    return transactions
      .filter(tx => getAvailableActions(tx).length > 0)
      .map(tx => ({
        transactionId: tx.id,
        cardName: tx.items?.[0]?.cardName || 'Producto',
        status: tx.status,
        statusText: getTransactionStatusText(tx),
        actions: getAvailableActions(tx),
        timeRemaining: getTimeRemaining(tx),
        urgent: requiresUrgentAttention(tx),
        role: tx.role,
        otherParty: tx.role === 'buyer' ? tx.sellerName : tx.buyerName
      }))
      .sort((a, b) => {
        // Ordenar por urgencia y luego por tiempo restante
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return a.timeRemaining - b.timeRemaining;
      });
  };

  // Formatear tiempo restante
  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Vencido';
    
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Validar datos de transacción
  const validateTransactionData = (type, data) => {
    const validations = {
      delivery: {
        required: ['originStore', 'proofImage'],
        optional: ['deliveryNotes']
      },
      payment: {
        required: ['method', 'amount'],
        optional: ['proofImage', 'notes']
      },
      receipt: {
        required: ['destinationStore'],
        optional: ['satisfactionLevel', 'receiptNotes']
      },
      rating: {
        required: ['rating'],
        optional: ['comment', 'categories']
      },
      dispute: {
        required: ['type', 'description'],
        optional: ['evidence', 'severity']
      }
    };

    const validation = validations[type];
    if (!validation) {
      throw new Error('Tipo de validación no soportado');
    }

    const missing = validation.required.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
    }

    return true;
  };

  // Limpiar errores
  const clearError = () => {
    setError(null);
  };

  return {
    // Estado
    transactions,
    buyerTransactions,
    sellerTransactions,
    loading,
    actionLoading,
    error,
    unreadNotifications,

    // Acciones principales
    createP2PTransactions,
    handleSellerResponse,
    handleDeliveryConfirmation,
    handlePaymentConfirmation,
    handleReceiptConfirmation,
    handleRatingSubmission,
    handleDisputeCreation,

    // Funciones de datos
    getTransactionDetails,
    getFilteredTransactions,
    getUserStats,
    getUpcomingActions,

    // Funciones de utilidad
    getTransactionStatusText,
    getAvailableActions,
    requiresUrgentAttention,
    getTimeRemaining,
    formatTimeRemaining,
    validateTransactionData,
    markAsRead,
    clearError,

    // Funciones del carrito P2P
    checkAtomicAvailability,
    getCartByVendor
  };
}