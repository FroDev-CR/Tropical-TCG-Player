import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Spinner, Row, Col, Nav, Badge, Modal, Image } from 'react-bootstrap';
import backendAPI from '../services/backendAPI';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaStar, FaEdit, FaSave, FaTimes, FaEye, FaCheckCircle, FaClock, FaShoppingCart, FaStore, FaUser, FaChartLine, FaCamera } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import RatingSystem from '../components/RatingSystem';
import DashboardContent from '../components/DashboardContent';

const provinces = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

const StatusBadge = ({ status }) => {
  const statusConfig = {
    initiated: { variant: 'warning', label: 'Iniciada', icon: FaClock },
    contacted: { variant: 'info', label: 'Contactado', icon: FaEye },
    completed: { variant: 'success', label: 'Completada', icon: FaCheckCircle },
    rated: { variant: 'primary', label: 'Calificada', icon: FaStar }
  };

  const config = statusConfig[status] || statusConfig.initiated;
  const IconComponent = config.icon;

  return (
    <Badge bg={config.variant} className="d-flex align-items-center gap-1">
      <IconComponent size={12} />
      {config.label}
    </Badge>
  );
};

const TransactionCard = ({ transaction, type, onRateUser, onUpdateStatus }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const isCompletedAndCanRate = transaction.status === 'completed' && type === 'purchases';
  const canMarkAsCompleted = transaction.status === 'contacted' && type === 'sales';

  return (
    <>
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={2}>
              <div className="text-center">
                <div className="text-muted small">ID: #{transaction.id.slice(-6)}</div>
                <div className="text-muted small">{new Date(transaction.createdAt).toLocaleDateString()}</div>
              </div>
            </Col>
            <Col md={3}>
              <div>
                <strong>{type === 'purchases' ? 'Vendedor:' : 'Comprador:'}</strong>
                <div>{type === 'purchases' ? 
                  transaction.items[0]?.sellerName || 'Desconocido' : 
                  transaction.buyerName || 'Desconocido'}</div>
              </div>
            </Col>
            <Col md={2}>
              <div className="text-center">
                <strong>₡${transaction.totalAmount.toFixed(2)}</strong>
                <div className="text-muted small">{transaction.items.length} carta{transaction.items.length > 1 ? 's' : ''}</div>
              </div>
            </Col>
            <Col md={2}>
              <div className="text-center">
                <StatusBadge status={transaction.status} />
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex gap-2 justify-content-end">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                >
                  <FaEye className="me-1" size={12} />
                  Ver detalles
                </Button>
                
                {isCompletedAndCanRate && (
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => onRateUser(transaction)}
                  >
                    <FaStar className="me-1" size={12} />
                    Calificar
                  </Button>
                )}
                
                {canMarkAsCompleted && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onUpdateStatus(transaction.id, 'completed')}
                  >
                    <FaCheckCircle className="me-1" size={12} />
                    Marcar completada
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles de Transacción #{transaction.id.slice(-6)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6}>
              <strong>Fecha:</strong> {new Date(transaction.createdAt).toLocaleString()}
            </Col>
            <Col md={6}>
              <strong>Estado:</strong> <StatusBadge status={transaction.status} />
            </Col>
            <Col md={6} className="mt-2">
              <strong>{type === 'purchases' ? 'Vendedor:' : 'Comprador:'}</strong>
              {type === 'purchases' ? 
                transaction.items[0]?.sellerName || 'Desconocido' : 
                transaction.buyerName || 'Desconocido'}
            </Col>
            <Col md={6} className="mt-2">
              <strong>Total:</strong> ₡${transaction.totalAmount.toFixed(2)}
            </Col>
          </Row>

          <h6>Cartas:</h6>
          <div className="row g-2">
            {transaction.items.map((item, index) => (
              <Col key={index} sm={6} md={4}>
                <Card className="h-100">
                  <Row className="g-0">
                    <Col xs={4}>
                      <img
                        src={item.cardImage || 'https://via.placeholder.com/100'}
                        alt={item.cardName}
                        className="img-fluid rounded-start"
                        style={{ height: '80px', objectFit: 'contain' }}
                      />
                    </Col>
                    <Col xs={8}>
                      <Card.Body className="p-2">
                        <Card.Title className="fs-6 mb-1">{item.cardName}</Card.Title>
                        <div className="small text-muted">
                          <div>₡${item.price} · {item.condition}</div>
                          <div>Cantidad: {item.quantity}</div>
                        </div>
                      </Card.Body>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </div>

          {transaction.status === 'initiated' && type === 'purchases' && (
            <Alert variant="info" className="mt-3">
              <strong>Próximos pasos:</strong> Los enlaces de WhatsApp se abrieron automáticamente para contactar a los vendedores. 
              Una vez que confirmes la compra, el vendedor marcará la transacción como completada.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const StarDisplay = ({ rating }) => {
  const fullStars = Math.round(rating);
  return (
    <div className="d-flex justify-content-center mb-2">
      {Array.from({ length: 5 }, (_, index) => (
        <FaStar
          key={index}
          size={22}
          style={{ marginRight: '4px' }}
          color={index < fullStars ? '#FFD700' : '#ddd'}
        />
      ))}
    </div>
  );
};

export default function Profile() {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [transactions, setTransactions] = useState({ purchases: [], sales: [] });
  const [transactionType, setTransactionType] = useState('purchases');
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [ratingModal, setRatingModal] = useState({
    show: false,
    transaction: null,
    userRole: null
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Cargar datos del usuario desde el backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setLoadingProfile(true);
          // Obtener datos completos del perfil desde el backend
          const response = await backendAPI.getProfile();
          
          if (response.success) {
            setUserData(response.data);
            setFormData(response.data);
          } else {
            // Fallback a datos del contexto si falla la API
            console.warn('Failed to fetch profile from API, using context data');
            setUserData(user);
            setFormData(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback a datos del contexto si hay error
          setUserData(user);
          setFormData(user);
          setError('Error cargando datos del perfil. Mostrando datos básicos.');
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  useEffect(() => {
    if (user && activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [user, activeTab]);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      // Por ahora simularemos transacciones hasta implementar el endpoint
      // TODO: Implementar endpoint /api/v1/transactions cuando esté listo
      const mockTransactions = {
        purchases: [],
        sales: []
      };
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
    setLoadingTransactions(false);
  };

  const handleRateUser = (transaction) => {
    setRatingModal({
      show: true,
      transaction: transaction,
      userRole: 'buyer' // El usuario que está calificando es el comprador en Profile.js
    });
  };

  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      // TODO: Implementar endpoint para actualizar estado de transacción
      console.log('Actualizando transacción:', transactionId, 'a estado:', newStatus);
      await fetchTransactions(); // Refrescar la lista
      alert('Estado de transacción actualizado correctamente');
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('Error al actualizar el estado de la transacción');
    }
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      
      setSelectedPhoto(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedPhoto || !user) return null;
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedPhoto);
      
      const response = await backendAPI.post('/api/v1/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        return response.data.profilePhoto;
      }
      
      throw new Error(response.data.message || 'Error subiendo foto');
    } catch (error) {
      console.error('Error subiendo foto:', error);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      if (user) {
        let updatedData = { ...formData };
        
        // Si hay una nueva foto seleccionada, subirla
        if (selectedPhoto) {
          try {
            const photoData = await uploadPhoto();
            if (photoData) {
              updatedData.profilePhoto = photoData;
            }
          } catch (photoError) {
            console.error('Error subiendo foto:', photoError);
            setError('Error subiendo la foto de perfil');
            setSaving(false);
            return;
          }
        }
        
        // Actualizar perfil usando la API
        const response = await backendAPI.put('/api/v1/users/profile', updatedData);
        
        if (response.data.success) {
          // Limpiar estados de foto
          setSelectedPhoto(null);
          setPhotoPreview(null);
          
          setEditMode(false);
          setSuccess('Perfil actualizado correctamente');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          throw new Error(response.data.message || 'Error actualizando perfil');
        }
      }
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <Card className="shadow-sm">
          <Card.Body>
            <h3>Debes iniciar sesión</h3>
            <p className="text-muted">Inicia sesión para ver tu perfil y gestionar tus datos.</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container className="py-5">
        <h2 className="section-title text-center mb-4">Mi Perfil</h2>
        
        {/* Navegación por pestañas */}
        <Nav variant="pills" className="justify-content-center mb-4">
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')}
              className="d-flex align-items-center gap-2"
            >
              <FaUser size={16} />
              Información Personal
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'transactions'} 
              onClick={() => setActiveTab('transactions')}
              className="d-flex align-items-center gap-2"
            >
              <FaShoppingCart size={16} />
              Mis Transacciones
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              className="d-flex align-items-center gap-2"
            >
              <FaChartLine size={16} />
              Dashboard
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Contenido de la pestaña de perfil */}
        {activeTab === 'profile' && userData && (
          <Row>
            <Col lg={8} className="mx-auto">
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Información Personal</h3>
                    <Button 
                      onClick={() => setEditMode(!editMode)} 
                      variant={editMode ? "outline-secondary" : "outline-primary"}
                      className="d-flex align-items-center gap-2"
                    >
                      {editMode ? (
                        <>
                          <FaTimes size={14} />
                          Cancelar
                        </>
                      ) : (
                        <>
                          <FaEdit size={14} />
                          Editar
                        </>
                      )}
                    </Button>
                  </div>

                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}

                  {!editMode ? (
                    <div className="profile-info">
                      <Row className="align-items-start">
                        <Col md={3} className="text-center">
                          <div className="profile-photo mb-3">
                            <Image
                              src={userData.profilePhoto || 'https://via.placeholder.com/150x150?text=Sin+Foto'}
                              alt="Foto de perfil"
                              roundedCircle
                              style={{ width: '150px', height: '150px', objectFit: 'cover', border: '3px solid #dee2e6' }}
                            />
                          </div>
                          <div className="verification-badges">
                            {userData.verification?.email && (
                              <Badge bg="success" className="me-1 mb-1">✅ Email</Badge>
                            )}
                            {userData.verification?.phone && (
                              <Badge bg="success" className="me-1 mb-1">✅ Teléfono</Badge>
                            )}
                            {userData.verification?.identity && (
                              <Badge bg="success" className="me-1 mb-1">✅ Cédula</Badge>
                            )}
                          </div>
                        </Col>
                        <Col md={5}>
                          <h4 className="mb-3">{userData.fullName || userData.username || 'Usuario sin nombre'}</h4>
                          <div className="mb-2">
                            <strong>Usuario:</strong> @{userData.username || 'sin-usuario'}
                          </div>
                          <div className="mb-2">
                            <strong>Email:</strong> {userData.email || user.email || 'No registrado'}
                          </div>
                          {userData.cedula && (
                            <div className="mb-2">
                              <strong>Cédula:</strong> {userData.cedula}
                            </div>
                          )}
                          <div className="mb-2">
                            <strong>Teléfono:</strong> {userData.phone || 'No registrado'}
                          </div>
                          {userData.whatsapp && userData.whatsapp !== userData.phone && (
                            <div className="mb-2">
                              <strong>WhatsApp:</strong> {userData.whatsapp}
                            </div>
                          )}
                          <div className="mb-2">
                            <strong>Ubicación:</strong> {userData.province || 'No especificada'}
                          </div>
                          <div className="mb-2">
                            <strong>Miembro desde:</strong> {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Reciente'}
                          </div>
                          <div className="mb-2">
                            <strong>Nivel de confianza:</strong> 
                            <Badge 
                              bg={
                                userData.accountStatus?.trustLevel === 'premium' ? 'warning' :
                                userData.accountStatus?.trustLevel === 'trusted' ? 'success' :
                                userData.accountStatus?.trustLevel === 'verified' ? 'info' : 'secondary'
                              } 
                              className="ms-2"
                            >
                              {userData.accountStatus?.trustLevel || 'Nuevo'}
                            </Badge>
                          </div>
                        </Col>
                        <Col md={4} className="text-center">
                          <div className="mb-3">
                            <strong>Calificación:</strong>
                          </div>
                          <StarDisplay rating={userData.rating?.average || 0} />
                          <p className="text-muted small">
                            ({userData.rating?.average?.toFixed(1) || '0.0'} de 5, {userData.rating?.count || 0} reviews)
                          </p>

                          {(userData.whatsapp || userData.phone) && (
                            <Button
                              variant="success"
                              href={`https://wa.me/506${(userData.whatsapp || userData.phone).replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 d-flex align-items-center gap-2 mx-auto"
                            >
                              <FaWhatsapp size={16} />
                              Contactar por WhatsApp
                            </Button>
                          )}
                        </Col>
                      </Row>

                      {/* Estadísticas del usuario */}
                      <Row className="mt-4 pt-4 border-top">
                        <Col md={4} className="text-center">
                          <h5 className="text-primary">{userData.listings?.length || 0}</h5>
                          <small className="text-muted">Cartas en venta</small>
                        </Col>
                        <Col md={4} className="text-center">
                          <h5 className="text-success">{userData.binders?.length || 0}</h5>
                          <small className="text-muted">Binders creados</small>
                        </Col>
                        <Col md={4} className="text-center">
                          <h5 className="text-info">{userData.cart?.length || 0}</h5>
                          <small className="text-muted">En carrito</small>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Form onSubmit={handleUpdate}>
                      {/* Foto de perfil */}
                      <Form.Group className="mb-4 text-center">
                        <Form.Label>Foto de perfil</Form.Label>
                        <div className="profile-photo-upload">
                          <div className="current-photo mb-3">
                            <Image
                              src={photoPreview || formData.profilePhoto || 'https://via.placeholder.com/150x150?text=Sin+Foto'}
                              alt="Foto de perfil"
                              roundedCircle
                              style={{ width: '150px', height: '150px', objectFit: 'cover', border: '3px solid #dee2e6' }}
                            />
                          </div>
                          <div className="photo-upload-controls d-flex gap-2 justify-content-center">
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              style={{ display: 'none' }}
                              id="photo-upload"
                            />
                            <Button
                              variant="outline-primary"
                              onClick={() => document.getElementById('photo-upload').click()}
                              disabled={uploadingPhoto}
                            >
                              <FaCamera className="me-2" />
                              {selectedPhoto ? 'Cambiar Foto' : 'Subir Foto'}
                            </Button>
                            {selectedPhoto && (
                              <Button
                                variant="outline-secondary"
                                onClick={() => {
                                  setSelectedPhoto(null);
                                  setPhotoPreview(null);
                                }}
                              >
                                <FaTimes className="me-2" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                          {uploadingPhoto && (
                            <div className="mt-2">
                              <Spinner size="sm" animation="border" className="me-2" />
                              Subiendo foto...
                            </div>
                          )}
                          <Form.Text className="text-muted d-block mt-2">
                            Formatos: JPG, PNG, GIF. Máximo 5MB.
                          </Form.Text>
                        </div>
                      </Form.Group>

                      {/* Información básica */}
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nombre de usuario</Form.Label>
                            <Form.Control
                              value={formData.username || ''}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              placeholder="Tu nombre de usuario"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nombre completo</Form.Label>
                            <Form.Control
                              value={formData.fullName || ''}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Tu nombre completo según cédula"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Información de identidad */}
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Cédula de identidad *</Form.Label>
                            <Form.Control
                              value={formData.cedula || ''}
                              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                              placeholder="Ej: 1-1234-5678"
                              maxLength={12}
                            />
                            <Form.Text className="text-muted">
                              Requerido para verificación de identidad
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Fecha de nacimiento</Form.Label>
                            <Form.Control
                              type="date"
                              value={formData.birthDate || ''}
                              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Contacto */}
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control
                              type="tel"
                              value={formData.phone || ''}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="Ej: 8888-8888"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>WhatsApp</Form.Label>
                            <Form.Control
                              type="tel"
                              value={formData.whatsapp || ''}
                              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                              placeholder="Número de WhatsApp (si es diferente)"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Provincia</Form.Label>
                        <Form.Select
                          value={formData.province || ''}
                          onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        >
                          <option value="">Selecciona una provincia</option>
                          {provinces.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <div className="d-flex gap-2 justify-content-end">
                        <Button 
                          type="submit" 
                          variant="primary"
                          disabled={saving}
                          className="d-flex align-items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <Spinner size="sm" animation="border" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <FaSave size={14} />
                              Guardar Cambios
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Contenido de la pestaña de transacciones */}
        {activeTab === 'transactions' && (
          <div>
            <Nav variant="pills" className="justify-content-center mb-4">
              <Nav.Item>
                <Nav.Link 
                  active={transactionType === 'purchases'} 
                  onClick={() => setTransactionType('purchases')}
                  className="d-flex align-items-center gap-2"
                >
                  <FaShoppingCart size={16} />
                  Compras ({transactions.purchases.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={transactionType === 'sales'} 
                  onClick={() => setTransactionType('sales')}
                  className="d-flex align-items-center gap-2"
                >
                  <FaStore size={16} />
                  Ventas ({transactions.sales.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {loadingTransactions ? (
              <div className="text-center">
                <Spinner animation="border" role="status" />
                <p className="mt-3 text-muted">Cargando transacciones...</p>
              </div>
            ) : (() => {
              const currentTransactions = transactions[transactionType] || [];
              
              return currentTransactions.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <h5>No hay {transactionType === 'purchases' ? 'compras' : 'ventas'} registradas</h5>
                  <p className="mb-0">
                    {transactionType === 'purchases' 
                      ? 'Cuando realices compras, aparecerán aquí.' 
                      : 'Cuando realices ventas, aparecerán aquí.'}
                  </p>
                </Alert>
              ) : (
                <div>
                  {currentTransactions.map(transaction => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      type={transactionType}
                      onRateUser={handleRateUser}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Contenido de la pestaña Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardContent user={user} />
        )}
      </Container>

      {ratingModal.show && ratingModal.transaction && (
        <RatingSystem
          show={ratingModal.show}
          onHide={() => setRatingModal({ show: false, transaction: null, userRole: null })}
          transaction={ratingModal.transaction}
          userRole={ratingModal.userRole}
          onRatingSubmitted={(ratingData) => {
            console.log('Rating submitted:', ratingData);
            setRatingModal({ show: false, transaction: null, userRole: null });
            // Opcionalmente refrescar transacciones
            fetchTransactions();
          }}
        />
      )}
    </motion.div>
  );
}
