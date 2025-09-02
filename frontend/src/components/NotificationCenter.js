// src/components/NotificationCenter.js
// Centro de notificaciones P2P

import React, { useState, useEffect } from 'react';
import { Modal, Card, Badge, Button, Nav, Spinner, Alert, Dropdown } from 'react-bootstrap';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import './NotificationCenter.css';

export default function NotificationCenter({ show, onHide }) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getFilteredNotifications,
    getNotificationsByDate,
    getUrgentNotifications,
    getRecentNotifications,
    getNotificationStats
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [stats, setStats] = useState({});

  // Actualizar notificaciones filtradas cuando cambia el tab
  useEffect(() => {
    let filtered = [];
    
    switch (activeTab) {
      case 'unread':
        filtered = getFilteredNotifications({ unread: true });
        break;
      case 'urgent':
        filtered = getUrgentNotifications();
        break;
      case 'recent':
        filtered = getRecentNotifications();
        break;
      case 'transactions':
        filtered = getFilteredNotifications({ 
          type: ['new_purchase', 'purchase_accepted', 'purchase_rejected', 'delivery_confirmed', 'payment_confirmed'] 
        });
        break;
      case 'reminders':
        filtered = getFilteredNotifications({ 
          type: ['seller_response_reminder', 'delivery_reminder', 'rating_reminder'] 
        });
        break;
      default:
        filtered = notifications;
        break;
    }
    
    setFilteredNotifications(filtered);
  }, [activeTab, notifications]);

  // Cargar estadísticas
  useEffect(() => {
    if (!loading && notifications.length > 0) {
      setStats(getNotificationStats());
    }
  }, [notifications, loading]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navegar a la transacción si tiene transactionId
    if (notification.transactionId) {
      // Aquí se podría abrir el modal de transacción o navegar
      console.log('Navegar a transacción:', notification.transactionId);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'unread':
        return unreadCount;
      case 'urgent':
        return getUrgentNotifications().length;
      case 'recent':
        return getRecentNotifications().length;
      case 'transactions':
        return getFilteredNotifications({ 
          type: ['new_purchase', 'purchase_accepted', 'purchase_rejected', 'delivery_confirmed', 'payment_confirmed'] 
        }).length;
      case 'reminders':
        return getFilteredNotifications({ 
          type: ['seller_response_reminder', 'delivery_reminder', 'rating_reminder'] 
        }).length;
      default:
        return notifications.length;
    }
  };

  // Agrupar notificaciones por fecha para mejor organización
  const groupedNotifications = getNotificationsByDate();
  const currentNotifications = filteredNotifications;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      className="notification-center-modal"
      centered
    >
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="d-flex align-items-center">
          🔔 Centro de Notificaciones
          {unreadCount > 0 && (
            <Badge bg="danger" className="ms-2 pulse">
              {unreadCount}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {/* Stats Row */}
        {Object.keys(stats).length > 0 && (
          <div className="notification-stats p-3 border-bottom">
            <div className="row text-center">
              <div className="col">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="col">
                <div className="stat-number text-danger">{stats.unread}</div>
                <div className="stat-label">No leídas</div>
              </div>
              <div className="col">
                <div className="stat-number text-info">{stats.today}</div>
                <div className="stat-label">Hoy</div>
              </div>
              <div className="col">
                <div className="stat-number text-success">{stats.thisWeek}</div>
                <div className="stat-label">Esta semana</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="notification-tabs p-3 border-bottom">
          <Nav variant="pills" className="nav-justified">
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                className="d-flex align-items-center justify-content-center"
              >
                📋 Todas
                <Badge bg="secondary" className="ms-1">{getTabCount('all')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'unread'}
                onClick={() => setActiveTab('unread')}
                className="d-flex align-items-center justify-content-center"
              >
                ⭕ No leídas
                <Badge bg="danger" className="ms-1">{getTabCount('unread')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'urgent'}
                onClick={() => setActiveTab('urgent')}
                className="d-flex align-items-center justify-content-center"
              >
                🔥 Urgentes
                <Badge bg="warning" className="ms-1">{getTabCount('urgent')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'recent'}
                onClick={() => setActiveTab('recent')}
                className="d-flex align-items-center justify-content-center"
              >
                🕐 Recientes
                <Badge bg="info" className="ms-1">{getTabCount('recent')}</Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {/* Secondary Tabs */}
        <div className="secondary-tabs px-3 pt-2 border-bottom">
          <Nav variant="underline" className="small">
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'transactions'}
                onClick={() => setActiveTab('transactions')}
                className="py-2"
              >
                💰 Transacciones ({getTabCount('transactions')})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'reminders'}
                onClick={() => setActiveTab('reminders')}
                className="py-2"
              >
                ⏰ Recordatorios ({getTabCount('reminders')})
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {/* Action Bar */}
        {currentNotifications.length > 0 && (
          <div className="action-bar p-3 border-bottom d-flex justify-content-between align-items-center">
            <div className="results-info">
              <small className="text-muted">
                Mostrando {currentNotifications.length} notificación{currentNotifications.length !== 1 ? 'es' : ''}
                {activeTab === 'all' && unreadCount > 0 && (
                  <span className="text-danger ms-1">
                    ({unreadCount} sin leer)
                  </span>
                )}
              </small>
            </div>
            <div className="actions">
              {unreadCount > 0 && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="d-flex align-items-center"
                >
                  ✅ Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" className="mb-3" />
            <p className="text-muted">Cargando notificaciones...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && (
          <div className="notifications-list">
            {currentNotifications.length === 0 ? (
              <div className="empty-state text-center py-5">
                <div className="empty-icon mb-3">
                  {activeTab === 'unread' ? '📭' :
                   activeTab === 'urgent' ? '🔥' :
                   activeTab === 'recent' ? '🕐' :
                   activeTab === 'transactions' ? '💰' :
                   activeTab === 'reminders' ? '⏰' : '🔔'}
                </div>
                <h5 className="text-muted">
                  {activeTab === 'unread' ? 'Todas las notificaciones están leídas' :
                   activeTab === 'urgent' ? 'No tienes notificaciones urgentes' :
                   activeTab === 'recent' ? 'No hay notificaciones recientes' :
                   activeTab === 'transactions' ? 'No tienes notificaciones de transacciones' :
                   activeTab === 'reminders' ? 'No tienes recordatorios pendientes' :
                   'No tienes notificaciones'}
                </h5>
                <p className="text-muted">
                  {activeTab === 'all' ? 
                    'Las notificaciones aparecerán aquí cuando tengas actividad en el marketplace' :
                    'Cambia a otra pestaña para ver más notificaciones'}
                </p>
              </div>
            ) : (
              <div className="notification-items">
                {currentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 bg-light">
        <div className="d-flex justify-content-between align-items-center w-100">
          <small className="text-muted">
            {!loading && currentNotifications.length > 0 && (
              <>
                Última actualización: {new Date().toLocaleTimeString('es-CR')}
              </>
            )}
          </small>
          <div>
            <Button variant="secondary" onClick={onHide}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}