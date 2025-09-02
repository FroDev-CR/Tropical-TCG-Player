// src/components/DisputeManager.js
// Sistema completo de gestión de disputas P2P

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Card, Badge, Row, Col, Tab, Nav } from 'react-bootstrap';
import { useP2PTransactions } from '../hooks/useP2PTransactions';
import './DisputeManager.css';

export default function DisputeManager({ 
  show, 
  onHide, 
  transaction, 
  mode = 'create', // 'create' | 'view'
  disputeId = null,
  onDisputeCreated 
}) {
  const { handleDisputeCreation, actionLoading, error } = useP2PTransactions();
  
  const [disputeData, setDisputeData] = useState({
    type: '',
    description: '',
    evidence: [],
    severity: 'medium'
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submissionStep, setSubmissionStep] = useState('form'); // 'form' | 'preview' | 'success'
  const [otherParticipant, setOtherParticipant] = useState(null);

  // Determinar el otro participante
  useEffect(() => {
    if (transaction) {
      // Aquí asumiríamos que tenemos info del usuario actual
      // Por simplicidad, vamos a usar el vendedor como el "otro"
      setOtherParticipant({
        name: transaction.sellerName,
        role: 'vendedor',
        id: transaction.sellerId
      });
    }
  }, [transaction]);

  // Resetear form cuando se abre
  useEffect(() => {
    if (show && mode === 'create') {
      setDisputeData({
        type: '',
        description: '',
        evidence: [],
        severity: 'medium'
      });
      setSelectedFiles([]);
      setSubmissionStep('form');
    }
  }, [show, mode]);

  const handleInputChange = (field, value) => {
    setDisputeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      // Validar tipo de archivo (imágenes y PDFs)
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024; // 5MB max
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Máximo 5 archivos
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!disputeData.type) {
      return { valid: false, message: 'Selecciona el tipo de disputa' };
    }
    
    if (!disputeData.description.trim() || disputeData.description.length < 20) {
      return { valid: false, message: 'La descripción debe tener al menos 20 caracteres' };
    }
    
    return { valid: true };
  };

  const handleSubmit = () => {
    const validation = validateForm();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
    setSubmissionStep('preview');
  };

  const confirmSubmission = async () => {
    try {
      // Simular subida de archivos (en implementación real se subirían a Firebase Storage)
      const evidenceUrls = selectedFiles.map(file => URL.createObjectURL(file));
      
      const finalDisputeData = {
        ...disputeData,
        evidence: evidenceUrls
      };

      await handleDisputeCreation(transaction.id, finalDisputeData);
      setSubmissionStep('success');
      
      onDisputeCreated && onDisputeCreated(finalDisputeData);
      
      // Cerrar modal después de 3 segundos
      setTimeout(() => {
        onHide();
      }, 3000);
    } catch (error) {
      console.error('Error creando disputa:', error);
      setSubmissionStep('form');
    }
  };

  const disputeTypes = [
    {
      id: 'not_received',
      label: 'Producto no recibido',
      description: 'No he recibido el producto después del tiempo acordado',
      icon: '📦❌'
    },
    {
      id: 'wrong_item',
      label: 'Producto incorrecto',
      description: 'El producto recibido no coincide con la descripción',
      icon: '🔄❌'
    },
    {
      id: 'damaged_item',
      label: 'Producto dañado',
      description: 'El producto llegó en peores condiciones de las descritas',
      icon: '💔'
    },
    {
      id: 'payment_issue',
      label: 'Problema de pago',
      description: 'Hay problemas con el proceso de pago',
      icon: '💳❌'
    },
    {
      id: 'communication',
      label: 'Falta de comunicación',
      description: 'El otro usuario no responde o no cumple acuerdos',
      icon: '📵'
    },
    {
      id: 'fraud',
      label: 'Posible fraude',
      description: 'Sospecho de actividad fraudulenta',
      icon: '🚨'
    },
    {
      id: 'other',
      label: 'Otro problema',
      description: 'Un problema que no está en las categorías anteriores',
      icon: '❓'
    }
  ];

  const severityLevels = [
    { value: 'low', label: 'Baja', description: 'Problema menor, espero resolverlo amigablemente', color: 'info' },
    { value: 'medium', label: 'Media', description: 'Problema significativo que requiere mediación', color: 'warning' },
    { value: 'high', label: 'Alta', description: 'Problema grave que puede requerir acción administrativa', color: 'danger' }
  ];

  if (!transaction) {
    return null;
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      className="dispute-manager-modal"
      backdrop="static"
    >
      <Modal.Header closeButton={submissionStep !== 'preview'} className="border-0">
        <Modal.Title className="d-flex align-items-center">
          🚨 {mode === 'create' ? 'Reportar Problema' : 'Ver Disputa'}
          <Badge bg="warning" className="ms-2">
            #{transaction.id.slice(-8)}
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
                  <span className="me-3">💰 ₡{transaction.totalAmount?.toLocaleString()}</span>
                  <span className="me-3">📅 {transaction.createdAt?.toDate?.()?.toLocaleDateString('es-CR')}</span>
                  <span className="me-3">📊 {transaction.status}</span>
                </div>
              </Col>
              <Col md={4} className="text-end">
                {otherParticipant && (
                  <div className="participant-info">
                    <div className="fw-bold">{otherParticipant.name}</div>
                    <div className="text-muted small">{otherParticipant.role}</div>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Form Step */}
        {submissionStep === 'form' && mode === 'create' && (
          <div className="dispute-form">
            {/* Warning Alert */}
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>⚠️ Importante</Alert.Heading>
              <p className="mb-2">
                Antes de reportar un problema, te recomendamos intentar comunicarte directamente 
                con {otherParticipant?.name} para resolver la situación.
              </p>
              <p className="mb-0">
                Las disputas falsas o malintencionadas pueden resultar en suspensión de tu cuenta.
              </p>
            </Alert>

            {/* Dispute Type Selection */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">🏷️ Tipo de Problema</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  {disputeTypes.map((type) => (
                    <Col md={6} key={type.id} className="mb-3">
                      <div 
                        className={`dispute-type-card ${disputeData.type === type.id ? 'selected' : ''}`}
                        onClick={() => handleInputChange('type', type.id)}
                        role="button"
                      >
                        <div className="dispute-icon">{type.icon}</div>
                        <div className="dispute-info">
                          <div className="dispute-label">{type.label}</div>
                          <div className="dispute-description">{type.description}</div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            {/* Description */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">📝 Descripción Detallada</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Explica qué pasó en detalle *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={disputeData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe el problema de manera clara y detallada. Incluye fechas, conversaciones relevantes, y cualquier información que ayude a entender la situación..."
                    maxLength={1000}
                  />
                  <Form.Text className="text-muted">
                    {disputeData.description.length}/1000 caracteres (mínimo 20)
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Evidence Upload */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">📎 Evidencia (Opcional)</h6>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  Sube capturas de pantalla, fotos del producto, conversaciones de WhatsApp, 
                  o cualquier evidencia que respalde tu caso.
                </p>
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileSelection}
                  />
                  <Form.Text className="text-muted">
                    Máximo 5 archivos, 5MB cada uno. Formatos: JPG, PNG, GIF, PDF
                  </Form.Text>
                </Form.Group>

                {selectedFiles.length > 0 && (
                  <div className="selected-files">
                    <h6>Archivos seleccionados:</h6>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item d-flex align-items-center justify-content-between mb-2">
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size text-muted ms-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          ❌
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Severity Level */}
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">⚡ Nivel de Gravedad</h6>
              </Card.Header>
              <Card.Body>
                {severityLevels.map((level) => (
                  <Form.Check
                    key={level.value}
                    type="radio"
                    name="severity"
                    id={`severity-${level.value}`}
                    label={
                      <div className="severity-option">
                        <div className="d-flex align-items-center">
                          <Badge bg={level.color} className="me-2">{level.label}</Badge>
                          <span className="fw-bold">{level.label}</span>
                        </div>
                        <div className="text-muted small">{level.description}</div>
                      </div>
                    }
                    checked={disputeData.severity === level.value}
                    onChange={() => handleInputChange('severity', level.value)}
                    className="mb-3"
                  />
                ))}
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Preview Step */}
        {submissionStep === 'preview' && (
          <div className="dispute-preview">
            <Alert variant="info" className="mb-4">
              <Alert.Heading>🔍 Revisar Reporte</Alert.Heading>
              <p className="mb-0">
                Por favor revisa toda la información antes de enviar el reporte. 
                Una vez enviado, no se puede modificar.
              </p>
            </Alert>

            <Card className="mb-4">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>📋 Información del Reporte</h6>
                    <div className="preview-info">
                      <div className="mb-3">
                        <strong>Tipo de problema:</strong>
                        <div className="mt-1">
                          {disputeTypes.find(t => t.id === disputeData.type)?.icon} {' '}
                          {disputeTypes.find(t => t.id === disputeData.type)?.label}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Gravedad:</strong>
                        <div className="mt-1">
                          <Badge bg={severityLevels.find(s => s.value === disputeData.severity)?.color}>
                            {severityLevels.find(s => s.value === disputeData.severity)?.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Evidencia adjunta:</strong>
                        <div className="mt-1">
                          {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <h6>💬 Descripción</h6>
                    <div className="description-preview">
                      <div className="border rounded p-3 bg-light">
                        <p className="mb-0">{disputeData.description}</p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Alert variant="warning" className="mb-4">
              <p className="mb-0">
                <strong>📧 Próximos pasos:</strong> Se enviará una notificación a {otherParticipant?.name} 
                y al equipo de moderación. Intentaremos resolver la situación de manera justa para ambas partes.
              </p>
            </Alert>
          </div>
        )}

        {/* Success Step */}
        {submissionStep === 'success' && (
          <div className="dispute-success text-center py-5">
            <div className="success-icon mb-3">
              ✅
            </div>
            <h4 className="text-success mb-3">¡Reporte Enviado!</h4>
            <p className="text-muted mb-4">
              Tu reporte ha sido enviado exitosamente. Nuestro equipo de moderación 
              lo revisará en las próximas 24-48 horas.
            </p>
            <div className="next-steps">
              <h6>📋 Próximos pasos:</h6>
              <ul className="text-start">
                <li>Se notificará a {otherParticipant?.name} sobre el reporte</li>
                <li>Un moderador revisará el caso</li>
                <li>Se te contactará si se necesita información adicional</li>
                <li>Se intentará mediar una solución justa</li>
              </ul>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        {submissionStep === 'form' && mode === 'create' && (
          <>
            <Button variant="secondary" onClick={onHide}>
              Cancelar
            </Button>
            <Button 
              variant="warning" 
              onClick={handleSubmit}
              disabled={!disputeData.type || !disputeData.description.trim()}
            >
              Revisar Reporte
            </Button>
          </>
        )}

        {submissionStep === 'preview' && (
          <>
            <Button 
              variant="outline-secondary" 
              onClick={() => setSubmissionStep('form')}
            >
              ← Editar
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmSubmission}
              disabled={actionLoading}
            >
              {actionLoading ? '⏳ Enviando...' : '🚨 Enviar Reporte'}
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