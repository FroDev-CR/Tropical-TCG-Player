// src/components/TransactionCard.js
// Componente individual para mostrar una transacción

import React from 'react';
import { Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { useP2PTransactions } from '../hooks/useP2PTransactions';
import './TransactionCard.css';

export default function TransactionCard({ transaction, onClick, showRole = false }) {
  const {
    getTransactionStatusText,
    getAvailableActions,
    requiresUrgentAttention,
    getTimeRemaining,
    formatTimeRemaining
  } = useP2PTransactions();

  if (!transaction) return null;

  const statusText = getTransactionStatusText(transaction);
  const availableActions = getAvailableActions(transaction);
  const isUrgent = requiresUrgentAttention(transaction);
  const timeRemaining = getTimeRemaining(transaction);
  const formattedTimeRemaining = formatTimeRemaining(timeRemaining);

  // Calcular progreso de la transacción
  const getProgressPercentage = () => {
    const statusProgress = {
      'pending_seller_response': 10,
      'accepted_pending_delivery': 30,
      'delivered_pending_payment': 50,
      'payment_confirmed': 70,
      'completed_pending_rating': 85,
      'completed': 100,
      'cancelled_by_seller': 0,
      'timeout_cancelled': 0,
      'disputed': 45
    };
    return statusProgress[transaction.status] || 0;
  };

  // Obtener color del estado
  const getStatusVariant = () => {
    if (isUrgent) return 'danger';
    
    switch (transaction.status) {
      case 'completed':
        return 'success';
      case 'cancelled_by_seller':
      case 'timeout_cancelled':
        return 'secondary';
      case 'disputed':
        return 'warning';
      case 'delivered_pending_payment':
      case 'payment_confirmed':
        return 'info';
      default:
        return 'primary';
    }
  };

  // Obtener icono del rol
  const getRoleIcon = () => {
    return transaction.role === 'buyer' ? '🛒' : '💰';
  };

  // Obtener información del otro participante
  const getOtherParticipant = () => {
    if (transaction.role === 'buyer') {
      return {
        name: transaction.sellerName,
        label: 'Vendedor',
        phone: transaction.sellerPhone
      };
    } else {
      return {
        name: transaction.buyerName,
        label: 'Comprador',
        phone: transaction.buyerPhone
      };
    }
  };

  const otherParticipant = getOtherParticipant();
  const progress = getProgressPercentage();
  const statusVariant = getStatusVariant();

  return (
    <Card 
      className={`transaction-card ${isUrgent ? 'urgent' : ''} ${availableActions.length > 0 ? 'actionable' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <Card.Header className="d-flex justify-content-between align-items-center p-3">
        <div className="transaction-header-info">
          <div className="d-flex align-items-center mb-1">
            {showRole && (
              <span className="role-icon me-2" title={transaction.role === 'buyer' ? 'Compra' : 'Venta'}>
                {getRoleIcon()}
              </span>
            )}
            <h6 className="transaction-id mb-0 text-muted">
              #{transaction.id.slice(-8)}
            </h6>
            {isUrgent && (
              <Badge bg="danger" className="ms-2 pulse">
                🔥 Urgente
              </Badge>
            )}
          </div>
          <div className="transaction-date text-muted small">
            {transaction.createdAt?.toDate?.()?.toLocaleDateString('es-CR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <Badge bg={statusVariant} className="status-badge">
          {statusText}
        </Badge>
      </Card.Header>

      {/* Body */}
      <Card.Body className="p-3">
        {/* Producto Principal */}
        <div className="main-product mb-3">
          {transaction.items && transaction.items[0] && (
            <div className="d-flex align-items-center">
              <img
                src={transaction.items[0].cardImage}
                alt={transaction.items[0].cardName}
                className="product-image me-3"
                onError={(e) => e.target.src = '/placeholder-card.png'}
              />
              <div className="product-info flex-grow-1">
                <div className="product-name fw-bold mb-1">
                  {transaction.items[0].cardName}
                </div>
                <div className="product-details text-muted small">
                  {transaction.items[0].condition} • {transaction.items[0].setName}
                </div>
                {transaction.items.length > 1 && (
                  <div className="additional-items text-muted small">
                    +{transaction.items.length - 1} producto{transaction.items.length - 1 > 1 ? 's' : ''} más
                  </div>
                )}
              </div>
              <div className="transaction-amount text-end">
                <div className="amount fw-bold text-primary">
                  ₡{transaction.totalAmount?.toLocaleString()}
                </div>
                <div className="item-count text-muted small">
                  {transaction.items.length} item{transaction.items.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participante */}
        <div className="participant-info mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="participant-name fw-medium">
                {otherParticipant.name}
              </div>
              <div className="participant-role text-muted small">
                {otherParticipant.label}
              </div>
            </div>
            <div className="participant-contact">
              <Badge bg="light" text="dark" className="contact-badge">
                📱 {otherParticipant.phone}
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="transaction-progress mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="progress-label small text-muted">Progreso</span>
            <span className="progress-percentage small fw-bold">{progress}%</span>
          </div>
          <ProgressBar
            now={progress}
            variant={statusVariant}
            className="custom-progress"
          />
        </div>

        {/* Time Remaining */}
        {timeRemaining > 0 && (
          <div className="time-remaining mb-3">
            <div className="d-flex align-items-center">
              <span className="time-icon me-2">⏱️</span>
              <span className={`time-text ${isUrgent ? 'text-danger fw-bold' : 'text-muted'}`}>
                {formattedTimeRemaining} restante{isUrgent ? ' ⚠️' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Available Actions */}
        {availableActions.length > 0 && (
          <div className="available-actions">
            <div className="action-buttons">
              {availableActions.slice(0, 2).map((action, index) => {
                const actionLabels = {
                  'accept': '✅ Aceptar',
                  'reject': '❌ Rechazar',
                  'confirm_delivery': '📦 Confirmar Entrega',
                  'request_payment': '💰 Solicitar Pago',
                  'confirm_payment': '✅ Confirmar Pago',
                  'make_payment': '💳 Realizar Pago',
                  'confirm_receipt': '📥 Confirmar Recibo',
                  'submit_rating': '⭐ Calificar',
                  'create_dispute': '🚨 Reportar'
                };

                const actionVariants = {
                  'accept': 'success',
                  'reject': 'danger',
                  'confirm_delivery': 'primary',
                  'request_payment': 'info',
                  'confirm_payment': 'success',
                  'make_payment': 'warning',
                  'confirm_receipt': 'success',
                  'submit_rating': 'warning',
                  'create_dispute': 'outline-danger'
                };

                return (
                  <Button
                    key={action}
                    variant={actionVariants[action] || 'outline-primary'}
                    size="sm"
                    className="action-button me-2 mb-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Aquí se manejarían las acciones específicas
                      console.log(`Acción: ${action} para transacción ${transaction.id}`);
                    }}
                  >
                    {actionLabels[action] || action}
                  </Button>
                );
              })}
              {availableActions.length > 2 && (
                <Badge bg="secondary" className="more-actions">
                  +{availableActions.length - 2} más
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card.Body>

      {/* Footer */}
      <Card.Footer className="p-2 text-center border-0 bg-transparent">
        <small className="text-muted">
          Clic para ver detalles completos
        </small>
      </Card.Footer>
    </Card>
  );
}