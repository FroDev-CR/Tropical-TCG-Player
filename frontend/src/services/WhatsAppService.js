// src/services/WhatsAppService.js
// Servicio especializado para notificaciones WhatsApp Business

class WhatsAppService {
  constructor() {
    this.config = {
      apiUrl: process.env.REACT_APP_WHATSAPP_API_URL,
      accessToken: process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN,
      phoneId: process.env.REACT_APP_WHATSAPP_PHONE_ID,
      enabled: process.env.REACT_APP_ENABLE_WHATSAPP_NOTIFICATIONS === 'true'
    };

    console.log('📱 WhatsAppService initialized:', { 
      enabled: this.config.enabled,
      hasConfig: !!(this.config.apiUrl && this.config.accessToken && this.config.phoneId)
    });
  }

  // ===============================================
  // TEMPLATES DE MENSAJES P2P
  // ===============================================

  // Template para nueva compra (al vendedor)
  _getNewPurchaseMessage(data) {
    const { buyerName, cardName, totalAmount, itemCount, appLink } = data;
    const itemText = itemCount > 1 ? `${itemCount} cartas` : cardName;
    
    return {
      template: 'nueva_compra', // Template ID en WhatsApp Business
      fallbackMessage: `🎯 *Nueva compra en Tropical TCG*\n\n` +
        `👤 Comprador: ${buyerName}\n` +
        `📦 Producto: ${itemText}\n` +
        `💰 Total: ₡${totalAmount.toLocaleString()}\n\n` +
        `⏰ Tienes 24 horas para responder.\n` +
        `📱 Ver detalles: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [buyerName, itemText, totalAmount, appLink]
    };
  }

  // Template para compra aceptada (al comprador)
  _getPurchaseAcceptedMessage(data) {
    const { sellerName, sellerPhone, cardName, originStore, estimatedDays, appLink } = data;
    
    return {
      template: 'compra_aceptada',
      fallbackMessage: `✅ *Tu compra fue aceptada*\n\n` +
        `👤 Vendedor: ${sellerName}\n` +
        `📱 Contacto: ${sellerPhone}\n` +
        `📦 Producto: ${cardName}\n` +
        `🏪 Tienda origen: ${originStore}\n` +
        `📅 Entrega estimada: ${estimatedDays} días\n\n` +
        `El vendedor coordinará la entrega contigo.\n` +
        `📱 Ver detalles: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [sellerName, sellerPhone, cardName, originStore, estimatedDays, appLink]
    };
  }

  // Template para compra rechazada (al comprador)
  _getPurchaseRejectedMessage(data) {
    const { sellerName, cardName, reason, appLink } = data;
    
    return {
      template: 'compra_rechazada',
      fallbackMessage: `❌ *Tu compra fue rechazada*\n\n` +
        `👤 Vendedor: ${sellerName}\n` +
        `📦 Producto: ${cardName}\n` +
        `📝 Motivo: ${reason}\n\n` +
        `Tu dinero no fue cobrado. Puedes buscar el producto con otros vendedores.\n` +
        `📱 Buscar alternativas: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [sellerName, cardName, reason, appLink]
    };
  }

  // Template para entrega confirmada (al comprador)
  _getDeliveryConfirmedMessage(data) {
    const { sellerName, sellerPhone, cardName, originStore, totalAmount, shippingCost, appLink } = data;
    const finalAmount = totalAmount + shippingCost;
    
    return {
      template: 'entrega_confirmada',
      fallbackMessage: `📦 *Entrega confirmada - Procede con el pago*\n\n` +
        `👤 Vendedor: ${sellerName}\n` +
        `📱 Contacto: ${sellerPhone}\n` +
        `📦 Producto: ${cardName}\n` +
        `🏪 Entregado en: ${originStore}\n` +
        `💰 Total a pagar: ₡${finalAmount.toLocaleString()}\n` +
        `${shippingCost > 0 ? `📮 Incluye envío: ₡${shippingCost}` : '📮 Envío gratis'}\n\n` +
        `Por favor realiza el pago acordado con el vendedor.\n` +
        `📱 Ver detalles: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [sellerName, sellerPhone, cardName, originStore, finalAmount, appLink]
    };
  }

  // Template para pago confirmado (al comprador)
  _getPaymentConfirmedMessage(data) {
    const { sellerName, cardName, destinationStore, appLink } = data;
    
    return {
      template: 'pago_confirmado',
      fallbackMessage: `💰 *Pago confirmado - Recoge tu producto*\n\n` +
        `👤 Vendedor: ${sellerName}\n` +
        `📦 Producto: ${cardName}\n` +
        `🏪 Recoger en: ${destinationStore}\n\n` +
        `Tu producto está listo para recoger. Presenta tu cédula en la tienda.\n` +
        `📱 Ver detalles: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [sellerName, cardName, destinationStore, appLink]
    };
  }

  // Template para recordatorio de respuesta (al vendedor)
  _getSellerReminderMessage(data) {
    const { buyerName, cardName, hoursLeft, appLink } = data;
    
    return {
      template: 'recordatorio_vendedor',
      fallbackMessage: `⏰ *Recordatorio - Respuesta pendiente*\n\n` +
        `👤 Comprador: ${buyerName}\n` +
        `📦 Producto: ${cardName}\n` +
        `⏰ Tiempo restante: ${hoursLeft} horas\n\n` +
        `Por favor responde antes de que expire el tiempo.\n` +
        `📱 Responder: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [buyerName, cardName, hoursLeft, appLink]
    };
  }

  // Template para recordatorio de entrega (al vendedor)
  _getDeliveryReminderMessage(data) {
    const { buyerName, cardName, daysLeft, originStore, appLink } = data;
    
    return {
      template: 'recordatorio_entrega',
      fallbackMessage: `📦 *Recordatorio de entrega*\n\n` +
        `👤 Comprador: ${buyerName}\n` +
        `📦 Producto: ${cardName}\n` +
        `⏰ Tiempo restante: ${daysLeft} día${daysLeft > 1 ? 's' : ''}\n` +
        `🏪 Entregar en: ${originStore}\n\n` +
        `Por favor entrega el producto antes del límite.\n` +
        `📱 Confirmar entrega: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [buyerName, cardName, daysLeft, originStore, appLink]
    };
  }

  // Template para recordatorio de calificación
  _getRatingReminderMessage(data) {
    const { targetName, targetRole, cardName, daysLeft, appLink } = data;
    
    return {
      template: 'recordatorio_calificacion',
      fallbackMessage: `⭐ *Recordatorio - Califica tu experiencia*\n\n` +
        `👤 ${targetRole}: ${targetName}\n` +
        `📦 Producto: ${cardName}\n` +
        `⏰ Tiempo restante: ${daysLeft} días\n\n` +
        `Tu calificación ayuda a mejorar la comunidad.\n` +
        `📱 Calificar ahora: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [targetName, targetRole, cardName, daysLeft, appLink]
    };
  }

  // Template para disputa creada
  _getDisputeCreatedMessage(data) {
    const { reporterName, disputeType, cardName, appLink } = data;
    
    const disputeTypes = {
      'not_received': 'Producto no recibido',
      'wrong_item': 'Producto incorrecto',
      'payment_issue': 'Problema de pago',
      'communication': 'Problema de comunicación'
    };
    
    return {
      template: 'disputa_creada',
      fallbackMessage: `🚨 *Nueva disputa reportada*\n\n` +
        `👤 Reportado por: ${reporterName}\n` +
        `📦 Producto: ${cardName}\n` +
        `📝 Tipo: ${disputeTypes[disputeType] || disputeType}\n\n` +
        `Por favor revisa los detalles y responde apropiadamente.\n` +
        `📱 Ver disputa: ${appLink}\n\n` +
        `_Tropical TCG Players_`,
      parameters: [reporterName, cardName, disputeTypes[disputeType] || disputeType, appLink]
    };
  }

  // ===============================================
  // FUNCIONES PRINCIPALES
  // ===============================================

  // Enviar mensaje según el tipo de notificación
  async sendNotification(type, recipientPhone, data) {
    if (!this.config.enabled) {
      console.log('📱 WhatsApp notifications disabled');
      return { success: false, reason: 'WhatsApp notifications disabled' };
    }

    if (!this.config.apiUrl || !this.config.accessToken || !this.config.phoneId) {
      console.error('📱 WhatsApp configuration incomplete');
      return { success: false, reason: 'WhatsApp configuration incomplete' };
    }

    try {
      // Obtener el mensaje según el tipo
      let messageData;
      switch (type) {
        case 'new_purchase':
          messageData = this._getNewPurchaseMessage(data);
          break;
        case 'purchase_accepted':
          messageData = this._getPurchaseAcceptedMessage(data);
          break;
        case 'purchase_rejected':
          messageData = this._getPurchaseRejectedMessage(data);
          break;
        case 'delivery_confirmed':
          messageData = this._getDeliveryConfirmedMessage(data);
          break;
        case 'payment_confirmed':
          messageData = this._getPaymentConfirmedMessage(data);
          break;
        case 'seller_response_reminder':
          messageData = this._getSellerReminderMessage(data);
          break;
        case 'delivery_reminder':
          messageData = this._getDeliveryReminderMessage(data);
          break;
        case 'rating_reminder':
          messageData = this._getRatingReminderMessage(data);
          break;
        case 'dispute_created':
          messageData = this._getDisputeCreatedMessage(data);
          break;
        default:
          throw new Error(`Tipo de notificación no soportado: ${type}`);
      }

      // Formatear el número de teléfono
      const formattedPhone = this._formatPhoneNumber(recipientPhone);
      
      // Enviar mensaje
      return await this._sendMessage(formattedPhone, messageData);
      
    } catch (error) {
      console.error('Error enviando notificación WhatsApp:', error);
      throw error;
    }
  }

  // ===============================================
  // FUNCIONES PRIVADAS
  // ===============================================

  // Formatear número de teléfono para WhatsApp Business API
  _formatPhoneNumber(phone) {
    // Remover caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Si no tiene código de país, agregar código de Costa Rica (506)
    if (cleaned.length === 8) {
      cleaned = '506' + cleaned;
    }
    
    return cleaned;
  }

  // Enviar mensaje via WhatsApp Business API
  async _sendMessage(phone, messageData) {
    try {
      const url = `${this.config.apiUrl}${this.config.phoneId}/messages`;
      
      // Primero intentar con template, si falla usar mensaje de texto
      let payload = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: messageData.template,
          language: { code: 'es' },
          components: [{
            type: 'body',
            parameters: messageData.parameters.map(param => ({
              type: 'text',
              text: String(param)
            }))
          }]
        }
      };

      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result = await response.json();

      // Si el template falla, intentar con mensaje de texto
      if (!response.ok && messageData.fallbackMessage) {
        console.log('📱 Template failed, trying fallback message');
        
        payload = {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: {
            body: messageData.fallbackMessage
          }
        };

        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        result = await response.json();
      }

      if (response.ok) {
        console.log('📱 WhatsApp message sent successfully:', result.messages?.[0]?.id);
        return {
          success: true,
          messageId: result.messages?.[0]?.id,
          phone: phone
        };
      } else {
        console.error('📱 WhatsApp API error:', result);
        throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('📱 Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // ===============================================
  // FUNCIONES PÚBLICAS ADICIONALES
  // ===============================================

  // Verificar si el servicio está configurado correctamente
  isConfigured() {
    return !!(
      this.config.enabled &&
      this.config.apiUrl &&
      this.config.accessToken &&
      this.config.phoneId
    );
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      enabled: this.config.enabled,
      configured: this.isConfigured(),
      hasApiUrl: !!this.config.apiUrl,
      hasAccessToken: !!this.config.accessToken,
      hasPhoneId: !!this.config.phoneId
    };
  }

  // Enviar mensaje de prueba (solo desarrollo)
  async sendTestMessage(phone, message = 'Mensaje de prueba desde Tropical TCG Players') {
    if (process.env.REACT_APP_ENVIRONMENT !== 'development') {
      throw new Error('Los mensajes de prueba solo están disponibles en desarrollo');
    }

    return await this._sendMessage(
      this._formatPhoneNumber(phone),
      {
        template: null,
        fallbackMessage: message
      }
    );
  }
}

// Instancia singleton
const whatsAppService = new WhatsAppService();

export default whatsAppService;
export { WhatsAppService };