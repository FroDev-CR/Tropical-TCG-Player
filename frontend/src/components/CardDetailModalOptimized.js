// src/components/CardDetailModalOptimized.js
import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Button, Card, Spinner, Alert, Table, Tab, Tabs } from 'react-bootstrap';
import { FaHeart, FaShoppingCart, FaWhatsapp, FaEnvelope, FaPhone, FaStar, FaExchangeAlt, FaInfoCircle, FaRocket, FaDragon, FaGamepad, FaMagic, FaSkull, FaUser } from 'react-icons/fa';
import { GiPirateCaptain, GiRobotGolem } from 'react-icons/gi';
// Comentado Firebase - ahora usa backend API
// import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
import { useCart } from '../contexts/CartContext';
import { useAuthActions } from '../hooks/useAuthActions';
import ReactStars from 'react-rating-stars-component';
import '../styles/CardDetailModal.css';

// Configuración de iconos para TCGs
const TCG_ICONS = {
  pokemon: { icon: FaRocket, color: 'primary', name: 'Pokémon' },
  onepiece: { icon: GiPirateCaptain, color: 'warning', name: 'One Piece' },
  dragonball: { icon: FaDragon, color: 'danger', name: 'Dragon Ball' },
  digimon: { icon: FaGamepad, color: 'info', name: 'Digimon' },
  magic: { icon: FaMagic, color: 'secondary', name: 'Magic' },
  unionarena: { icon: FaSkull, color: 'dark', name: 'Union Arena' },
  gundam: { icon: GiRobotGolem, color: 'success', name: 'Gundam' }
};

export default function CardDetailModalOptimized({ show, onHide, card }) {
  const [favorites, setFavorites] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellersError, setSellersError] = useState('');
  const { addToCart } = useCart();
  const { user, protectedAction } = useAuthActions();

  // Función para formatear información del set
  const formatSetInfo = (set) => {
    if (!set) return 'Set desconocido';
    
    if (typeof set === 'string') {
      return set;
    }
    
    if (typeof set === 'object' && set !== null) {
      const name = set.name || '';
      const series = set.series || '';
      
      if (name && series) {
        return `${name}, ${series}`;
      } else if (name) {
        return name;
      } else if (series) {
        return series;
      } else {
        return 'Set desconocido';
      }
    }
    
    return String(set);
  };

  // Función utilitaria para formatear cualquier campo que pueda ser un objeto
  const formatCardField = (field, fallback = 'N/A') => {
    if (!field) return fallback;
    
    if (typeof field === 'string' || typeof field === 'number') {
      return String(field);
    }
    
    if (typeof field === 'object') {
      if (field.name) {
        return String(field.name);
      }
      if (Array.isArray(field)) {
        return field.map(item => typeof item === 'object' ? (item.name || String(item)) : String(item)).join(', ');
      }
      return fallback;
    }
    
    return String(field);
  };

  // Cargar favoritos del localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Buscar vendedores cuando se abre el modal
  useEffect(() => {
    if (show && card?.id) {
      searchSellers();
    }
  }, [show, card?.id]);

  const searchSellers = async () => {
    if (!card?.id) return;

    setLoadingSellers(true);
    setSellersError('');

    try {
      // TODO: Integrar con backend API para buscar listings
      // Por ahora usar sellers que vienen con la carta desde las APIs externas
      let sellersWithData = [];
      
      if (card.sellers && card.sellers.length > 0) {
        // Usar sellers que vienen con la carta
        sellersWithData = card.sellers.map(seller => ({
          ...seller,
          cardId: card.id,
          cardName: card.name,
          cardImage: card.images?.small
        }));
      } else {
        // Generar algunos sellers de muestra si no hay datos
        sellersWithData = [
          {
            id: `sample-${card.id}-1`,
            cardId: card.id,
            cardName: card.name,
            cardImage: card.images?.small,
            price: Math.floor(Math.random() * 5000) + 1500,
            condition: 'Near Mint',
            quantity: 1,
            sellerName: 'Vendedor Local',
            sellerRating: 4.5,
            sellerReviews: 15,
            location: 'San José'
          }
        ];
      }

      // Ordenar por precio (menor a mayor)
      sellersWithData.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      setSellers(sellersWithData);

    } catch (error) {
      console.error('Error searching sellers:', error);
      setSellersError('Error al cargar los vendedores. Inténtalo de nuevo.');
    }

    setLoadingSellers(false);
  };

  const toggleFavorite = (cardId) => {
    const newFavorites = favorites.includes(cardId) 
      ? favorites.filter(id => id !== cardId)
      : [...favorites, cardId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleAddToCart = (listing) => {
    const cartItem = {
      listingId: listing.id,
      cardId: listing.cardId,
      cardName: listing.cardName,
      cardImage: listing.cardImage,
      price: listing.price,
      condition: listing.condition,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      availableQuantity: listing.availableQuantity || listing.quantity,
      tcgType: listing.tcgType
    };

    addToCart(cartItem);
  };

  const getWhatsAppLink = (listing) => {
    const phone = listing.whatsapp || listing.phone || listing.userPhone || '';
    const message = `Hola! Me interesa tu carta: ${card?.name} - ${listing.condition} por ₡${listing.price}. ¿Está disponible?`;
    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const renderTCGBadge = (tcgType) => {
    const config = TCG_ICONS[tcgType] || TCG_ICONS.pokemon;
    const IconComponent = config.icon;
    
    return (
      <Badge bg={config.color} className="d-flex align-items-center gap-1">
        <IconComponent size={14} />
        {config.name}
      </Badge>
    );
  };

  if (!card) {
    return null;
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      centered
      fullscreen="md-down"
      className="card-detail-modal-optimized"
    >
      <div 
        className="modal-content-wrapper"
        style={{
          backgroundImage: 'url("/tropical tcg/background celeeste.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: window.innerWidth < 768 ? '0' : '20px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: window.innerWidth < 768 ? '100vh' : 'auto'
        }}
      >
        {/* Overlay para todo el modal */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)'
          }}
        ></div>
        
        <Modal.Header 
          closeButton 
          className="border-0 position-relative" 
          style={{ 
            background: 'transparent', 
            position: 'relative', 
            zIndex: 3,
            padding: window.innerWidth < 768 ? '1rem' : '1.5rem'
          }}
        >
          <div className="w-100 d-flex justify-content-between align-items-center">
            <div className="flex-grow-1">
              <div className="mb-2">{renderTCGBadge(card.tcgType)}</div>
              <Modal.Title 
                className={window.innerWidth < 768 ? 'h5' : 'h3'} 
                style={{ 
                  color: 'white', 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)', 
                  fontSize: window.innerWidth < 768 ? '1.3rem' : '1.8rem', 
                  fontWeight: 'bold',
                  fontFamily: 'Montserrat Alternates, sans-serif'
                }}
              >
                {card.name}
              </Modal.Title>
            </div>
            {/* Botón de favoritos */}
            <Button
              variant={favorites.includes(card.id) ? "danger" : "outline-light"}
              onClick={protectedAction(
                () => toggleFavorite(card.id),
                'Debes iniciar sesión para agregar cartas a favoritos'
              )}
              className="ms-2 rounded-circle p-2"
              style={{ 
                minWidth: '40px',
                minHeight: '40px',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.1)'
              }}
              title={favorites.includes(card.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <FaHeart size={16} />
            </Button>
          </div>
        </Modal.Header>

        <Modal.Body 
          className="position-relative" 
          style={{ 
            zIndex: 2,
            padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
            maxHeight: window.innerWidth < 768 ? 'calc(100vh - 120px)' : '70vh',
            overflowY: 'auto'
          }}
        >
          <Row className="g-3">
            {/* Imagen de la carta */}
            <Col 
              xs={12} 
              md={5} 
              lg={4} 
              className="text-center"
            >
              <div 
                className="card-image-container mb-3" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '15px',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <img
                  src={card.images?.large || card.images?.small || 'https://via.placeholder.com/300x400'}
                  alt={card.name}
                  className="img-fluid rounded shadow-lg"
                  style={{ 
                    maxHeight: window.innerWidth < 768 ? '250px' : '400px',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </Col>

            {/* Contenido de las tabs */}
            <Col xs={12} md={7} lg={8}>
              <div 
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(15px)',
                  borderRadius: '15px',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Tabs defaultActiveKey="details" className="custom-tabs">
                  {/* Tab de Detalles */}
                  <Tab eventKey="details" title="Detalles">
                    <div className="p-3">
                      {/* Información básica */}
                      <div className="mb-3">
                        <h6 className="text-light mb-2" style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}>
                          📋 Información Básica
                        </h6>
                        <Row className="g-2">
                          <Col xs={12} sm={6}>
                            <small className="text-muted">Set:</small>
                            <div className="text-light fw-bold">{formatSetInfo(card.set)}</div>
                          </Col>
                          <Col xs={12} sm={6}>
                            <small className="text-muted">Rareza:</small>
                            <div>
                              <Badge bg="secondary">{card.rarity || 'Sin especificar'}</Badge>
                            </div>
                          </Col>
                          {card.artist && (
                            <Col xs={12}>
                              <small className="text-muted">Artista:</small>
                              <div className="text-light">{formatCardField(card.artist)}</div>
                            </Col>
                          )}
                        </Row>
                      </div>

                      {/* Información específica por TCG */}
                      {card.tcgType === 'pokemon' && (
                        <div className="mb-3">
                          <h6 className="text-light mb-2" style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}>
                            ⚡ Datos Pokémon
                          </h6>
                          <Row className="g-2">
                            {card.hp && (
                              <Col xs={6}>
                                <small className="text-muted">HP:</small>
                                <div className="text-light fw-bold">{formatCardField(card.hp)}</div>
                              </Col>
                            )}
                            {card.types && (
                              <Col xs={6}>
                                <small className="text-muted">Tipo:</small>
                                <div className="text-light fw-bold">{formatCardField(card.types)}</div>
                              </Col>
                            )}
                            {card.attacks && card.attacks.length > 0 && (
                              <Col xs={12}>
                                <small className="text-muted">Ataques:</small>
                                <div className="text-light">{formatCardField(card.attacks.map(a => a.name))}</div>
                              </Col>
                            )}
                            {card.abilities && card.abilities.length > 0 && (
                              <Col xs={12}>
                                <small className="text-muted">Habilidades:</small>
                                <div className="text-light">{formatCardField(card.abilities.map(a => a.name))}</div>
                              </Col>
                            )}
                          </Row>
                        </div>
                      )}

                      {/* Habilidad/Efecto */}
                      {(card.ability || card.effect || card.flavorText) && (
                        <div className="mb-3">
                          <h6 className="text-light mb-2" style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}>
                            ✨ {card.ability ? 'Habilidad' : card.effect ? 'Efecto' : 'Descripción'}
                          </h6>
                          <div 
                            className="p-2 rounded text-light small"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.1)', 
                              backdropFilter: 'blur(5px)', 
                              border: '1px solid rgba(255, 255, 255, 0.2)' 
                            }}
                          >
                            {formatCardField(card.ability || card.effect || card.flavorText)}
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab>

                  {/* Tab de Precios */}
                  <Tab eventKey="prices" title="Precios">
                    <div className="p-3">
                      <div className="mb-3">
                        <h6 className="text-light mb-2" style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}>
                          💰 Precios de Referencia
                        </h6>
                        <div 
                          className="p-3 rounded text-center"
                          style={{
                            background: 'rgba(40, 167, 69, 0.2)',
                            border: '2px solid rgba(40, 167, 69, 0.3)'
                          }}
                        >
                          <div className="text-light mb-2">
                            <small>Precio promedio en Costa Rica</small>
                          </div>
                          <div className="text-success fw-bold fs-4">
                            ₡{card.minPrice ? `${card.minPrice.toLocaleString()} - ${card.maxPrice ? card.maxPrice.toLocaleString() : card.minPrice.toLocaleString()}` : '1,500 - 5,000'}
                          </div>
                          <small className="text-muted">
                            *Basado en vendedores locales
                          </small>
                        </div>
                      </div>
                      
                      {card.tcgPlayer && (
                        <div className="mb-3">
                          <h6 className="text-light mb-2">🌍 TCGPlayer.com (USD)</h6>
                          <div className="small text-muted">
                            Market: ${card.tcgPlayer.market || 'N/A'} | 
                            Low: ${card.tcgPlayer.low || 'N/A'} | 
                            Mid: ${card.tcgPlayer.mid || 'N/A'} | 
                            High: ${card.tcgPlayer.high || 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab>

                  {/* Tab de Vendedores */}
                  <Tab eventKey="sellers" title={`Vendedores (${sellers.length})`}>
                    <div className="p-3">
                      {loadingSellers ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" />
                          <small className="text-light">Cargando vendedores...</small>
                        </div>
                      ) : sellersError ? (
                        <Alert variant="warning" className="text-center">
                          {sellersError}
                        </Alert>
                      ) : sellers.length === 0 ? (
                        <Alert variant="info" className="text-center">
                          <FaInfoCircle className="me-2" />
                          No hay vendedores locales para esta carta
                        </Alert>
                      ) : (
                        <div className="sellers-list">
                          {sellers.map((seller, index) => (
                            <div 
                              key={`${seller.id}-${index}`} 
                              className="seller-card mb-3 p-3 rounded"
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <div className="d-flex align-items-center mb-1">
                                    <FaUser className="text-muted me-2" size={14} />
                                    <span className="text-light fw-bold small">
                                      {seller.sellerName}
                                    </span>
                                    {seller.sellerRating > 0 && (
                                      <div className="ms-2">
                                        <ReactStars
                                          count={5}
                                          value={seller.sellerRating}
                                          size={14}
                                          edit={false}
                                          activeColor="#ffc107"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="small text-muted mb-1">
                                    Condición: <Badge bg="info">{seller.condition}</Badge>
                                  </div>
                                  {seller.quantity && (
                                    <div className="small text-muted">
                                      Stock: <Badge bg="success">{seller.quantity}</Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="text-end">
                                  <div className="text-success fw-bold fs-5">
                                    ₡{seller.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="d-flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={protectedAction(
                                    () => handleAddToCart(seller),
                                    'Debes iniciar sesión para agregar cartas al carrito'
                                  )}
                                  className="flex-fill"
                                  style={{
                                    background: 'rgba(0, 123, 255, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(0, 123, 255, 0.3)'
                                  }}
                                >
                                  <FaShoppingCart className="me-1" size={12} />
                                  Agregar
                                </Button>
                                
                                {seller.userPhone && (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => window.open(getWhatsAppLink(seller))}
                                    style={{
                                      background: 'rgba(37, 211, 102, 0.8)',
                                      backdropFilter: 'blur(10px)',
                                      border: '1px solid rgba(37, 211, 102, 0.3)'
                                    }}
                                  >
                                    <FaWhatsapp size={12} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </Col>
          </Row>
        </Modal.Body>
      </div>
    </Modal>
  );
}