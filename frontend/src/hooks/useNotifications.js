// src/hooks/useNotifications.js
// Hook personalizado para manejar notificaciones P2P

import { useState, useEffect } from 'react';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import notificationService from '../services/NotificationService';
import whatsAppService from '../services/WhatsAppService';
import emailService from '../services/EmailService';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Escuchar autenticación
  useEffect(() => {
    const unsubscribe = /* auth */ null.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(/* db */ null, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ===============================================
  // FUNCIONES DE NOTIFICACIONES
  // ===============================================

  // Marcar notificación como leída
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(/* db */ null, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(n => markAsRead(n.id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  };

  // Obtener notificaciones filtradas
  const getFilteredNotifications = (filters = {}) => {
    let filtered = [...notifications];

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.unread !== undefined) {
      filtered = filtered.filter(n => !n.read === filters.unread);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(n => {
        return n.createdAt >= start && n.createdAt <= end;
      });
    }

    if (filters.transactionId) {
      filtered = filtered.filter(n => n.transactionId === filters.transactionId);
    }

    return filtered;
  };

  // Obtener notificaciones por tipo
  const getNotificationsByType = () => {
    const byType = {};
    
    notifications.forEach(notification => {
      const type = notification.type;
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(notification);
    });

    return byType;
  };

  // Obtener estadísticas de notificaciones
  const getNotificationStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayNotifications = notifications.filter(n => n.createdAt >= today).length;
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);
    const weekNotifications = notifications.filter(n => n.createdAt >= thisWeek).length;

    const byType = getNotificationsByType();
    const typeStats = Object.keys(byType).map(type => ({
      type,
      count: byType[type].length,
      unread: byType[type].filter(n => !n.read).length
    }));

    return {
      total,
      unread,
      today: todayNotifications,
      thisWeek: weekNotifications,
      byType: typeStats
    };
  };

  // ===============================================
  // FUNCIONES DE SERVICIOS DE NOTIFICACIÓN
  // ===============================================

  // Obtener estado de servicios
  const getServicesStatus = () => {
    return {
      notification: notificationService.getServiceStatus(),
      whatsapp: whatsAppService.getStatus(),
      email: emailService.getStatus()
    };
  };

  // Enviar notificación de prueba
  const sendTestNotification = async (type = 'new_purchase', channels = ['in_app']) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const testRecipientData = {
        userId: user.uid,
        phone: '8888-8888', // Número de prueba
        email: user.email
      };

      const testMessageData = {
        buyerName: 'Usuario de Prueba',
        cardName: 'Charizard Base Set (Prueba)',
        totalAmount: 15000,
        itemCount: 1,
        transactionId: 'test_' + Date.now(),
        appLink: `${process.env.REACT_APP_BASE_URL}/transaction/test`
      };

      return await notificationService.sendCustomNotification(
        type,
        testRecipientData,
        testMessageData,
        channels
      );
    } catch (error) {
      console.error('Error enviando notificación de prueba:', error);
      throw error;
    }
  };

  // ===============================================
  // FUNCIONES DE UTILIDAD
  // ===============================================

  // Formatear notificación para mostrar
  const formatNotificationForDisplay = (notification) => {
    const typeLabels = {
      'new_purchase': {
        title: '🎯 Nueva compra',
        icon: '🛒',
        color: 'primary'
      },
      'purchase_accepted': {
        title: '✅ Compra aceptada',
        icon: '✅',
        color: 'success'
      },
      'purchase_rejected': {
        title: '❌ Compra rechazada',
        icon: '❌',
        color: 'danger'
      },
      'delivery_confirmed': {
        title: '📦 Entrega confirmada',
        icon: '📦',
        color: 'info'
      },
      'payment_confirmed': {
        title: '💰 Pago confirmado',
        icon: '💰',
        color: 'success'
      },
      'seller_response_reminder': {
        title: '⏰ Recordatorio',
        icon: '⏰',
        color: 'warning'
      },
      'delivery_reminder': {
        title: '📦 Recordatorio entrega',
        icon: '📦',
        color: 'warning'
      },
      'rating_reminder': {
        title: '⭐ Calificar experiencia',
        icon: '⭐',
        color: 'warning'
      },
      'dispute_created': {
        title: '🚨 Nueva disputa',
        icon: '🚨',
        color: 'danger'
      }
    };

    const typeInfo = typeLabels[notification.type] || {
      title: notification.type,
      icon: '🔔',
      color: 'secondary'
    };

    return {
      ...notification,
      displayTitle: typeInfo.title,
      displayIcon: typeInfo.icon,
      displayColor: typeInfo.color,
      timeAgo: formatTimeAgo(notification.createdAt),
      isRecent: isRecentNotification(notification.createdAt)
    };
  };

  // Formatear tiempo transcurrido
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Ahora';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays}d`;
    } else {
      return date.toLocaleDateString('es-CR');
    }
  };

  // Verificar si es una notificación reciente (menos de 1 hora)
  const isRecentNotification = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes < 60;
  };

  // Obtener notificaciones recientes (últimas 24 horas)
  const getRecentNotifications = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return notifications.filter(n => n.createdAt >= yesterday);
  };

  // Obtener notificaciones urgentes
  const getUrgentNotifications = () => {
    const urgentTypes = [
      'new_purchase',
      'seller_response_reminder',
      'delivery_reminder',
      'dispute_created'
    ];
    
    return notifications.filter(n => 
      !n.read && urgentTypes.includes(n.type)
    );
  };

  // Agrupar notificaciones por fecha
  const getNotificationsByDate = () => {
    const groups = {};
    
    notifications.forEach(notification => {
      const dateKey = notification.createdAt.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });

    return groups;
  };

  return {
    // Estado
    notifications,
    unreadCount,
    loading,
    user,

    // Funciones principales
    markAsRead,
    markAllAsRead,
    getFilteredNotifications,
    getNotificationsByType,
    getNotificationStats,

    // Servicios
    getServicesStatus,
    sendTestNotification,

    // Utilidades
    formatNotificationForDisplay,
    formatTimeAgo,
    isRecentNotification,
    getRecentNotifications,
    getUrgentNotifications,
    getNotificationsByDate
  };
}