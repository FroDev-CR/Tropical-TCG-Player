// src/components/FloatingCart.js
import React, { useState } from 'react';
import { Badge, Button, Offcanvas, ListGroup, Image, Alert } from 'react-bootstrap';
import { FaShoppingCart, FaTimes, FaTrash } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

export default function FloatingCart() {
  const [showCart, setShowCart] = useState(false);
  const { cart, removeFromCart, getTotalItems, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const handleGoToCheckout = () => {
    setShowCart(false);
    navigate('/cart');
  };

  const groupedCart = cart.reduce((groups, item) => {
    const sellerId = item.sellerId;
    if (!groups[sellerId]) {
      groups[sellerId] = [];
    }
    groups[sellerId].push(item);
    return groups;
  }, {});

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <>
      {/* Botón flotante del carrito */}
      <div 
        className="floating-cart-button"
        onClick={() => setShowCart(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1000,
          cursor: 'pointer',
          background: 'rgba(0, 123, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '50px',
          padding: '15px 20px',
          boxShadow: '0 4px 20px rgba(0, 123, 255, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          fontFamily: 'Montserrat Alternates, sans-serif',
          fontWeight: '700',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 25px rgba(0, 123, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 20px rgba(0, 123, 255, 0.3)';
        }}
      >
        <FaShoppingCart size={20} />
        <Badge 
          bg="danger" 
          pill
          style={{
            fontSize: '12px',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {totalItems}
        </Badge>
        <span className="d-none d-sm-inline">₡{totalPrice.toLocaleString()}</span>
      </div>

      {/* Offcanvas del carrito */}
      <Offcanvas 
        show={showCart} 
        onHide={() => setShowCart(false)} 
        placement="end"
        className="floating-cart-offcanvas"
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          border: 'none'
        }}
      >
        <Offcanvas.Header 
          closeButton 
          className="border-bottom border-secondary"
          style={{ color: 'white' }}
        >
          <Offcanvas.Title 
            style={{ 
              fontFamily: 'Montserrat Alternates, sans-serif',
              fontWeight: '900',
              textTransform: 'uppercase',
              color: 'white'
            }}
          >
            <FaShoppingCart className="me-2" />
            Mi Carrito ({totalItems})
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          {totalItems === 0 ? (
            <Alert variant="info" className="text-center">
              <FaShoppingCart className="me-2" />
              Tu carrito está vacío
            </Alert>
          ) : (
            <>
              {/* Lista de productos por vendedor */}
              {Object.entries(groupedCart).map(([sellerId, items]) => {
                const sellerName = items[0]?.sellerName || 'Vendedor desconocido';
                const sellerTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                return (
                  <div key={sellerId} className="mb-4">
                    <div 
                      className="seller-section-header p-2 rounded mb-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <h6 
                        className="mb-1 text-white"
                        style={{ 
                          fontFamily: 'Montserrat Alternates, sans-serif',
                          fontWeight: '700'
                        }}
                      >
                        📦 {sellerName}
                      </h6>
                      <small className="text-light">
                        {items.length} producto{items.length > 1 ? 's' : ''} - ₡{sellerTotal.toLocaleString()}
                      </small>
                    </div>

                    <ListGroup variant="flush">
                      {items.map((item, index) => (
                        <ListGroup.Item 
                          key={`${item.listingId}-${index}`}
                          className="d-flex align-items-center p-2"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '5px',
                            borderRadius: '8px'
                          }}
                        >
                          <Image
                            src={item.cardImage || 'https://via.placeholder.com/50'}
                            alt={item.cardName}
                            style={{ width: '40px', height: '56px', objectFit: 'contain' }}
                            className="me-2 rounded"
                          />
                          <div className="flex-grow-1">
                            <div className="fw-bold text-white small">
                              {item.cardName}
                            </div>
                            <small className="text-light">
                              {item.condition} • Cant: {item.quantity}
                            </small>
                            <div className="fw-bold text-success small">
                              ₡{(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeFromCart(item.listingId || item.id)}
                            className="ms-2"
                          >
                            <FaTrash size={12} />
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                );
              })}

              {/* Resumen total */}
              <div 
                className="total-section p-3 rounded mb-3"
                style={{
                  background: 'rgba(0, 123, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(0, 123, 255, 0.3)'
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span 
                    className="fw-bold text-white"
                    style={{ 
                      fontFamily: 'Montserrat Alternates, sans-serif',
                      textTransform: 'uppercase'
                    }}
                  >
                    Total:
                  </span>
                  <span 
                    className="fw-bold fs-5 text-success"
                    style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}
                  >
                    ₡{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleGoToCheckout}
                  className="fw-bold"
                  style={{
                    fontFamily: 'Montserrat Alternates, sans-serif',
                    textTransform: 'uppercase',
                    background: 'rgba(40, 167, 69, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(40, 167, 69, 0.5)'
                  }}
                >
                  <FaShoppingCart className="me-2" />
                  Ir al Checkout
                </Button>
                
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    if (window.confirm('¿Vaciar todo el carrito?')) {
                      clearCart();
                    }
                  }}
                  className="fw-bold"
                  style={{
                    fontFamily: 'Montserrat Alternates, sans-serif',
                    textTransform: 'uppercase',
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <FaTimes className="me-2" />
                  Vaciar Carrito
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}