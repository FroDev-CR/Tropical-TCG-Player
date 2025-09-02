// src/services/NotificationService.js
// Servicio centralizado para manejo de notificaciones P2P

// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API

class NotificationService {
  constructor() {
    // Cloud Functions para notificaciones
    this.sendWhatsAppNotification = httpsCallable(/* functions */ null, 'sendWhatsAppNotification');
    this.sendEmailNotification = httpsCallable(/* functions */ null, 'sendEmailNotification');
    this.createInAppNotification = httpsCallable(/* functions */ null, 'createInAppNotification');
    this.sendBulkNotifications = httpsCallable(/* functions */ null, 'sendBulkNotifications');
    
    // Configuración desde variables de entorno
    this.config = {
      whatsappEnabled: process.env.REACT_APP_ENABLE_WHATSAPP_NOTIFICATIONS === 'true',
      emailEnabled: process.env.REACT_APP_ENABLE_EMAIL_NOTIFICATIONS === 'true',
      pushEnabled: process.env.REACT_APP_ENABLE_PUSH_NOTIFICATIONS === 'true',
      environment: process.env.REACT_APP_ENVIRONMENT || 'development',
      debugMode: process.env.REACT_APP_DEBUG_MODE === 'true'
    };
    
    console.log('🔔 NotificationService initialized:', this.config);
  }

  // ===============================================
  // NOTIFICACIONES DE TRANSACCIONES P2P
  // ===============================================

  // Enviar notificación de nueva compra al vendedor
  async notifyNewPurchase(transactionData) {
    try {
      const notification = {
        type: 'new_purchase',
        recipientId: transactionData.sellerId,
        recipientPhone: transactionData.sellerPhone,
        recipientEmail: transactionData.sellerEmail,
        data: {
          buyerName: transactionData.buyerName,
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          totalAmount: transactionData.totalAmount,
          itemCount: transactionData.items.length,
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/transaction/${transactionData.transactionId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando notificación de nueva compra:', error);
      throw error;
    }
  }

  // Notificar aceptación de compra al comprador
  async notifyPurchaseAccepted(transactionData) {
    try {
      const notification = {
        type: 'purchase_accepted',
        recipientId: transactionData.buyerId,
        recipientPhone: transactionData.buyerPhone,
        recipientEmail: transactionData.buyerEmail,
        data: {
          sellerName: transactionData.sellerName,
          sellerPhone: transactionData.sellerPhone,
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          originStore: transactionData.deliveryInfo?.originStore,
          estimatedDays: transactionData.deliveryInfo?.estimatedDeliveryDays || 3,
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/transaction/${transactionData.transactionId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando notificación de compra aceptada:', error);
      throw error;
    }
  }

  // Notificar rechazo de compra al comprador
  async notifyPurchaseRejected(transactionData) {
    try {
      const notification = {
        type: 'purchase_rejected',
        recipientId: transactionData.buyerId,
        recipientPhone: transactionData.buyerPhone,
        recipientEmail: transactionData.buyerEmail,
        data: {
          sellerName: transactionData.sellerName,
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          reason: transactionData.cancellationInfo?.reason || 'No especificado',
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/marketplace`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando notificación de compra rechazada:', error);
      throw error;
    }
  }

  // Notificar entrega confirmada al comprador
  async notifyDeliveryConfirmed(transactionData) {
    try {
      const notification = {
        type: 'delivery_confirmed',
        recipientId: transactionData.buyerId,
        recipientPhone: transactionData.buyerPhone,
        recipientEmail: transactionData.buyerEmail,
        data: {
          sellerName: transactionData.sellerName,
          sellerPhone: transactionData.sellerPhone,
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          originStore: transactionData.deliveryInfo?.originStore,
          totalAmount: transactionData.totalAmount,
          shippingCost: transactionData.shippingCost || 0,
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/transaction/${transactionData.transactionId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando notificación de entrega confirmada:', error);
      throw error;
    }
  }

  // Notificar pago confirmado al comprador
  async notifyPaymentConfirmed(transactionData) {
    try {
      const notification = {
        type: 'payment_confirmed',
        recipientId: transactionData.buyerId,
        recipientPhone: transactionData.buyerPhone,
        recipientEmail: transactionData.buyerEmail,
        data: {
          sellerName: transactionData.sellerName,
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          destinationStore: transactionData.deliveryInfo?.destinationStore,
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/transaction/${transactionData.transactionId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando notificación de pago confirmado:', error);
      throw error;
    }
  }

  // ===============================================
  // NOTIFICACIONES DE RECORDATORIO
  // ===============================================

  // Recordatorio de respuesta al vendedor (enviado a las 20 horas)
  async sendSellerResponseReminder(transactionData) {
    try {
      const notification = {
        type: 'seller_response_reminder',
        recipientId: transactionData.sellerId,
        recipientPhone: transactionData.sellerPhone,
        recipientEmail: transactionData.sellerEmail,
        data: {
          buyerName: transactionData.buyerName,
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          hoursLeft: 4, // Quedan 4 horas
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/transaction/${transactionData.transactionId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando recordatorio al vendedor:', error);
      throw error;
    }
  }

  // Recordatorio de entrega al vendedor (enviado 1 día antes del límite)
  async sendDeliveryReminder(transactionData) {
    try {
      const notification = {
        type: 'delivery_reminder',
        recipientId: transactionData.sellerId,
        recipientPhone: transactionData.sellerPhone,
        recipientEmail: transactionData.sellerEmail,
        data: {
          buyerName: transactionData.buyerName,
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          daysLeft: 1,
          originStore: transactionData.deliveryInfo?.originStore,
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/transaction/${transactionData.transactionId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando recordatorio de entrega:', error);
      throw error;
    }
  }

  // Recordatorio de calificación (enviado 5 días después de completar)
  async sendRatingReminder(transactionData, recipientRole) {
    try {
      const isForBuyer = recipientRole === 'buyer';
      const notification = {
        type: 'rating_reminder',
        recipientId: isForBuyer ? transactionData.buyerId : transactionData.sellerId,
        recipientPhone: isForBuyer ? transactionData.buyerPhone : transactionData.sellerPhone,
        recipientEmail: isForBuyer ? transactionData.buyerEmail : transactionData.sellerEmail,
        data: {
          targetName: isForBuyer ? transactionData.sellerName : transactionData.buyerName,
          targetRole: isForBuyer ? 'vendedor' : 'comprador',
          cardName: transactionData.items[0]?.cardName || 'Cartas múltiples',
          daysLeft: 2, // Quedan 2 días
          transactionId: transactionData.transactionId,
          appLink: `${process.env.REACT_APP_BASE_URL}/transaction/${transactionData.transactionId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando recordatorio de calificación:', error);
      throw error;
    }
  }

  // ===============================================
  // NOTIFICACIONES DE DISPUTA
  // ===============================================

  // Notificar nueva disputa a la otra parte
  async notifyDisputeCreated(disputeData) {
    try {
      const isReporterBuyer = disputeData.reporterId === disputeData.transactionData.buyerId;
      const notification = {
        type: 'dispute_created',
        recipientId: isReporterBuyer ? disputeData.transactionData.sellerId : disputeData.transactionData.buyerId,
        recipientPhone: isReporterBuyer ? disputeData.transactionData.sellerPhone : disputeData.transactionData.buyerPhone,
        recipientEmail: isReporterBuyer ? disputeData.transactionData.sellerEmail : disputeData.transactionData.buyerEmail,
        data: {
          reporterName: isReporterBuyer ? disputeData.transactionData.buyerName : disputeData.transactionData.sellerName,
          disputeType: disputeData.disputeType,
          cardName: disputeData.transactionData.items[0]?.cardName || 'Cartas múltiples',
          transactionId: disputeData.transactionId,
          disputeId: disputeData.disputeId,
          appLink: `${process.env.REACT_APP_BASE_URL}/dispute/${disputeData.disputeId}`
        }
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando notificación de disputa:', error);
      throw error;
    }
  }

  // ===============================================
  // FUNCIONES PRIVADAS
  // ===============================================

  // Enviar notificación a múltiples canales
  async _sendMultiChannelNotification(notification) {
    const results = {
      whatsapp: null,
      email: null,
      inApp: null,
      errors: []
    };

    try {
      // Crear notificación in-app (siempre)
      if (notification.recipientId) {
        try {
          const inAppResult = await this.createInAppNotification({
            ...notification,
            channels: ['in_app']
          });
          results.inApp = inAppResult.data;
        } catch (error) {
          results.errors.push({ channel: 'in_app', error: error.message });
        }
      }

      // Enviar WhatsApp si está habilitado y hay número
      if (this.config.whatsappEnabled && notification.recipientPhone) {
        try {
          const whatsappResult = await this.sendWhatsAppNotification({
            ...notification,
            channels: ['whatsapp']
          });
          results.whatsapp = whatsappResult.data;
        } catch (error) {
          results.errors.push({ channel: 'whatsapp', error: error.message });
        }
      }

      // Enviar email si está habilitado y hay email
      if (this.config.emailEnabled && notification.recipientEmail) {
        try {
          const emailResult = await this.sendEmailNotification({
            ...notification,
            channels: ['email']
          });
          results.email = emailResult.data;
        } catch (error) {
          results.errors.push({ channel: 'email', error: error.message });
        }
      }

      // Log en modo debug
      if (this.config.debugMode) {
        console.log('📱 Multi-channel notification sent:', {
          type: notification.type,
          recipient: notification.recipientId,
          results
        });
      }

      return results;
    } catch (error) {
      console.error('Error en notificación multi-canal:', error);
      throw error;
    }
  }

  // ===============================================
  // FUNCIONES PÚBLICAS ADICIONALES
  // ===============================================

  // Enviar notificación personalizada
  async sendCustomNotification(type, recipientData, messageData, channels = ['in_app']) {
    try {
      const notification = {
        type: type,
        recipientId: recipientData.userId,
        recipientPhone: recipientData.phone,
        recipientEmail: recipientData.email,
        data: messageData,
        channels
      };

      return await this._sendMultiChannelNotification(notification);
    } catch (error) {
      console.error('Error enviando notificación personalizada:', error);
      throw error;
    }
  }

  // Verificar estado del servicio
  getServiceStatus() {
    return {
      initialized: true,
      whatsappEnabled: this.config.whatsappEnabled,
      emailEnabled: this.config.emailEnabled,
      pushEnabled: this.config.pushEnabled,
      environment: this.config.environment,
      debugMode: this.config.debugMode
    };
  }

  // Configurar notificaciones de prueba (solo desarrollo)
  async sendTestNotification(type, recipientData) {
    if (this.config.environment !== 'development') {
      throw new Error('Las notificaciones de prueba solo están disponibles en desarrollo');
    }

    const testData = {
      new_purchase: {
        buyerName: 'Usuario de Prueba',
        cardName: 'Charizard (Prueba)',
        totalAmount: 5000,
        itemCount: 1,
        transactionId: 'test_12345',
        appLink: 'https://localhost:3000/transaction/test_12345'
      },
      purchase_accepted: {
        sellerName: 'Vendedor de Prueba',
        sellerPhone: '8888-8888',
        cardName: 'Pikachu (Prueba)',
        originStore: 'TCG Store San José Centro',
        estimatedDays: 3,
        transactionId: 'test_67890',
        appLink: 'https://localhost:3000/transaction/test_67890'
      }
    };

    return await this.sendCustomNotification(type, recipientData, testData[type] || {}, ['in_app', 'whatsapp', 'email']);
  }
}

// Instancia singleton
const notificationService = new NotificationService();

export default notificationService;
export { NotificationService };