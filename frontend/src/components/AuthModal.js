import { useState } from 'react';
import { Modal, Button, Form, Tab, Tabs } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { formatCedula, formatPhone } from '../utils/validation';

const provinces = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

export default function AuthModal({ show, handleClose }) {
  const { register, login } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    phone: '',
    cedula: '',
    province: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Manejadores con formateo automático
  const handleCedulaChange = (e) => {
    const value = e.target.value;
    // Solo permitir números y guiones
    const cleaned = value.replace(/[^\d-]/g, '');
    // Formatear automáticamente
    const formatted = formatCedula(cleaned);
    setFormData({ ...formData, cedula: formatted });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Solo permitir números y guiones
    const cleaned = value.replace(/[^\d-]/g, '');
    // Formatear automáticamente
    const formatted = formatPhone(cleaned);
    setFormData({ ...formData, phone: formatted });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'register') {
        // Validación básica - solo campos obligatorios
        if (!formData.email || !formData.password || !formData.username) {
          setError('Email, contraseña y nombre de usuario son requeridos');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        // Llamar al backend para registro
        // Solo incluir campos no vacíos
        const registerData = {
          username: formData.username.toLowerCase().trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        };

        // Agregar campos opcionales solo si no están vacíos
        if (formData.fullName && formData.fullName.trim()) {
          registerData.fullName = formData.fullName.trim();
        }
        if (formData.phone && formData.phone.trim()) {
          registerData.phone = formData.phone.trim();
        }
        if (formData.cedula && formData.cedula.trim()) {
          registerData.cedula = formData.cedula.trim();
        }
        if (formData.province && formData.province.trim()) {
          registerData.province = formData.province.trim();
        }

        const result = await register(registerData);

        if (result.success) {
          toast.success("¡Registrado con éxito! Bienvenido a Tropical TCG");
          handleClose();
          // Limpiar formulario
          setFormData({
            email: '',
            password: '',
            username: '',
            fullName: '',
            phone: '',
            cedula: '',
            province: ''
          });
        } else {
          setError(result.error || 'Error en el registro');
        }

      } else {
        // Login
        if (!formData.email || !formData.password) {
          setError('Email y contraseña son requeridos');
          setLoading(false);
          return;
        }

        const result = await login(formData.email, formData.password);

        if (result.success) {
          toast.success(`¡Bienvenido de vuelta, ${result.user.username}!`);
          handleClose();
          // Limpiar formulario
          setFormData({
            email: '',
            password: '',
            username: '',
            fullName: '',
            phone: '',
            cedula: '',
            province: ''
          });
        } else {
          setError(result.error || 'Credenciales incorrectas');
        }
      }

    } catch (err) {
      console.error('Error de autenticación:', err);
      setError(err.message || 'Error de conexión. Intenta de nuevo.');
    }

    setLoading(false);
  };


  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} animation={true}>
      <Modal.Header closeButton>
        <Modal.Title>{activeTab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
          <Tab eventKey="login" title="Iniciar Sesión">
            <Form onSubmit={handleAuth}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Form.Group>
              {error && <div className="text-danger mb-3">{error}</div>}
              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? "Iniciando..." : "Ingresar"}
              </Button>
            </Form>
          </Tab>
          <Tab eventKey="register" title="Registrarse">
            <Form onSubmit={handleAuth}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre de usuario</Form.Label>
                <Form.Control
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="usuario123"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nombre completo</Form.Label>
                <Form.Control
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Tu nombre completo"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="tel"
                  required
                  placeholder="Ej: 8888-8888"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  maxLength={9}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Cédula *</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="Ej: 1-1234-5678"
                  value={formData.cedula}
                  onChange={handleCedulaChange}
                  maxLength={11}
                  title="Formato: #-####-#### (ej: 1-1234-5678)"
                />
                <Form.Text className="text-muted">
                  Formato costarricense: #-####-#### (requerido para verificación)
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Provincia</Form.Label>
                <Form.Select
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                >
                  <option value="">Seleccionar provincia</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </Form.Select>
              </Form.Group>
              {error && <div className="text-danger mb-3">{error}</div>}
              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? "Registrando..." : "Registrarse"}
              </Button>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
}
