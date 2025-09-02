import { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Form, Button, Alert, Modal, Row, Col } from 'react-bootstrap';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [streams, setStreams] = useState([]); // Nuevo estado para streams
  const [carousel, setCarousel] = useState([]); // Nuevo estado para carrusel
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Configuración inicial
  const collections = {
    carousel: {
      fields: ['title', 'subtitle', 'imageUrl', 'mobileImageUrl', 'order', 'active'],
      labels: {
        title: 'Título',
        subtitle: 'Subtítulo',
        imageUrl: 'URL Imagen Desktop*',
        mobileImageUrl: 'URL Imagen Móvil',
        order: 'Orden de Aparición*',
        active: 'Activa'
      },
      required: ['imageUrl', 'order']
    },
    streams: {
      fields: ['title', 'youtubeUrl', 'scheduledTime', 'description', 'isLive'],
      labels: {
        title: 'Título del Stream*',
        youtubeUrl: 'URL de YouTube*',
        scheduledTime: 'Fecha y Hora*',
        description: 'Descripción',
        isLive: 'En Vivo'
      },
      required: ['title', 'youtubeUrl', 'scheduledTime']
    },
    events: {
      fields: ['title', 'date', 'description', 'price', 'image'],
      labels: {
        title: 'Título del Evento*',
        date: 'Fecha y Hora*',
        description: 'Descripción',
        price: 'Precio de Inscripción*',
        image: 'URL de la Imagen*'
      },
      required: ['title', 'date', 'price', 'image']
    },
    products: {
      fields: ['name', 'description', 'price', 'image', 'category'],
      labels: {
        name: 'Nombre del Producto*',
        description: 'Descripción',
        price: 'Precio*',
        image: 'URL de la Imagen*',
        category: 'Categoría'
      },
      required: ['name', 'price', 'image']
    }
  };

  // Cargar datos
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          // TODO: Replace with backend API calls
          console.log('🚧 AdminPanel: Firebase code commented out - using mock data');
          
          // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
          /*
          const eventsCol = collection(db, 'events');
          const eventsSnapshot = await getDocs(eventsCol);
          setEvents(eventsSnapshot.docs.map(d => ({
            id: d.id,
            title: d.data().title || 'Sin título',
            description: d.data().description || '',
            price: d.data().price || 0,
            date: d.data().date?.toDate() || new Date(),
            image: d.data().image || ''
          })));
          */

          // Mock data for development
          setEvents([
            {
              id: 'event-1',
              title: 'Torneo Pokémon TCG',
              description: 'Torneo mensual de Pokémon Trading Card Game',
              price: 2500,
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde hoy
              image: 'https://via.placeholder.com/400x300/4285f4/ffffff?text=Torneo+Pokemon'
            }
          ]);

          setProducts([
            {
              id: 'product-1',
              name: 'Booster Pack Pokémon',
              description: 'Sobre de cartas Pokémon con 11 cartas',
              price: 1500,
              image: 'https://via.placeholder.com/400x300/34a853/ffffff?text=Booster+Pack',
              category: 'Cartas'
            }
          ]);

          setStreams([
            {
              id: 'stream-1',
              title: 'Stream de Opening de Sobres',
              youtubeUrl: 'https://youtube.com/watch?v=example',
              scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // mañana
              description: 'Abriendo sobres de la nueva expansión',
              isLive: false
            }
          ]);

          setCarousel([
            {
              id: 'carousel-1',
              title: 'Bienvenidos a Tropical TCG',
              subtitle: 'Tu tienda de Trading Card Games en Costa Rica',
              imageUrl: 'https://via.placeholder.com/1200x400/ff6b6b/ffffff?text=Carousel+Desktop',
              mobileImageUrl: 'https://via.placeholder.com/800x600/ff6b6b/ffffff?text=Carousel+Mobile',
              order: 1,
              active: true
            }
          ]);
        } catch (error) {
          setError('Error cargando datos');
        }
      };
      fetchData();
    }
  }, [user]);

  // Validar URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Manejar envío de formulario
  const handleSubmit = async (e, type) => {
    e.preventDefault();
    try {
      // Validación de campos requeridos
      const missingFields = collections[type].required.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // Validar URL de YouTube
      if (type === 'streams' && !isValidUrl(formData.youtubeUrl)) {
        throw new Error('La URL de YouTube no es válida');
      }

      // TODO: Replace with backend API calls
      console.log('🚧 AdminPanel: Firebase submit commented out - using mock action');
      
      const dataToSave = {
        ...formData,
        ...(type === 'events' && { date: formData.date || new Date() }),
        ...(type === 'streams' && { scheduledTime: formData.scheduledTime || new Date() })
      };

      // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
      /*
      if (currentItem) {
        await updateDoc(doc(db, type, currentItem.id), dataToSave);
        setSuccess('Actualizado exitosamente!');
      } else {
        await addDoc(collection(db, type), {
          ...dataToSave,
          createdAt: new Date()
        });
        setSuccess('Creado exitosamente!');
      }
      */

      // Mock success for development
      console.log('Mock data saved:', { type, data: dataToSave });
      setSuccess(`🚧 Funcionalidad en desarrollo - ${currentItem ? 'Actualizado' : 'Creado'} exitosamente!`);

      resetForm();
    } catch (err) {
      setError(err.message);
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  // Editar elemento
  const handleEdit = (item, type) => {
    setCurrentItem(item);
    setFormData({
      ...item,
      date: item.date?.toDate ? item.date.toDate() : item.date,
      scheduledTime: item.scheduledTime?.toDate ? item.scheduledTime.toDate() : item.scheduledTime
    });
    setShowModal(true);
  };

  // Eliminar elemento
  const handleDelete = async (id, type) => {
    if (window.confirm('¿Confirmar eliminación?')) {
      try {
        // TODO: Replace with backend API call
        console.log('🚧 AdminPanel: Firebase delete commented out - using mock delete');
        
        // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
        /*
        await deleteDoc(doc(db, type, id));
        */

        // Mock delete for development
        console.log('Mock delete:', { type, id });
        
        if (type === 'events') {
          setEvents(events.filter(e => e.id !== id));
        } else if (type === 'products') {
          setProducts(products.filter(p => p.id !== id));
        } else if (type === 'streams') {
          setStreams(streams.filter(s => s.id !== id));
        } else if (type === 'carousel') {
          setCarousel(carousel.filter(c => c.id !== id));
        }
      } catch (error) {
        setError('Error eliminando el elemento');
      }
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({});
    setCurrentItem(null);
    setShowModal(false);
  };

  // Login
  if (!user) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="auth-box p-5 rounded-3 shadow">
          <h2 className="text-center mb-4">🚧 Panel Administrativo</h2>
          <Alert variant="info" className="text-center">
            <h5>Funcionalidad en Desarrollo</h5>
            <p className="mb-3">
              El panel administrativo está siendo migrado al nuevo backend. 
              Por ahora, puedes ver la interfaz de demostración.
            </p>
            <Button 
              variant="primary" 
              onClick={() => setUser({ uid: 'demo-admin', email: 'demo@admin.com' })}
              className="mb-2"
            >
              Ver Demo del Panel
            </Button>
          </Alert>
          
          {/* FIREBASE AUTH COMMENTED OUT - REPLACE WITH BACKEND API */}
          {/*
          <Form onSubmit={async (e) => {
            e.preventDefault();
            const { email, password } = e.target.elements;
            try {
              const userCred = await signInWithEmailAndPassword(
                getAuth(), 
                email.value, 
                password.value
              );
              setUser(userCred.user);
            } catch (err) {
              setError('Credenciales incorrectas');
            }
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" required />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control type="password" name="password" required />
            </Form.Group>
            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
            <Button variant="primary" type="submit" className="w-100">
              Ingresar
            </Button>
          </Form>
          */}
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5 admin-panel">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Panel de Administración</h2>
        <Button variant="danger" onClick={() => setUser(null)}>
          Cerrar Sesión
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="carousel" title="Carrusel">
          <Button 
            variant="success" 
            className="my-4"
            onClick={() => {
              setCurrentItem(null);
              setShowModal(true);
            }}
          >
            Crear Nueva Imagen
          </Button>

          <Row xs={1} md={2} lg={3} className="g-4">
            {carousel.sort((a, b) => a.order - b.order).map(item => (
              <Col key={item.id}>
                <div className="card h-100 shadow-sm">
                  <img 
                    src={item.imageUrl || 'https://via.placeholder.com/200x200'} 
                    alt={item.title}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{item.title}</h5>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${item.active ? 'bg-success' : 'bg-secondary'}`}>
                          {item.active ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className="badge bg-primary">#{item.order}</span>
                      </div>
                    </div>
                    <p className="card-text text-muted small">
                      {item.subtitle || 'Sin subtítulo'}
                    </p>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEdit(item, 'carousel')}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(item.id, 'carousel')}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Tab>
        <Tab eventKey="events" title="Eventos">
          <Button 
            variant="success" 
            className="my-4"
            onClick={() => {
              setCurrentItem(null);
              setShowModal(true);
            }}
          >
            Crear Nuevo Evento
          </Button>

          <Row xs={1} md={2} lg={3} className="g-4">
            {events.map(item => (
              <Col key={item.id}>
                <div className="card h-100 shadow-sm">
                  <img 
                    src={item.image || 'https://via.placeholder.com/200x200'} 
                    alt={item.title}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text text-muted small">
                      {item.description?.substring(0, 100) || 'Sin descripción'}...
                    </p>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEdit(item, 'events')}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(item.id, 'events')}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Tab>
        <Tab eventKey="products" title="Productos">
          <Button 
            variant="success" 
            className="my-4"
            onClick={() => {
              setCurrentItem(null);
              setShowModal(true);
            }}
          >
            Crear Nuevo Producto
          </Button>

          <Row xs={1} md={2} lg={3} className="g-4">
            {products.map(item => (
              <Col key={item.id}>
                <div className="card h-100 shadow-sm">
                  <img 
                    src={item.image || 'https://via.placeholder.com/200x200'} 
                    alt={item.name}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text text-muted small">
                      {item.description?.substring(0, 100) || 'Sin descripción'}...
                    </p>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEdit(item, 'products')}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(item.id, 'products')}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Tab>
        <Tab eventKey="streams" title="Streams">
          <Button 
            variant="success" 
            className="my-4"
            onClick={() => {
              setCurrentItem(null);
              setShowModal(true);
            }}
          >
            Crear Nuevo Stream
          </Button>

          <Row xs={1} md={2} lg={3} className="g-4">
            {streams.map(item => (
              <Col key={item.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text text-muted small">
                      {item.description?.substring(0, 100) || 'Sin descripción'}...
                    </p>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEdit(item, 'streams')}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(item.id, 'streams')}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Tab>
      </Tabs>

      {/* Modal de edición */}
      <Modal show={showModal} onHide={resetForm} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentItem ? 'Editar' : 'Crear Nuevo'} {
              activeTab === 'events' ? 'Evento' : 
              activeTab === 'products' ? 'Producto' : 
              activeTab === 'streams' ? 'Stream' :
              activeTab === 'carousel' ? 'Imagen del Carrusel' : 'Elemento'
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => handleSubmit(e, activeTab)}>
            {collections[activeTab].fields.map(field => (
              <Form.Group key={field} className="mb-3">
                <Form.Label>
                  {collections[activeTab].labels[field]}
                  {collections[activeTab].required.includes(field) && ' *'}
                </Form.Label>
                
                {field === 'date' || field === 'scheduledTime' ? (
                  <DatePicker
                    selected={formData[field] || new Date()}
                    onChange={date => setFormData({...formData, [field]: date})}
                    showTimeSelect
                    dateFormat="Pp"
                    className="form-control"
                  />
                ) : field === 'isLive' || field === 'active' ? (
                  <Form.Check
                    type="switch"
                    label={field === 'isLive' ? 'En Vivo' : 'Activa'}
                    checked={formData[field] || false}
                    onChange={(e) => setFormData({...formData, [field]: e.target.checked})}
                  />
                ) : (
                  <Form.Control
                    type={field === 'price' || field === 'order' ? 'number' : 'text'}
                    value={formData[field] || ''}
                    onChange={(e) => 
                      setFormData({...formData, [field]: e.target.value})
                    }
                    required={collections[activeTab].required.includes(field)}
                    placeholder={
                      field === 'image' || field === 'imageUrl' ? 'https://ejemplo.com/imagen.jpg' : 
                      field === 'mobileImageUrl' ? 'https://ejemplo.com/imagen-movil.jpg (opcional)' :
                      field === 'order' ? '1, 2, 3...' : ''
                    }
                  />
                )}
              </Form.Group>
            ))}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {currentItem ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminPanel;