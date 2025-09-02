// src/components/RatingSystem.js
// Sistema completo de calificaciones P2P

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Card, Badge, Row, Col } from 'react-bootstrap';
import { useP2PTransactions } from '../hooks/useP2PTransactions';
import RatingStars from './RatingStars';
import './RatingSystem.css';

export default function RatingSystem({ 
  show, 
  onHide, 
  transaction, 
  userRole, // 'buyer' | 'seller'
  onRatingSubmitted 
}) {
  const { handleRatingSubmission, actionLoading, error } = useP2PTransactions();
  
  const [rating, setRating] = useState({
    overall: 0,
    categories: {
      communication: 0,
      reliability: 0,
      productQuality: 0, // Solo para compradores
      deliveryTime: 0,   // Solo para compradores
      professionalism: 0 // Solo para vendedores calificando compradores
    }
  });
  
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submissionStep, setSubmissionStep] = useState('rating'); // 'rating' | 'confirmation' | 'success'
  
  // Datos del otro participante
  const [otherParticipant, setOtherParticipant] = useState(null);

  useEffect(() => {
    if (transaction && userRole) {
      const participant = userRole === 'buyer' 
        ? {
            name: transaction.sellerName,
            role: 'vendedor',
            phone: transaction.sellerPhone,
            email: transaction.sellerEmail
          }
        : {
            name: transaction.buyerName,
            role: 'comprador',
            phone: transaction.buyerPhone,
            email: transaction.buyerEmail
          };
      setOtherParticipant(participant);
    }
  }, [transaction, userRole]);

  // Resetear form cuando se abre el modal
  useEffect(() => {
    if (show) {
      setRating({
        overall: 0,
        categories: {
          communication: 0,
          reliability: 0,
          productQuality: 0,
          deliveryTime: 0,
          professionalism: 0
        }
      });
      setComment('');
      setIsAnonymous(false);
      setSubmissionStep('rating');
    }
  }, [show]);

  // Calcular rating promedio automáticamente
  useEffect(() => {
    const categories = rating.categories;
    const relevantCategories = userRole === 'buyer' 
      ? [categories.communication, categories.reliability, categories.productQuality, categories.deliveryTime]
      : [categories.communication, categories.reliability, categories.professionalism];
    
    const nonZeroRatings = relevantCategories.filter(r => r > 0);
    if (nonZeroRatings.length > 0) {
      const average = nonZeroRatings.reduce((sum, r) => sum + r, 0) / nonZeroRatings.length;
      setRating(prev => ({ ...prev, overall: Math.round(average) }));
    }
  }, [rating.categories, userRole]);

  const handleCategoryRatingChange = (category, value) => {
    setRating(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  const handleOverallRatingChange = (value) => {
    setRating(prev => ({ ...prev, overall: value }));
  };

  const validateRating = () => {
    if (rating.overall === 0) {
      return { valid: false, message: 'Debes seleccionar una calificación general' };
    }

    const requiredCategories = userRole === 'buyer' 
      ? ['communication', 'reliability', 'productQuality', 'deliveryTime']
      : ['communication', 'reliability', 'professionalism'];

    const missingCategories = requiredCategories.filter(cat => rating.categories[cat] === 0);
    if (missingCategories.length > 0) {
      return { 
        valid: false, 
        message: 'Debes calificar todas las categorías requeridas' 
      };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    const validation = validateRating();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    setSubmissionStep('confirmation');
  };

  const confirmSubmission = async () => {
    try {
      const ratingData = {
        rating: rating.overall,
        comment: comment.trim(),
        categories: rating.categories,
        isAnonymous
      };

      await handleRatingSubmission(transaction.id, ratingData);
      setSubmissionStep('success');
      
      // Notificar al componente padre
      onRatingSubmitted && onRatingSubmitted(ratingData);
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onHide();
      }, 2000);
    } catch (error) {
      console.error('Error enviando calificación:', error);
      setSubmissionStep('rating');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      communication: 'Comunicación',
      reliability: 'Confiabilidad',
      productQuality: 'Calidad del Producto',
      deliveryTime: 'Tiempo de Entrega',
      professionalism: 'Profesionalismo'
    };
    return labels[category] || category;
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      communication: '¿Qué tan bien se comunicó durante la transacción?',
      reliability: '¿Cumplió con lo acordado y fue confiable?',
      productQuality: '¿La calidad del producto coincidió con la descripción?',
      deliveryTime: '¿Entregó en el tiempo prometido?',
      professionalism: '¿Se comportó de manera profesional y respetuosa?'
    };
    return descriptions[category] || '';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    if (rating >= 2.5) return 'info';
    return 'danger';
  };

  if (!transaction || !otherParticipant) {
    return null;
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      className="rating-system-modal"
      backdrop={submissionStep === 'success' ? false : 'static'}
      keyboard={submissionStep !== 'confirmation'}
    >
      <Modal.Header closeButton={submissionStep !== 'confirmation'} className="border-0">
        <Modal.Title className="d-flex align-items-center">
          ⭐ Calificar Experiencia
          <Badge bg="info" className="ms-2">
            {userRole === 'buyer' ? 'Como Comprador' : 'Como Vendedor'}
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-4">
            <Alert.Heading>Error</Alert.Heading>
            <p className="mb-0">{error}</p>
          </Alert>
        )}

        {/* Transaction Summary */}
        <Card className="transaction-summary mb-4">
          <Card.Body className="p-3">
            <Row className="align-items-center">
              <Col md={8}>
                <h6 className="mb-1">
                  {transaction.items?.[0]?.cardName || 'Transacción'}
                </h6>
                <div className="text-muted small">
                  <span className="me-3">
                    💰 ₡{transaction.totalAmount?.toLocaleString()}
                  </span>
                  <span className="me-3">
                    📅 {transaction.createdAt?.toDate?.()?.toLocaleDateString('es-CR')}
                  </span>
                  <span>
                    #{transaction.id.slice(-8)}
                  </span>
                </div>
              </Col>
              <Col md={4} className="text-end">
                <div className="participant-info">
                  <div className="fw-bold">{otherParticipant.name}</div>
                  <div className="text-muted small">{otherParticipant.role}</div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Rating Steps */}
        {submissionStep === 'rating' && (
          <div className="rating-form">
            {/* Overall Rating */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">🌟 Calificación General</h6>
              </Card.Header>
              <Card.Body className="text-center py-4">
                <p className="mb-3">
                  ¿Cómo calificarías tu experiencia general con {otherParticipant.name}?
                </p>
                <div className="overall-rating mb-3">
                  <RatingStars
                    rating={rating.overall}
                    onRatingChange={handleOverallRatingChange}
                    size="large"
                    interactive={true}
                  />
                </div>
                <div className="rating-labels">
                  <small className="text-muted">
                    {rating.overall === 0 && 'Selecciona una calificación'}
                    {rating.overall === 1 && '⭐ Muy malo'}
                    {rating.overall === 2 && '⭐⭐ Malo'}
                    {rating.overall === 3 && '⭐⭐⭐ Regular'}
                    {rating.overall === 4 && '⭐⭐⭐⭐ Bueno'}
                    {rating.overall === 5 && '⭐⭐⭐⭐⭐ Excelente'}
                  </small>
                </div>
              </Card.Body>
            </Card>

            {/* Category Ratings */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">📊 Calificaciones Detalladas</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.keys(rating.categories).map((category) => {
                    // Filtrar categorías según el rol
                    if (userRole === 'buyer' && category === 'professionalism') return null;
                    if (userRole === 'seller' && (category === 'productQuality' || category === 'deliveryTime')) return null;

                    return (
                      <Col md={6} key={category} className="mb-4">
                        <div className="category-rating">
                          <div className="category-header mb-2">
                            <div className="category-label fw-bold">
                              {getCategoryLabel(category)}
                            </div>
                            <div className="category-description small text-muted">
                              {getCategoryDescription(category)}
                            </div>
                          </div>
                          <div className="category-stars">
                            <RatingStars
                              rating={rating.categories[category]}
                              onRatingChange={(value) => handleCategoryRatingChange(category, value)}
                              size="medium"
                              interactive={true}
                            />
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>

            {/* Comment */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">💬 Comentario (Opcional)</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Comparte tu experiencia con ${otherParticipant.name}. Este comentario será visible públicamente...`}
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    {comment.length}/500 caracteres
                  </Form.Text>
                </Form.Group>
                
                <Form.Check
                  type="checkbox"
                  id="anonymous-rating"
                  label="Calificación anónima (solo visible el rating, no tu nombre)"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-3"
                />
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Confirmation Step */}
        {submissionStep === 'confirmation' && (
          <div className="confirmation-step">
            <Alert variant="info" className="mb-4">
              <Alert.Heading>🔍 Confirma tu Calificación</Alert.Heading>
              <p className="mb-0">
                Por favor revisa tu calificación antes de enviarla. 
                <strong> Una vez enviada no se puede modificar.</strong>
              </p>
            </Alert>

            <Card className="mb-4">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>📊 Resumen de Calificación</h6>
                    <div className="rating-summary">
                      <div className="overall-summary mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <span>Calificación General:</span>
                          <div className="d-flex align-items-center">
                            <RatingStars rating={rating.overall} size="small" />
                            <Badge bg={getRatingColor(rating.overall)} className="ms-2">
                              {rating.overall}/5
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {Object.keys(rating.categories).map((category) => {
                        if (userRole === 'buyer' && category === 'professionalism') return null;
                        if (userRole === 'seller' && (category === 'productQuality' || category === 'deliveryTime')) return null;
                        
                        return (
                          <div key={category} className="category-summary mb-2">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="small">{getCategoryLabel(category)}:</span>
                              <RatingStars rating={rating.categories[category]} size="small" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <h6>💬 Tu Comentario</h6>
                    <div className="comment-preview">
                      {comment.trim() ? (
                        <div className="border rounded p-3 bg-light">
                          <p className="mb-0 small">{comment}</p>
                        </div>
                      ) : (
                        <p className="text-muted small">Sin comentario</p>
                      )}
                    </div>
                    
                    <div className="privacy-info mt-3">
                      <small className="text-muted">
                        {isAnonymous ? (
                          <>🔒 Calificación anónima - Tu nombre no será visible</>
                        ) : (
                          <>👤 Calificación pública - Tu nombre será visible</>
                        )}
                      </small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Success Step */}
        {submissionStep === 'success' && (
          <div className="success-step text-center py-5">
            <div className="success-icon mb-3">
              ✅
            </div>
            <h4 className="text-success mb-3">¡Calificación Enviada!</h4>
            <p className="text-muted mb-4">
              Gracias por calificar tu experiencia con {otherParticipant.name}.
              Tu feedback ayuda a mejorar la comunidad.
            </p>
            <div className="final-rating">
              <RatingStars rating={rating.overall} size="large" />
              <div className="mt-2">
                <Badge bg={getRatingColor(rating.overall)} className="fs-6">
                  {rating.overall}/5 Estrellas
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        {submissionStep === 'rating' && (
          <>
            <Button variant="secondary" onClick={onHide}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={rating.overall === 0}
            >
              Revisar Calificación
            </Button>
          </>
        )}

        {submissionStep === 'confirmation' && (
          <>
            <Button 
              variant="outline-secondary" 
              onClick={() => setSubmissionStep('rating')}
            >
              ← Editar
            </Button>
            <Button 
              variant="success" 
              onClick={confirmSubmission}
              disabled={actionLoading}
            >
              {actionLoading ? '⏳ Enviando...' : '✅ Confirmar y Enviar'}
            </Button>
          </>
        )}

        {submissionStep === 'success' && (
          <Button variant="primary" onClick={onHide} className="mx-auto">
            Cerrar
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}