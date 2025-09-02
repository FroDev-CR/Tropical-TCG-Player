// src/services/EmailService.js
// Servicio especializado para notificaciones por email usando Brevo API

class EmailService {
  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_BREVO_API_KEY,
      senderEmail: process.env.REACT_APP_BREVO_SENDER_EMAIL || 'noreply@tropicaltcg.com',
      senderName: process.env.REACT_APP_BREVO_SENDER_NAME || 'Tropical TCG Players',
      enabled: process.env.REACT_APP_ENABLE_EMAIL_NOTIFICATIONS === 'true',
      apiUrl: 'https://api.brevo.com/v3/smtp/email'
    };

    console.log('📧 EmailService initialized:', { 
      enabled: this.config.enabled,
      hasApiKey: !!this.config.apiKey,
      sender: `${this.config.senderName} <${this.config.senderEmail}>`
    });
  }

  // ===============================================
  // TEMPLATES DE EMAILS P2P
  // ===============================================

  // Template para nueva compra (al vendedor)
  _getNewPurchaseEmail(data) {
    const { buyerName, cardName, totalAmount, itemCount, appLink } = data;
    const itemText = itemCount > 1 ? `${itemCount} cartas` : cardName;
    
    return {
      subject: '🎯 Nueva compra en Tropical TCG - Responde en 24 horas',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Nueva Compra</h1>
            <p style="color: #e8f4f8; margin: 10px 0 0 0; font-size: 16px;">Tropical TCG Players</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">¡Tienes una nueva compra!</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>👤 Comprador:</strong> ${buyerName}</p>
              <p style="margin: 0 0 10px 0;"><strong>📦 Producto:</strong> ${itemText}</p>
              <p style="margin: 0 0 10px 0;"><strong>💰 Total:</strong> ₡${totalAmount.toLocaleString()}</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffecb5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⏰ Importante:</strong> Tienes 24 horas para responder a esta compra.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appLink}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Detalles y Responder</a>
            </div>
          </div>
          
          <div style="background: #6c757d; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Tropical TCG Players - Tu comunidad de Trading Cards</p>
            <p style="margin: 5px 0 0 0;">Costa Rica</p>
          </div>
        </div>
      `,
      textContent: `Nueva compra en Tropical TCG\n\nComprador: ${buyerName}\nProducto: ${itemText}\nTotal: ₡${totalAmount.toLocaleString()}\n\nTienes 24 horas para responder.\nVer detalles: ${appLink}\n\nTropical TCG Players`
    };
  }

  // Template para compra aceptada (al comprador)
  _getPurchaseAcceptedEmail(data) {
    const { sellerName, sellerPhone, cardName, originStore, estimatedDays, appLink } = data;
    
    return {
      subject: '✅ Tu compra fue aceptada - Tropical TCG',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Compra Aceptada</h1>
            <p style="color: #e8f4f8; margin: 10px 0 0 0; font-size: 16px;">Tropical TCG Players</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">¡Excelente! Tu compra fue aceptada</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>👤 Vendedor:</strong> ${sellerName}</p>
              <p style="margin: 0 0 10px 0;"><strong>📱 Contacto:</strong> ${sellerPhone}</p>
              <p style="margin: 0 0 10px 0;"><strong>📦 Producto:</strong> ${cardName}</p>
              <p style="margin: 0 0 10px 0;"><strong>🏪 Tienda origen:</strong> ${originStore}</p>
              <p style="margin: 0 0 10px 0;"><strong>📅 Entrega estimada:</strong> ${estimatedDays} días</p>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #0c5460;"><strong>📞 Próximos pasos:</strong> El vendedor coordinará la entrega contigo.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appLink}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Progreso</a>
            </div>
          </div>
          
          <div style="background: #6c757d; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Tropical TCG Players - Tu comunidad de Trading Cards</p>
            <p style="margin: 5px 0 0 0;">Costa Rica</p>
          </div>
        </div>
      `,
      textContent: `Tu compra fue aceptada\n\nVendedor: ${sellerName}\nContacto: ${sellerPhone}\nProducto: ${cardName}\nTienda origen: ${originStore}\nEntrega estimada: ${estimatedDays} días\n\nEl vendedor coordinará la entrega contigo.\nVer progreso: ${appLink}\n\nTropical TCG Players`
    };
  }

  // Template para compra rechazada (al comprador)
  _getPurchaseRejectedEmail(data) {
    const { sellerName, cardName, reason, appLink } = data;
    
    return {
      subject: '❌ Tu compra fue rechazada - Tropical TCG',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">❌ Compra Rechazada</h1>
            <p style="color: #f8d7da; margin: 10px 0 0 0; font-size: 16px;">Tropical TCG Players</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">Lo sentimos, tu compra fue rechazada</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>👤 Vendedor:</strong> ${sellerName}</p>
              <p style="margin: 0 0 10px 0;"><strong>📦 Producto:</strong> ${cardName}</p>
              <p style="margin: 0 0 10px 0;"><strong>📝 Motivo:</strong> ${reason}</p>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>💡 Buenas noticias:</strong> Tu dinero no fue cobrado. Puedes buscar el mismo producto con otros vendedores.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appLink}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Buscar Alternativas</a>
            </div>
          </div>
          
          <div style="background: #6c757d; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Tropical TCG Players - Tu comunidad de Trading Cards</p>
            <p style="margin: 5px 0 0 0;">Costa Rica</p>
          </div>
        </div>
      `,
      textContent: `Tu compra fue rechazada\n\nVendedor: ${sellerName}\nProducto: ${cardName}\nMotivo: ${reason}\n\nTu dinero no fue cobrado. Puedes buscar alternativas.\nVer marketplace: ${appLink}\n\nTropical TCG Players`
    };
  }

  // Template para recordatorio de calificación
  _getRatingReminderEmail(data) {
    const { targetName, targetRole, cardName, daysLeft, appLink } = data;
    
    return {
      subject: '⭐ Recordatorio: Califica tu experiencia - Tropical TCG',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⭐ Calificación Pendiente</h1>
            <p style="color: #fff3cd; margin: 10px 0 0 0; font-size: 16px;">Tropical TCG Players</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-top: 0;">Tu calificación es importante</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>👤 ${targetRole}:</strong> ${targetName}</p>
              <p style="margin: 0 0 10px 0;"><strong>📦 Producto:</strong> ${cardName}</p>
              <p style="margin: 0 0 10px 0;"><strong>⏰ Tiempo restante:</strong> ${daysLeft} días</p>
            </div>
            
            <p style="color: #666;">Tu calificación ayuda a otros usuarios a tomar mejores decisiones y mantiene la confianza en nuestra comunidad.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appLink}" style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Calificar Ahora</a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffecb5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Nota:</strong> Si no calificas en ${daysLeft} días, tu rating personal se verá afectado levemente.</p>
            </div>
          </div>
          
          <div style="background: #6c757d; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Tropical TCG Players - Tu comunidad de Trading Cards</p>
            <p style="margin: 5px 0 0 0;">Costa Rica</p>
          </div>
        </div>
      `,
      textContent: `Recordatorio de calificación\n\n${targetRole}: ${targetName}\nProducto: ${cardName}\nTiempo restante: ${daysLeft} días\n\nTu calificación es importante para la comunidad.\nCalificar ahora: ${appLink}\n\nTropical TCG Players`
    };
  }

  // ===============================================
  // FUNCIONES PRINCIPALES
  // ===============================================

  // Enviar email según el tipo de notificación
  async sendNotification(type, recipientEmail, recipientName, data) {
    if (!this.config.enabled) {
      console.log('📧 Email notifications disabled');
      return { success: false, reason: 'Email notifications disabled' };
    }

    if (!this.config.apiKey) {
      console.error('📧 Email API key not configured');
      return { success: false, reason: 'Email API key not configured' };
    }

    try {
      // Obtener el template según el tipo
      let emailData;
      switch (type) {
        case 'new_purchase':
          emailData = this._getNewPurchaseEmail(data);
          break;
        case 'purchase_accepted':
          emailData = this._getPurchaseAcceptedEmail(data);
          break;
        case 'purchase_rejected':
          emailData = this._getPurchaseRejectedEmail(data);
          break;
        case 'delivery_confirmed':
          // Usar el mismo template que purchase_accepted con modificaciones
          emailData = this._getPurchaseAcceptedEmail(data);
          emailData.subject = '📦 Entrega confirmada - Procede con el pago';
          break;
        case 'payment_confirmed':
          // Usar template básico
          emailData = {
            subject: '💰 Pago confirmado - Recoge tu producto',
            htmlContent: this._getBasicTemplate('Pago Confirmado', '💰', data.cardName, `Tu producto ${data.cardName} está listo para recoger en ${data.destinationStore}.`, data.appLink, 'Ver Detalles'),
            textContent: `Pago confirmado - Recoge tu producto\n\nProducto: ${data.cardName}\nRecoger en: ${data.destinationStore}\n\nVer detalles: ${data.appLink}\n\nTropical TCG Players`
          };
          break;
        case 'rating_reminder':
          emailData = this._getRatingReminderEmail(data);
          break;
        default:
          throw new Error(`Tipo de email no soportado: ${type}`);
      }

      // Enviar email
      return await this._sendEmail(recipientEmail, recipientName, emailData);
      
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  }

  // ===============================================
  // FUNCIONES PRIVADAS
  // ===============================================

  // Template básico para emails simples
  _getBasicTemplate(title, icon, cardName, message, appLink, buttonText) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${icon} ${title}</h1>
          <p style="color: #e8f4f8; margin: 10px 0 0 0; font-size: 16px;">Tropical TCG Players</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-top: 0;">${cardName}</h2>
          <p style="color: #666; font-size: 16px;">${message}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appLink}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${buttonText}</a>
          </div>
        </div>
        
        <div style="background: #6c757d; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">Tropical TCG Players - Tu comunidad de Trading Cards</p>
          <p style="margin: 5px 0 0 0;">Costa Rica</p>
        </div>
      </div>
    `;
  }

  // Enviar email via Brevo API
  async _sendEmail(recipientEmail, recipientName, emailData) {
    try {
      const payload = {
        sender: {
          name: this.config.senderName,
          email: this.config.senderEmail
        },
        to: [{
          email: recipientEmail,
          name: recipientName || 'Usuario'
        }],
        subject: emailData.subject,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.config.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('📧 Email sent successfully:', result.messageId);
        return {
          success: true,
          messageId: result.messageId,
          email: recipientEmail
        };
      } else {
        console.error('📧 Brevo API error:', result);
        throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('📧 Error sending email:', error);
      throw error;
    }
  }

  // ===============================================
  // FUNCIONES PÚBLICAS ADICIONALES
  // ===============================================

  // Verificar si el servicio está configurado correctamente
  isConfigured() {
    return !!(this.config.enabled && this.config.apiKey);
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      enabled: this.config.enabled,
      configured: this.isConfigured(),
      hasApiKey: !!this.config.apiKey,
      sender: `${this.config.senderName} <${this.config.senderEmail}>`
    };
  }

  // Enviar email de prueba (solo desarrollo)
  async sendTestEmail(recipientEmail, recipientName = 'Usuario de Prueba') {
    if (process.env.REACT_APP_ENVIRONMENT !== 'development') {
      throw new Error('Los emails de prueba solo están disponibles en desarrollo');
    }

    const testData = {
      subject: '✅ Email de prueba - Tropical TCG',
      htmlContent: this._getBasicTemplate(
        'Email de Prueba',
        '✅',
        'Test Card',
        'Este es un email de prueba del sistema de notificaciones de Tropical TCG Players.',
        'https://localhost:3000',
        'Ir a la App'
      ),
      textContent: 'Email de prueba desde Tropical TCG Players\n\nEste es un mensaje de prueba.\n\nTropical TCG Players'
    };

    return await this._sendEmail(recipientEmail, recipientName, testData);
  }
}

// Instancia singleton
const emailService = new EmailService();

export default emailService;
export { EmailService };