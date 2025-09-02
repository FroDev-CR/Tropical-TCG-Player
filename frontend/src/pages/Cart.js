// src/pages/Cart.js
import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Image, Badge, Alert, Form, Modal } from 'react-bootstrap';
import { FaShoppingCart, FaUser, FaStar, FaMapMarkerAlt, FaTrash, FaWhatsapp, FaComments, FaHandshake, FaCreditCard } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { useNavigate } from 'react-router-dom';
import P2PCheckout from '../components/P2PCheckout';

export default function Cart() {
  // TODO: Replace with AuthContext when migrated
  const user = null; // Temporarily disabled
  const { cart, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart();
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [showP2PCheckout, setShowP2PCheckout] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [buyerNotes, setBuyerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Agrupar carrito por vendedores
  const groupedCart = cart.reduce((groups, item) => {
    const sellerId = item.sellerId;
    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerId,
        sellerName: item.sellerName,
        sellerPhone: item.userPhone,
        sellerEmail: item.userEmail,
        sellerRating: item.sellerRating || 4.5, // Simulado por ahora
        sellerReviews: item.sellerReviews || 15, // Simulado por ahora
        items: []
      };
    }
    groups[sellerId].items.push(item);
    return groups;
  }, {});

  const sellerGroups = Object.values(groupedCart);
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleProposeDeal = (seller) => {
    if (!user) {
      alert('Debes iniciar sesión para proponer un trato');
      return;
    }
    setSelectedSeller(seller);
    setSelectedItems(seller.items);
    setShowProposeModal(true);
  };

  const handleSubmitProposal = async () => {
    if (!user || !selectedSeller || selectedItems.length === 0) return;
    
    setLoading(true);
    try {
      // TODO: Replace with backend API calls
      console.log('🚧 Cart: Firebase transaction commented out - using mock proposal');
      
      const transactionData = {
        buyerId: user.uid || 'test-buyer',
        buyerName: user.displayName || user.email || 'Test User',
        buyerEmail: user.email || 'test@test.com',
        sellerId: selectedSeller.sellerId,
        sellerName: selectedSeller.sellerName,
        sellerEmail: selectedSeller.sellerEmail,
        items: selectedItems.map(item => ({
          listingId: item.listingId,
          cardId: item.cardId,
          cardName: item.cardName,
          cardImage: item.cardImage,
          price: item.price,
          quantity: item.quantity,
          condition: item.condition,
          tcgType: item.tcgType
        })),
        totalAmount: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'PENDIENTE',
        buyerNotes: buyerNotes.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
      /*
      const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      const notificationData = {
        userId: selectedSeller.sellerId,
        type: 'NUEVA_OFERTA',
        transactionId: transactionRef.id,
        title: 'Nueva oferta recibida',
        message: `${user.displayName || user.email} está interesado en ${selectedItems.length} carta(s)`,
        read: false,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      */

      // Mock transaction for development
      console.log('Mock transaction created:', transactionData);

      // Remover items del carrito
      selectedItems.forEach(item => {
        removeFromCart(item.listingId);
      });

      alert('🚧 Funcionalidad en desarrollo - ¡Oferta enviada exitosamente (simulada)! El vendedor será notificado.');
      setShowProposeModal(false);
      setBuyerNotes('');
      
      // Redirigir al dashboard para ver la transacción
      navigate('/dashboard?tab=transactions');

    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error al enviar la oferta. Inténtalo de nuevo.');
    }
    setLoading(false);
  };

  const openWhatsAppChat = (seller) => {
    const items = seller.items;
    const itemsList = items.map(item => 
      `• ${item.cardName} (${item.condition}) - ₡${item.price.toLocaleString()}`
    ).join('\\n');
    
    const message = `¡Hola! Me interesa comprar estas cartas de TCG:\\n\\n${itemsList}\\n\\nTotal: ₡${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}\\n\\n¿Podemos coordinar la compra?`;
    
    const phoneNumber = seller.sellerPhone?.replace(/[^\\d]/g, '');
    if (phoneNumber) {
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
    } else {
      alert('Número de WhatsApp no disponible');
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="info" className="text-center">
          <FaShoppingCart className="me-2" size={24} />
          <h5>Inicia sesión para ver tu carrito</h5>
        </Alert>
      </Container>
    );
  }

  if (totalItems === 0) {
    return (
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Alert variant="info">
            <FaShoppingCart className="me-2" size={24} />
            <h5>Tu carrito está vacío</h5>
            <p>¡Explora nuestro marketplace y encuentra las mejores cartas!</p>
            <Button variant="primary" onClick={() => navigate('/marketplace')}>
              Ir al Marketplace
            </Button>
          </Alert>
        </motion.div>
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="section"
    >
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title">🛒 Mi Carrito ({totalItems} productos)</h2>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/marketplace')}
            >
              Seguir Comprando
            </Button>
            <Button 
              variant="outline-danger"
              onClick={() => {
                if (window.confirm('¿Vaciar todo el carrito?')) {
                  clearCart();
                }
              }}
            >
              <FaTrash className="me-2" />
              Vaciar Carrito
            </Button>
          </div>
        </div>

        <Row>
          <Col lg={8}>
            {/* Productos agrupados por vendedor */}
            {sellerGroups.map((seller, index) => {
              const sellerTotal = seller.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              
              return (
                <motion.div
                  key={seller.sellerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="mb-4"
                >
                  <Card className="seller-group-card shadow-sm">
                    <Card.Header className="seller-header">
                      <Row className="align-items-center">
                        <Col md={8}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="seller-avatar">
                              <FaUser size={24} />
                            </div>
                            <div>
                              <h5 className="mb-1">{seller.sellerName}</h5>
                              <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center">
                                  <FaStar className="text-warning me-1" size={14} />
                                  <span>{seller.sellerRating}</span>
                                  <small className="text-muted ms-1">({seller.sellerReviews} reseñas)</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} className="text-end">
                          <div className="fw-bold fs-5 text-success">
                            ₡{sellerTotal.toLocaleString()}
                          </div>
                          <small className="text-muted">
                            {seller.items.length} producto{seller.items.length > 1 ? 's' : ''}
                          </small>
                        </Col>
                      </Row>
                    </Card.Header>

                    <Card.Body>
                      {/* Lista de productos del vendedor */}
                      {seller.items.map((item, itemIndex) => (
                        <div key={`${item.listingId}-${itemIndex}`} className="cart-item mb-3 p-3 rounded">
                          <Row className="align-items-center">
                            <Col xs={3} md={2}>
                              <Image
                                src={item.cardImage || 'https://via.placeholder.com/100'}
                                alt={item.cardName}
                                className="w-100"
                                style={{ height: '100px', objectFit: 'contain' }}
                              />
                            </Col>
                            <Col xs={6} md={7}>
                              <h6 className="mb-1">{item.cardName}</h6>
                              <div className="d-flex flex-wrap gap-2 mb-2">
                                <Badge bg="secondary">{item.tcgType?.toUpperCase()}</Badge>
                                <Badge bg="info">{item.condition}</Badge>
                                <Badge bg="warning" text="dark">Cant: {item.quantity}</Badge>
                              </div>
                              {item.location && (
                                <small className="text-muted">
                                  <FaMapMarkerAlt className="me-1" />
                                  {item.location}
                                </small>
                              )}
                            </Col>
                            <Col xs={3} md={3} className="text-end">
                              <div className="fw-bold text-success">
                                ₡{(item.price * item.quantity).toLocaleString()}
                              </div>
                              <small className="text-muted">
                                ₡{item.price.toLocaleString()} c/u
                              </small>
                              <div className="mt-2">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeFromCart(item.listingId)}
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      ))}

                      {/* Botones de acción del vendedor */}
                      <div className="d-flex gap-2 mt-3">
                        <Button
                          variant="primary"
                          onClick={() => handleProposeDeal(seller)}
                          className="flex-fill"
                        >
                          <FaHandshake className="me-2" />
                          Proponer Trato
                        </Button>
                        <Button
                          variant="success"
                          onClick={() => openWhatsAppChat(seller)}
                        >
                          <FaWhatsapp className="me-2" />
                          WhatsApp
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              );
            })}
          </Col>

          <Col lg={4}>
            {/* Resumen del carrito */}
            <Card className="cart-summary-card sticky-top shadow-sm">
              <Card.Header>
                <h5 className="mb-0">📊 Resumen de Compra</h5>
              </Card.Header>
              <Card.Body>
                <div className="summary-item d-flex justify-content-between mb-2">
                  <span>Productos:</span>
                  <span>{totalItems}</span>
                </div>
                <div className="summary-item d-flex justify-content-between mb-2">
                  <span>Vendedores:</span>
                  <span>{sellerGroups.length}</span>
                </div>
                <hr />
                <div className="summary-total d-flex justify-content-between">
                  <span className="fw-bold fs-5">Total:</span>
                  <span className="fw-bold fs-4 text-success">₡{totalPrice.toLocaleString()}</span>
                </div>

                {/* Botón P2P Checkout */}
                <div className="d-grid gap-2 mt-3">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => setShowP2PCheckout(true)}
                    disabled={!user || cart.length === 0}
                  >
                    <FaCreditCard className="me-2" />
                    Checkout P2P
                  </Button>
                  {!user && (
                    <small className="text-muted text-center">
                      Inicia sesión para usar el checkout P2P
                    </small>
                  )}
                </div>

                <Alert variant="info" className="mt-3 small">
                  <FaComments className="me-2" />
                  El checkout P2P maneja automáticamente múltiples vendedores y 
                  coordina todo el proceso de compra.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal para proponer trato */}
        <Modal 
          show={showProposeModal} 
          onHide={() => setShowProposeModal(false)}
          size="lg"
          centered
          className="glassmorphism-modal"
        >
          <Modal.Header closeButton className="glassmorphism-header">
            <Modal.Title>
              <FaHandshake className="me-2" />
              Proponer Trato a {selectedSeller?.sellerName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="glassmorphism-body">
            {selectedItems.length > 0 && (
              <>
                <h6>Productos seleccionados:</h6>
                <div className="selected-items mb-3">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="d-flex align-items-center mb-2 p-2 rounded bg-light">
                      <Image
                        src={item.cardImage}
                        alt={item.cardName}
                        style={{ width: '40px', height: '56px', objectFit: 'contain' }}
                        className="me-2"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold small">{item.cardName}</div>
                        <small className="text-muted">{item.condition} • Cant: {item.quantity}</small>
                      </div>
                      <div className="fw-bold text-success">
                        ₡{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="total-proposal p-3 rounded bg-primary text-white mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Total de la oferta:</span>
                    <span className="fw-bold fs-4">
                      ₡{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Mensaje adicional (opcional):</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Agrega cualquier comentario o pregunta para el vendedor..."
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                  />
                </Form.Group>

                <Alert variant="info">
                  <FaComments className="me-2" />
                  Al enviar esta oferta, se notificará al vendedor y podrás hacer seguimiento desde tu dashboard.
                </Alert>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="glassmorphism-body">
            <Button variant="secondary" onClick={() => setShowProposeModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmitProposal}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Oferta'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal P2P Checkout */}
        <P2PCheckout
          show={showP2PCheckout}
          onHide={() => setShowP2PCheckout(false)}
          onTransactionCreated={(results) => {
            console.log('Transacciones P2P creadas:', results);
            setShowP2PCheckout(false);
            // Navegar al dashboard para ver las transacciones
            navigate('/dashboard');
          }}
        />
      </Container>
    </motion.div>
  );
}