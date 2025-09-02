// src/components/NotificationBadge.js
import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, ListGroup, Button, Alert } from 'react-bootstrap';
import { FaBell, FaHandshake, FaShoppingCart, FaCheck, FaTrash } from 'react-icons/fa';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationBadge() {
  // TODO: Replace with AuthContext when migrated
  const user = null; // Temporarily disabled
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    // TODO: Replace with backend API calls
    console.log('🚧 NotificationBadge: Firebase code commented out - using mock data');
    
    // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
    /*
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.read).length);
    });

    return () => unsubscribe();
    */

    // Mock notifications for development
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'NUEVA_OFERTA',
        title: '¡Nueva oferta recibida!',
        message: 'Juan Carlos ha hecho una oferta por tu Pikachu VMAX',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutos atrás
      },
      {
        id: 'notif-2',
        type: 'VENTA_COMPLETADA',
        title: 'Venta completada',
        message: 'Tu carta Charizard V se ha vendido exitosamente',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 horas atrás
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      console.log('🚧 Marking notification as read:', notificationId);
      // TODO: Replace with backend API call
      // await updateDoc(doc(db, 'notifications', notificationId), {
      //   read: true,
      //   updatedAt: new Date()
      // });
      
      // Mock update
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      console.log('🚧 Deleting notification:', notificationId);
      // TODO: Replace with backend API call
      // await deleteDoc(doc(db, 'notifications', notificationId));
      
      // Mock delete
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        return deletedNotif && !deletedNotif.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('🚧 Marking all notifications as read');
      // TODO: Replace with backend API call
      /*
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification => 
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true,
            updatedAt: new Date()
          })
        )
      );
      */
      
      // Mock update all
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NUEVA_OFERTA':
        return <FaHandshake className="text-primary" />;
      case 'VENTA_COMPLETADA':
        return <FaShoppingCart className="text-success" />;
      case 'MENSAJE_NUEVO':
        return <FaBell className="text-info" />;
      default:
        return <FaBell className="text-secondary" />;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Hace un momento';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return format(date, 'dd MMM', { locale: es });
  };

  if (!user) return null;

  return (
    <div className="position-relative">
      <Dropdown 
        show={showDropdown} 
        onToggle={setShowDropdown}
        align="end"
      >
        <Dropdown.Toggle
          as="div"
          className="position-relative cursor-pointer"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '45px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <FaBell size={18} />
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill
              className="position-absolute top-0 start-100 translate-middle"
              style={{
                fontSize: '10px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu
          className="notification-dropdown"
          style={{
            minWidth: '350px',
            maxWidth: '400px',
            maxHeight: '500px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '15px',
            padding: '0'
          }}
        >
          <div 
            className="notification-header p-3 border-bottom border-secondary"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h6 
                className="mb-0 text-white"
                style={{ 
                  fontFamily: 'Montserrat Alternates, sans-serif',
                  fontWeight: '700'
                }}
              >
                🔔 Notificaciones
              </h6>
              {unreadCount > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-light p-0"
                  onClick={markAllAsRead}
                  style={{ textDecoration: 'none' }}
                >
                  <FaCheck className="me-1" size={12} />
                  Marcar todo como leído
                </Button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <Alert 
                variant="info" 
                className="m-3 text-center"
                style={{ 
                  background: 'rgba(13, 202, 240, 0.1)',
                  border: '1px solid rgba(13, 202, 240, 0.3)',
                  color: '#0dcaf0'
                }}
              >
                <FaBell className="me-2" />
                No tienes notificaciones
              </Alert>
            ) : (
              <ListGroup variant="flush">
                {notifications.slice(0, 10).map((notification) => (
                  <ListGroup.Item
                    key={notification.id}
                    className="notification-item p-3"
                    style={{
                      background: notification.read ? 
                        'rgba(255, 255, 255, 0.02)' : 
                        'rgba(0, 123, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderLeft: notification.read ? 
                        '4px solid rgba(255, 255, 255, 0.2)' : 
                        '4px solid #0d6efd',
                      cursor: 'pointer'
                    }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="d-flex align-items-start">
                      <div className="me-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-grow-1">
                        <h6 
                          className={`mb-1 ${notification.read ? 'text-light' : 'text-white'}`}
                          style={{ 
                            fontFamily: 'Montserrat Alternates, sans-serif',
                            fontSize: '14px',
                            fontWeight: notification.read ? '500' : '700'
                          }}
                        >
                          {notification.title}
                        </h6>
                        <p 
                          className={`mb-1 small ${notification.read ? 'text-muted' : 'text-light'}`}
                          style={{ fontSize: '13px' }}
                        >
                          {notification.message}
                        </p>
                        <small className="text-muted">
                          {formatTimeAgo(notification.createdAt)}
                        </small>
                      </div>
                      <div className="ms-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{ fontSize: '12px' }}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

          {notifications.length > 10 && (
            <div 
              className="notification-footer p-2 text-center border-top border-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <small className="text-muted">
                Mostrando las 10 notificaciones más recientes
              </small>
            </div>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}