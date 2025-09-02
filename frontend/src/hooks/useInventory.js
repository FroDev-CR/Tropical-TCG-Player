import { useState, useEffect } from 'react';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API

export const useInventory = () => {
  const [updating, setUpdating] = useState(false);

  // Función para reducir la cantidad disponible de un listing
  const reduceListingQuantity = async (listingId, quantityToReduce) => {
    setUpdating(true);
    try {
      const result = await runTransaction(/* db */ null, async (transaction) => {
        const listingRef = doc(/* db */ null, 'listings', listingId);
        const listingSnap = await transaction.get(listingRef);
        
        if (!listingSnap.exists()) {
          throw new Error('El listado no existe');
        }

        const listingData = listingSnap.data();
        const currentAvailable = listingData.availableQuantity || 0;
        
        if (currentAvailable < quantityToReduce) {
          throw new Error(`Solo hay ${currentAvailable} unidades disponibles`);
        }

        const newAvailable = currentAvailable - quantityToReduce;
        const newStatus = newAvailable === 0 ? 'sold_out' : 'active';
        
        transaction.update(listingRef, {
          availableQuantity: newAvailable,
          status: newStatus,
          updatedAt: new Date()
        });

        return { success: true, newAvailable, newStatus };
      });
      
      return result;
    } catch (error) {
      console.error('Error reduciendo cantidad del listado:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  // Función para restaurar la cantidad disponible (en caso de cancelación)
  const restoreListingQuantity = async (listingId, quantityToRestore) => {
    setUpdating(true);
    try {
      const result = await runTransaction(/* db */ null, async (transaction) => {
        const listingRef = doc(/* db */ null, 'listings', listingId);
        const listingSnap = await transaction.get(listingRef);
        
        if (!listingSnap.exists()) {
          throw new Error('El listado no existe');
        }

        const listingData = listingSnap.data();
        const currentAvailable = listingData.availableQuantity || 0;
        const originalQuantity = listingData.quantity || 0;
        
        const newAvailable = Math.min(currentAvailable + quantityToRestore, originalQuantity);
        const newStatus = newAvailable > 0 ? 'active' : 'sold_out';
        
        transaction.update(listingRef, {
          availableQuantity: newAvailable,
          status: newStatus,
          updatedAt: new Date()
        });

        return { success: true, newAvailable, newStatus };
      });
      
      return result;
    } catch (error) {
      console.error('Error restaurando cantidad del listado:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  // Función para verificar disponibilidad antes de agregar al carrito
  const checkAvailability = async (listingId, requestedQuantity = 1) => {
    try {
      const listingRef = doc(/* db */ null, 'listings', listingId);
      const listingSnap = await getDoc(listingRef);
      
      if (!listingSnap.exists()) {
        return { available: false, reason: 'El listado no existe' };
      }

      const listingData = listingSnap.data();
      const availableQuantity = listingData.availableQuantity || 0;
      const status = listingData.status || 'active';
      
      if (status === 'inactive') {
        return { available: false, reason: 'El listado está inactivo' };
      }
      
      if (status === 'sold_out' || availableQuantity === 0) {
        return { available: false, reason: 'Producto agotado' };
      }
      
      if (availableQuantity < requestedQuantity) {
        return { 
          available: false, 
          reason: `Solo hay ${availableQuantity} unidad${availableQuantity > 1 ? 'es' : ''} disponible${availableQuantity > 1 ? 's' : ''}`,
          availableQuantity 
        };
      }

      return { 
        available: true, 
        availableQuantity,
        status: listingData.status 
      };
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      return { available: false, reason: 'Error verificando disponibilidad' };
    }
  };

  // Función para marcar un listing como completamente vendido
  const markAsSoldOut = async (listingId) => {
    setUpdating(true);
    try {
      const listingRef = doc(/* db */ null, 'listings', listingId);
      await updateDoc(listingRef, {
        availableQuantity: 0,
        status: 'sold_out',
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marcando como agotado:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  // Función para reactivar un listing
  const reactivateListing = async (listingId, newQuantity) => {
    setUpdating(true);
    try {
      const listingRef = doc(/* db */ null, 'listings', listingId);
      await updateDoc(listingRef, {
        availableQuantity: newQuantity,
        quantity: newQuantity, // También actualizar la cantidad original
        status: 'active',
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error reactivando listing:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updating,
    reduceListingQuantity,
    restoreListingQuantity,
    checkAvailability,
    markAsSoldOut,
    reactivateListing
  };
};

export default useInventory;