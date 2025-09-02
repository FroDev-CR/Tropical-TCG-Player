// Navbar.js
import React, { useState, useEffect, memo, useCallback } from 'react';
import { Navbar, Container, Nav, Button, NavDropdown } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import NotificationBadge from './NotificationBadge';
import { FaUser, FaShoppingCart, FaBook, FaHome, FaSignOutAlt, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import './Navbar.css';
import portadaImage from '../assets/images/portada2.png';
import logoImage from '../assets/images/logo.png';

const CustomNavbar = () => {
  const { user, logout, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  // Cerrar el menú cuando se navega a una nueva página
  useEffect(() => {
    setExpanded(false);
  }, [location]);

  // Manejo del scroll para ocultar/mostrar navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Solo ocultar si se ha hecho scroll hacia abajo más de 100px
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY && navbarVisible) {
          // Scrolling down
          setNavbarVisible(false);
        } else if (currentScrollY < lastScrollY && !navbarVisible) {
          // Scrolling up
          setNavbarVisible(true);
        }
      } else {
        // Si estamos cerca del top, siempre mostrar
        setNavbarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Throttle scroll event
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [lastScrollY, navbarVisible]);

  const handleLogout = async () => {
    try {
      await logout();
      console.log('👋 Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <Navbar 
        variant="dark" 
        expand="lg" 
        fixed="top" 
        className={`py-2 py-lg-3 shadow-sm custom-navbar ${navbarVisible ? 'navbar-visible' : 'navbar-hidden'}`}
        expanded={expanded}
        onToggle={(expanded) => setExpanded(expanded)}
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <img 
              src={logoImage} 
              alt="Tropical Players TCG Logo" 
              style={{ height: '55px' }}
              className="d-inline-block align-top"
            />
          </Navbar.Brand>
          
          <Navbar.Toggle 
            aria-controls="basic-navbar-nav" 
            className="border-0"
          />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {/* Enlaces principales */}

              <Nav.Link 
                as={Link} 
                to="/eventos" 
                className={`mx-2 mx-lg-3 nav-hover ${isActive('/eventos') ? 'active' : ''}`}
              >
                <FaCalendarAlt className="d-lg-none me-2" />
                Eventos
              </Nav.Link>

              {user && (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/marketplace" 
                    className={`mx-2 mx-lg-3 nav-hover ${isActive('/marketplace') ? 'active' : ''}`}
                  >
                    <FaShoppingCart className="d-lg-none me-2" />
                    Marketplace
                  </Nav.Link>
                  
                  <Nav.Link 
                    as={Link} 
                    to="/dashboard" 
                    className={`mx-2 mx-lg-3 nav-hover ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    <FaChartLine className="d-lg-none me-2" />
                    Dashboard
                  </Nav.Link>
                  
                  <Nav.Link 
                    as={Link} 
                    to="/perfil" 
                    className={`mx-2 mx-lg-3 nav-hover ${isActive('/perfil') ? 'active' : ''}`}
                  >
                    <FaUser className="d-lg-none me-2" />
                    Mi Perfil
                  </Nav.Link>
                  
                </>
              )}

              <Nav.Link 
                as={Link} 
                to="/binders" 
                className={`mx-2 mx-lg-3 nav-hover ${isActive('/binders') ? 'active' : ''}`}
              >
                <FaBook className="d-lg-none me-2" />
                Mis Binders
              </Nav.Link>


              {/* Notificaciones y autenticación */}
              <div className="d-flex align-items-center mt-3 mt-lg-0 gap-3">
                {user && (
                  <div className="d-none d-lg-block">
                    <NotificationBadge />
                  </div>
                )}
                
                {user ? (
                  <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2">
                    <div className="text-light small d-lg-none w-100 text-center">
                      Bienvenido, {user.displayName || user.email}
                    </div>
                    <div className="d-lg-none mb-2">
                      <NotificationBadge />
                    </div>
                    <Button 
                      variant="outline-light" 
                      onClick={handleLogout}
                      size="sm"
                      className="d-flex align-items-center gap-2 w-100 w-lg-auto justify-content-center tropical-button"
                    >
                      <FaSignOutAlt size={14} />
                      <span className="d-none d-lg-inline">Cerrar Sesión</span>
                      <span className="d-lg-none">Salir</span>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline-light" 
                    onClick={() => setShowAuthModal(true)}
                    size="sm"
                    className="w-100 w-lg-auto tropical-button"
                    data-auth-trigger
                  >
                    Ingresar
                  </Button>
                )}
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Espaciador para el contenido fijo */}
      <div style={{ height: '80px' }} className="d-none d-lg-block"></div>
      <div style={{ height: '70px' }} className="d-lg-none"></div>
      
      <AuthModal show={showAuthModal} handleClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default memo(CustomNavbar);