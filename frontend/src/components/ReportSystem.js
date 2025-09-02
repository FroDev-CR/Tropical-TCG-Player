import { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { FaFlag, FaExclamationTriangle } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';

const REPORT_REASONS = [
  { value: 'fake_listing', label: 'Listado falso o engañoso' },
  { value: 'inappropriate_behavior', label: 'Comportamiento inapropiado' },
  { value: 'spam', label: 'Spam o contenido repetitivo' },
  { value: 'fraud', label: 'Intento de fraude' },
  { value: 'fake_cards', label: 'Venta de cartas falsas' },
  { value: 'poor_communication', label: 'Comunicación deficiente' },
  { value: 'other', label: 'Otro motivo' }
];

const ReportSystem = ({ show, onHide, reportedUserId, reportedUserName, listingId = null }) => {
  const { user, userData } = useCart();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitReport = async () => {
    if (!reason) {
      setError('Por favor selecciona un motivo para el reporte.');
      return;
    }

    if (!description.trim()) {
      setError('Por favor describe el problema.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reportData = {
        reporterId: user.uid,
        reporterName: userData?.username || userData?.displayName || user.email,
        reportedUserId,
        reportedUserName,
        listingId: listingId || null,
        reason,
        description: description.trim(),
        status: 'pending', // pending, under_review, resolved, dismissed
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(/* db */ null, 'reports'), reportData);

      // Limpiar formulario y cerrar modal
      setReason('');
      setDescription('');
      onHide();
      
      alert('Reporte enviado exitosamente. Nuestro equipo lo revisará pronto.');
    } catch (error) {
      console.error('Error enviando reporte:', error);
      setError('Error al enviar el reporte. Inténtalo de nuevo.');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    setError('');
    onHide();
  };

  if (!user) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Body className="text-center p-4">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <h5>Inicia sesión para reportar</h5>
          <p className="text-muted">Debes iniciar sesión para poder reportar usuarios.</p>
          <Button variant="primary" onClick={onHide}>Entendido</Button>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaFlag className="text-danger" />
          Reportar a {reportedUserName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Alert variant="info" className="mb-3">
          <small>
            <strong>Importante:</strong> Los reportes falsos pueden resultar en la suspensión de tu cuenta. 
            Solo reporta problemas legítimos.
          </small>
        </Alert>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Motivo del reporte:</Form.Label>
            <Form.Select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Selecciona un motivo...</option>
              {REPORT_REASONS.map(reasonOption => (
                <option key={reasonOption.value} value={reasonOption.value}>
                  {reasonOption.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descripción del problema:</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalladamente el problema que experimentaste con este usuario..."
              maxLength={1000}
              required
            />
            <Form.Text className="text-muted">
              {description.length}/1000 caracteres
            </Form.Text>
          </Form.Group>

          {listingId && (
            <Alert variant="secondary">
              <small>
                <strong>Listado relacionado:</strong> Este reporte está asociado con un listado específico.
              </small>
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button 
          variant="danger" 
          onClick={handleSubmitReport}
          disabled={!reason || !description.trim() || loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Enviando...
            </>
          ) : (
            <>
              <FaFlag className="me-2" />
              Enviar Reporte
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportSystem;