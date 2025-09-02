// src/components/P2PCheckout.js
// Componente de checkout P2P multi-vendedor

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { useP2PTransactions } from '../hooks/useP2PTransactions';
import { useCart } from '../contexts/CartContext';
import verificationService from '../services/verificationService';
// Comentado Firebase - ahora usa backend API
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
import backendAPI from '../services/backendAPI';
import './P2PCheckout.css';

export default function P2PCheckout({ show, onHide, onSuccess }) {
  const {
    createP2PTransactions,
    actionLoading,
    error,
    clearError,
    checkAtomicAvailability,
    getCartByVendor
  } = useP2PTransactions();

  const { cart, getTotalItems, clearCart, user } = useCart();

  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState(new Set());
  const [contactMethod, setContactMethod] = useState('whatsapp');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Cargar vendedores cuando se abre el modal
  useEffect(() => {
    if (show && cart.length > 0) {
      const vendorGroups = getCartByVendor();
      setVendors(vendorGroups);
      setSelectedVendors(new Set(vendorGroups.map(v => v.vendorId)));
      checkAvailability();
      checkUserVerification();
    }
  }, [show, cart]);

  // Verificar estado de verificación del usuario
  const checkUserVerification = async () => {
    setIsCheckingVerification(true);
    try {
      // TODO: Implementar verificación con backend API
      // const userResponse = await backendAPI.getProfile();
      // if (userResponse.success) {
      //   const status = userResponse.user.verification;
      //   setVerificationStatus(status);
      // }
      
      // Por ahora usar verificación de prueba
      setVerificationStatus({
        phone: { verified: true },
        identity: { verified: true },
        canUseP2P: true
      });
    } catch (error) {
      console.error('Error verificando usuario:', error);
    }
    setIsCheckingVerification(false);
  };

  // Verificar disponibilidad atómica
  const checkAvailability = async () => {
    if (cart.length === 0) return;

    setIsCheckingAvailability(true);
    try {
      const result = await checkAtomicAvailability(cart);
      setAvailabilityCheck(result);
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      setAvailabilityCheck({ 
        available: false, 
        errors: [{ item: 'general', message: 'Error verificando disponibilidad' }]
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Manejar selección de vendedor
  const handleVendorToggle = (vendorId) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
  };

  // Obtener vendedores seleccionados
  const getSelectedVendors = () => {
    return vendors.filter(vendor => selectedVendors.has(vendor.vendorId));
  };

  // Calcular totales de vendedores seleccionados
  const getSelectedTotals = () => {
    const selected = getSelectedVendors();
    return {
      totalAmount: selected.reduce((sum, vendor) => sum + vendor.totalAmount, 0),
      shippingCost: selected.reduce((sum, vendor) => sum + (vendor.hasShipping ? 600 : 0), 0),
      totalItems: selected.reduce((sum, vendor) => sum + vendor.totalItems, 0),
      vendorCount: selected.length
    };
  };

  // Manejar checkout
  const handleCheckout = async () => {
    if (selectedVendors.size === 0) {
      alert('Selecciona al menos un vendedor para continuar');
      return;
    }

    // Verificar que el usuario esté verificado para P2P
    if (!verificationStatus || (!verificationStatus.phone || !verificationStatus.identity)) {
      alert('Para usar el sistema P2P debes verificar tu teléfono y cédula en tu perfil.');
      return;
    }

    clearError();

    try {
      const selectedVendorData = getSelectedVendors();
      const results = await createP2PTransactions(contactMethod, buyerNotes.trim());

      // Analizar resultados
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0 && failed.length === 0) {
        // Todas las transacciones exitosas
        onSuccess && onSuccess({
          type: 'complete',
          successful,
          message: `¡Perfecto! Se crearon ${successful.length} transacción${successful.length > 1 ? 'es' : ''} exitosamente.`
        });
      } else if (successful.length > 0 && failed.length > 0) {
        // Algunas exitosas, algunas fallaron
        onSuccess && onSuccess({
          type: 'partial',
          successful,
          failed,
          message: `${successful.length} transacción${successful.length > 1 ? 'es' : ''} creada${successful.length > 1 ? 's' : ''}, pero ${failed.length} falló${failed.length > 1 ? 'n' : ''}.`
        });
      } else {
        // Todas fallaron
        throw new Error('No se pudo crear ninguna transacción. Por favor intenta nuevamente.');
      }

      onHide();
    } catch (error) {
      console.error('Error en checkout:', error);
      // El error ya está manejado por el hook
    }
  };

  const totals = getSelectedTotals();

  return (
    <Modal show={show} onHide={onHide} size="lg" className="p2p-checkout-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="text-primary fw-bold">
          🛒 Confirmar Compras P2P
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            <Alert.Heading>Error en el checkout</Alert.Heading>
            <p className="mb-0">{error}</p>
          </Alert>
        )}

        {/* Verificación de Disponibilidad */}
        {isCheckingAvailability && (
          <Alert variant="info" className="d-flex align-items-center">
            <Spinner size="sm" className="me-2" />
            Verificando disponibilidad de productos...
          </Alert>
        )}

        {availabilityCheck && !availabilityCheck.available && (
          <Alert variant="warning">
            <Alert.Heading>⚠️ Problemas de Disponibilidad</Alert.Heading>
            <ul className="mb-0">
              {availabilityCheck.errors?.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
            <hr />
            <div className="d-flex justify-content-end">
              <Button variant="outline-warning" size="sm" onClick={checkAvailability}>
                Verificar Nuevamente
              </Button>
            </div>
          </Alert>
        )}

        {/* Lista de Vendedores */}
        <div className="vendors-section mb-4">
          <h5 className="mb-3">📦 Vendedores ({vendors.length})</h5>
          
          {vendors.map((vendor) => (
            <Card 
              key={vendor.vendorId} 
              className={`vendor-card mb-3 ${selectedVendors.has(vendor.vendorId) ? 'selected' : 'unselected'}`}
            >
              <Card.Header className="d-flex justify-content-between align-items-center p-3">
                <Form.Check
                  type="checkbox"
                  id={`vendor-${vendor.vendorId}`}
                  checked={selectedVendors.has(vendor.vendorId)}
                  onChange={() => handleVendorToggle(vendor.vendorId)}
                  label={
                    <div className="vendor-header-info">
                      <strong>{vendor.vendorName}</strong>
                      <div className="text-muted small">
                        📱 {vendor.vendorPhone} • ✉️ {vendor.vendorEmail}
                      </div>
                    </div>
                  }
                />
                <div className="vendor-summary text-end">
                  <div className="fw-bold text-primary">
                    ₡{(vendor.totalAmount + (vendor.hasShipping ? 600 : 0)).toLocaleString()}
                  </div>
                  <div className="small text-muted">
                    {vendor.totalItems} item{vendor.totalItems > 1 ? 's' : ''}
                    {vendor.hasShipping && (
                      <Badge bg="info" className="ms-1">+Envío</Badge>
                    )}
                  </div>
                </div>
              </Card.Header>

              {selectedVendors.has(vendor.vendorId) && (
                <Card.Body className="pt-0">
                  <div className="items-list">
                    {vendor.items.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="item-row d-flex justify-content-between align-items-center py-2">
                        <div className="item-info d-flex align-items-center">
                          <img 
                            src={item.cardImage} 
                            alt={item.cardName}
                            className="item-thumbnail me-3"
                            onError={(e) => e.target.src = '/placeholder-card.png'}
                          />
                          <div>
                            <div className="item-name fw-medium">{item.cardName}</div>
                            <div className="item-details small text-muted">
                              {item.condition} • {item.setName}
                            </div>
                          </div>
                        </div>
                        <div className="item-pricing text-end">
                          <div className="item-price fw-bold">
                            ₡{item.price.toLocaleString()}
                            {item.quantity > 1 && (
                              <span className="quantity-badge ms-2">x{item.quantity}</span>
                            )}
                          </div>
                          {item.quantity > 1 && (
                            <div className="small text-muted">
                              Total: ₡{(item.price * item.quantity).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desglose de Costos */}
                  <div className="cost-breakdown mt-3 pt-3 border-top">
                    <div className="d-flex justify-content-between">
                      <span>Productos:</span>
                      <span>₡{vendor.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Envío:</span>
                      <span>
                        {vendor.hasShipping ? '₡600' : (
                          <Badge bg="success">Gratis</Badge>
                        )}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fw-bold text-primary">
                      <span>Total:</span>
                      <span>₡{(vendor.totalAmount + (vendor.hasShipping ? 600 : 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </Card.Body>
              )}
            </Card>
          ))}
        </div>

        {/* Configuración de Compra */}
        <Card className="checkout-config mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">⚙️ Configuración de Compra</h6>
          </Card.Header>
          <Card.Body>
            {/* Método de Contacto */}
            <Form.Group className="mb-3">
              <Form.Label>📞 Método de contacto preferido</Form.Label>
              <div className="contact-methods">
                <Form.Check
                  type="radio"
                  id="contact-whatsapp"
                  name="contactMethod"
                  value="whatsapp"
                  checked={contactMethod === 'whatsapp'}
                  onChange={(e) => setContactMethod(e.target.value)}
                  label={
                    <span>
                      <span className="me-2">📱</span>
                      WhatsApp <Badge bg="success">Recomendado</Badge>
                    </span>
                  }
                />
                <Form.Check
                  type="radio"
                  id="contact-email"
                  name="contactMethod"
                  value="email"
                  checked={contactMethod === 'email'}
                  onChange={(e) => setContactMethod(e.target.value)}
                  label={
                    <span>
                      <span className="me-2">✉️</span>
                      Email
                    </span>
                  }
                />
                <Form.Check
                  type="radio"
                  id="contact-phone"
                  name="contactMethod"
                  value="phone"
                  checked={contactMethod === 'phone'}
                  onChange={(e) => setContactMethod(e.target.value)}
                  label={
                    <span>
                      <span className="me-2">☎️</span>
                      Llamada telefónica
                    </span>
                  }
                />
              </div>
            </Form.Group>

            {/* Notas del Comprador */}
            <Form.Group>
              <Form.Label>📝 Notas adicionales (opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Mensaje para el vendedor, preferencias de entrega, etc..."
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {buyerNotes.length}/500 caracteres
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Resumen Final */}
        {totals.vendorCount > 0 && (
          <Card className="checkout-summary">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">💰 Resumen de Compra</h6>
            </Card.Header>
            <Card.Body>
              <div className="summary-rows">
                <div className="d-flex justify-content-between">
                  <span>Vendedores seleccionados:</span>
                  <span className="fw-bold">{totals.vendorCount}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Total de productos:</span>
                  <span className="fw-bold">{totals.totalItems}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Subtotal productos:</span>
                  <span>₡{totals.totalAmount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Costos de envío:</span>
                  <span>
                    {totals.shippingCost > 0 ? `₡${totals.shippingCost.toLocaleString()}` : 'Gratis'}
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fs-5 fw-bold text-primary">
                  <span>Total a coordinar:</span>
                  <span>₡{(totals.totalAmount + totals.shippingCost).toLocaleString()}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" onClick={onHide} disabled={actionLoading}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCheckout}
          disabled={actionLoading || totals.vendorCount === 0 || (availabilityCheck && !availabilityCheck.available)}
          className="px-4"
        >
          {actionLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Procesando...
            </>
          ) : (
            <>
              🚀 Confirmar Compra{totals.vendorCount > 1 ? 's' : ''}
              {totals.vendorCount > 0 && (
                <span className="ms-2">
                  (₡{(totals.totalAmount + totals.shippingCost).toLocaleString()})
                </span>
              )}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}