// src/contexts/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AuthProvider debe estar disponible siempre
  const { user, isAuthenticated } = useAuth();

  // Cargar carrito cuando el usuario cambie
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCart();
    } else {
      // Usuario no autenticado, carrito vacío
      setCart([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadUserCart = async () => {
    setLoading(true);
    try {
      // Por ahora usamos localStorage, luego se puede implementar endpoint de carrito
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
      setCart([]);
    }
    setLoading(false);
  };

  const saveCart = (newCart) => {
    if (user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart));
    }
  };

  // Función para agregar al carrito
  const addToCart = async (listing, requestedQuantity = 1) => {
    try {
      console.log('🛒 Intentando agregar al carrito:', listing?.cardName, 'ID:', listing?.id || listing?.listingId, 'Cantidad:', requestedQuantity);
      
      // Normalizar el ID del listing
      const listingId = listing.id || listing.listingId;
      
      if (!listing || !listingId) {
        console.error('❌ Listing inválido:', listing);
        alert('No se puede agregar al carrito: Datos de carta inválidos');
        return false;
      }
      
      // Verificar disponibilidad
      const availability = await checkListingAvailability(listingId, requestedQuantity);
      
      if (!availability.available) {
        console.log('❌ No disponible:', availability.reason);
        alert(`No se puede agregar al carrito: ${availability.reason}`);
        return false;
      }

      // Verificar si ya está en el carrito
      let existingItemIndex = -1;
      if (!Array.isArray(cart)) {
        console.error('❌ Carrito no es un array:', cart);
        setCart([]);
      } else {
        existingItemIndex = cart.findIndex(item => item && (item.id === listingId || item.listingId === listingId));
      }
      
      let newCart;
      
      if (existingItemIndex >= 0) {
        // Si ya existe, verificar si la nueva cantidad total no excede la disponible
        const currentQuantityInCart = cart[existingItemIndex].quantity || 1;
        const totalQuantity = currentQuantityInCart + requestedQuantity;
        
        if (totalQuantity > availability.availableQuantity) {
          alert(`Solo puedes agregar ${availability.availableQuantity - currentQuantityInCart} unidades más de esta carta`);
          return false;
        }
        
        newCart = [...cart];
        newCart[existingItemIndex].quantity = totalQuantity;
      } else {
        // Agregar nuevo item
        const cartItem = {
          id: listingId,
          listingId: listingId,
          cardId: listing.cardId || listing.id,
          cardName: listing.cardName || listing.name,
          cardImage: listing.cardImage || listing.images?.small,
          price: listing.price,
          condition: listing.condition,
          quantity: requestedQuantity,
          sellerId: listing.sellerId?._id || listing.sellerId,
          sellerName: listing.sellerId?.username || listing.sellerName,
          userPhone: listing.sellerId?.phone || listing.userPhone,
          setName: listing.setName,
          rarity: listing.rarity,
          tcgType: listing.tcgType,
          maxQuantity: availability.availableQuantity
        };
        
        newCart = [...cart, cartItem];
      }
      
      setCart(newCart);
      saveCart(newCart);
      
      console.log('✅ Agregado al carrito exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      alert('Error agregando al carrito. Inténtalo de nuevo.');
      return false;
    }
  };

  // Función para remover del carrito
  const removeFromCart = async (listingId) => {
    try {
      const newCart = cart.filter(item => 
        item.id !== listingId && item.listingId !== listingId
      );
      setCart(newCart);
      saveCart(newCart);
      return true;
    } catch (error) {
      console.error('Error removiendo del carrito:', error);
      return false;
    }
  };

  // Función para limpiar carrito
  const clearCart = async () => {
    try {
      setCart([]);
      saveCart([]);
      return true;
    } catch (error) {
      console.error('Error limpiando carrito:', error);
      return false;
    }
  };

  // Función para actualizar cantidad
  const updateCartItemQuantity = async (listingId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        return await removeFromCart(listingId);
      }
      
      const newCart = cart.map(item => {
        if (item.id === listingId || item.listingId === listingId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      setCart(newCart);
      saveCart(newCart);
      return true;
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      return false;
    }
  };

  // Función para verificar disponibilidad
  const checkListingAvailability = async (listingId, requestedQuantity = 1) => {
    try {
      console.log('🔍 Verificando disponibilidad para listing:', listingId, 'cantidad:', requestedQuantity);
      
      const response = await apiClient.get(`/api/v1/listings/${listingId}`);
      
      if (!response.data.success) {
        console.log('❌ Listing no existe:', listingId);
        return { available: false, reason: 'El listado no existe' };
      }

      const listingData = response.data.listing;
      console.log('📦 Datos del listing:', listingData);
      
      const availableQuantity = listingData.availableQuantity || listingData.quantity || 0;
      const status = listingData.status || 'active';
      
      console.log('📊 Estado:', status, 'Disponible:', availableQuantity, 'Solicitado:', requestedQuantity);
      
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
        listing: listingData 
      };
      
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      return { 
        available: false, 
        reason: 'Error verificando disponibilidad' 
      };
    }
  };

  // Funciones de cálculo
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  // Obtener items del carrito agrupados por vendedor
  const getCartByVendor = () => {
    const vendors = {};
    
    cart.forEach(item => {
      const vendorId = item.sellerId;
      if (!vendors[vendorId]) {
        vendors[vendorId] = {
          vendorId,
          vendorName: item.sellerName,
          items: [],
          totalAmount: 0
        };
      }
      vendors[vendorId].items.push(item);
      vendors[vendorId].totalAmount += item.price * (item.quantity || 1);
    });
    
    return vendors;
  };

  const value = {
    cart,
    loading,
    user,
    addToCart,
    removeFromCart,
    clearCart,
    updateCartItemQuantity,
    checkListingAvailability,
    getTotalItems,
    getTotalPrice,
    getCartByVendor
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;