// src/components/NotificationItem.js
// Componente individual para mostrar una notificación

import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationItem.css';

export default function NotificationItem({ notification, onClick }) {
  const { formatNotificationForDisplay, markAsRead } = useNotifications();

  if (!notification) return null;

  const formatted = formatNotificationForDisplay(notification);

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    onClick && onClick(notification);
  };

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    await markAsRead(notification.id);
  };

  // Obtener información específica según el tipo de notificación
  const getNotificationContent = () => {
    const data = notification.data || {};
    
    switch (notification.type) {
      case 'new_purchase':
        return {
          title: `Nueva compra de ${data.buyerName}`,
          description: `${data.cardName} por ₡${data.totalAmount?.toLocaleString()}`,
          actionText: 'Responder en 24h',
          actionVariant: 'warning'
        };
        
      case 'purchase_accepted':
        return {
          title: `Compra aceptada por ${data.sellerName}`,
          description: `${data.cardName} - Entrega estimada: ${data.estimatedDays} días`,
          actionText: 'Ver detalles',
          actionVariant: 'success'
        };
        
      case 'purchase_rejected':
        return {
          title: `Compra rechazada por ${data.sellerName}`,
          description: `${data.cardName} - Motivo: ${data.reason}`,
          actionText: 'Buscar alternativas',
          actionVariant: 'danger'
        };
        
      case 'delivery_confirmed':
        return {
          title: `Entrega confirmada`,
          description: `${data.cardName} - Procede con el pago`,
          actionText: 'Realizar pago',
          actionVariant: 'info'
        };
        
      case 'payment_confirmed':
        return {
          title: `Pago confirmado`,
          description: `${data.cardName} - Recoge en ${data.destinationStore}`,
          actionText: 'Ver ubicación',
          actionVariant: 'success'
        };
        
      case 'seller_response_reminder':
        return {
          title: `Recordatorio: Respuesta pendiente`,
          description: `${data.cardName} - Quedan ${data.hoursLeft} horas`,
          actionText: 'Responder ahora',
          actionVariant: 'warning'
        };
        
      case 'delivery_reminder':
        return {
          title: `Recordatorio: Entrega pendiente`,
          description: `${data.cardName} - Quedan ${data.daysLeft} días`,
          actionText: 'Confirmar entrega',
          actionVariant: 'warning'
        };
        
      case 'rating_reminder':
        return {
          title: `Califica tu experiencia`,
          description: `${data.targetRole}: ${data.targetName} - ${data.cardName}`,
          actionText: 'Calificar',
          actionVariant: 'info'
        };
        
      case 'dispute_created':
        return {
          title: `Nueva disputa reportada`,
          description: `${data.cardName} por ${data.reporterName}`,
          actionText: 'Ver disputa',
          actionVariant: 'danger'
        };
        
      default:
        return {
          title: formatted.displayTitle,
          description: notification.message || 'Notificación del sistema',
          actionText: 'Ver detalles',
          actionVariant: 'primary'
        };
    }
  };

  const content = getNotificationContent();
  
  return (
    <Card 
      className={`notification-item ${!notification.read ? 'unread' : 'read'} ${formatted.isRecent ? 'recent' : ''}`}
      onClick={handleClick}
      role="button"
    >
      <Card.Body className="p-3">
        <div className="d-flex align-items-start">
          {/* Icon */}
          <div className={`notification-icon ${formatted.displayColor}`}>
            {formatted.displayIcon}
          </div>
          
          {/* Content */}
          <div className="notification-content flex-grow-1 mx-3">
            <div className="notification-header d-flex justify-content-between align-items-start mb-1">
              <h6 className="notification-title mb-0">
                {content.title}
                {!notification.read && (
                  <span className="unread-indicator ms-2"></span>
                )}
              </h6>
              <div className="notification-meta d-flex align-items-center">
                <small className="time-ago text-muted">
                  {formatted.timeAgo}
                </small>
                {formatted.isRecent && (
                  <Badge bg="info" className="ms-2 recent-badge">
                    Nuevo
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="notification-description mb-2">
              {content.description}
            </p>
            
            {/* Transaction Info */}
            {notification.transactionId && (
              <div className="transaction-info mb-2">
                <small className="text-muted">
                  Transacción: #{notification.transactionId.slice(-8)}
                </small>
              </div>
            )}
            
            {/* Action Button */}
            <div className="notification-actions">
              <Button
                variant={`outline-${content.actionVariant}`}
                size="sm"
                className="action-button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Aquí se manejaría la acción específica
                  console.log(`Acción: ${content.actionText} para notificación ${notification.id}`);
                }}
              >
                {content.actionText}
              </Button>
              
              {!notification.read && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ms-2"
                  onClick={handleMarkAsRead}
                  title="Marcar como leída"
                >
                  ✓
                </Button>
              )}
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="notification-status">
            {!notification.read && (
              <div className="unread-dot"></div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}