// src/components/PriceComparator.js
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Badge, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FaExchangeAlt, FaStar, FaWhatsapp, FaShoppingCart, FaTrophy, FaInfoCircle } from 'react-icons/fa';
// Comentado Firebase - ahora usa backend API
// import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
import backendAPI from '../services/backendAPI';
import { useCart } from '../contexts/CartContext';

export default function PriceComparator({ show, onHide, cardId, cardName, cardImage }) {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    if (show && cardId) {
      fetchAllSellers();
    }
  }, [show, cardId]);

  const fetchAllSellers = async () => {
    setLoading(true);
    try {
      // TODO: Buscar listings por cardId usando backend API
      // const response = await backendAPI.getListings({ cardId, status: 'active' });
      
      // Por ahora usar datos de muestra
      const sampleSellers = [
        {
          id: `${cardId}-sample-1`,
          cardId,
          cardName,
          cardImage,
          price: Math.floor(Math.random() * 3000) + 1500,
          condition: 'NM',
          availableQuantity: 1,
          sellerId: 'sample-seller-1',
          sellerName: 'Vendedor A',
          sellerRating: 4.5,
          sellerReviews: 12,
          sellerJoinDate: { seconds: Date.now() / 1000 - 86400 * 30 },
          userPhone: '50612345678'
        },
        {
          id: `${cardId}-sample-2`,
          cardId,
          cardName,
          cardImage,
          price: Math.floor(Math.random() * 3000) + 1500,
          condition: 'GOOD',
          availableQuantity: 2,
          sellerId: 'sample-seller-2',
          sellerName: 'Vendedor B',
          sellerRating: 4.2,
          sellerReviews: 8,
          sellerJoinDate: { seconds: Date.now() / 1000 - 86400 * 60 },
          userPhone: '50687654321'
        }
      ];

      // Ordenar por precio
      sampleSellers.sort((a, b) => a.price - b.price);
      setSellers(sampleSellers);

      // Calcular estadísticas
      if (sampleSellers.length > 0) {
        const prices = sampleSellers.map(s => s.price);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        setStats({
          totalSellers: sampleSellers.length,
          avgPrice: avgPrice.toFixed(2),
          minPrice: minPrice.toFixed(2),
          maxPrice: maxPrice.toFixed(2),
          priceRange: (maxPrice - minPrice).toFixed(2)
        });
      }

    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
    setLoading(false);
  };

  const handleAddToCart = async (listing) => {
    try {
      await addToCart(listing);
      alert('¡Carta agregada al carrito!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito');
    }
  };

  const getConditionBadge = (condition) => {
    const conditionMap = {
      'NM': { label: 'Near Mint', color: 'success' },
      'GOOD': { label: 'Good', color: 'warning' },
      'POOR': { label: 'Poor', color: 'danger' }
    };
    
    const conditionInfo = conditionMap[condition] || { label: condition, color: 'secondary' };
    return <Badge bg={conditionInfo.color}>{conditionInfo.label}</Badge>;
  };

  const getBestDealBadge = (seller, index) => {
    if (index === 0) {
      return <Badge bg="success" className="ms-2"><FaTrophy size={10} /> Mejor Precio</Badge>;
    }
    if (seller.sellerRating >= 4.5 && seller.sellerReviews >= 10) {
      return <Badge bg="info" className="ms-2"><FaStar size={10} /> Top Vendedor</Badge>;
    }
    return null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaExchangeAlt className="text-primary" />
          Comparador de Precios
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Información de la carta */}
        <Row className="mb-4">
          <Col md={3}>
            <img 
              src={cardImage || 'https://via.placeholder.com/200'} 
              alt={cardName}
              className="img-fluid rounded"
              style={{ maxHeight: '200px', objectFit: 'contain' }}
            />
          </Col>
          <Col md={9}>
            <h5 className="mb-3">{cardName}</h5>
            
            {/* Estadísticas de precio */}
            {stats.totalSellers > 0 && (
              <div className="stats-cards">
                <Row className="g-3">
                  <Col sm={6} md={3}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fw-bold text-primary">{stats.totalSellers}</div>
                      <small className="text-muted">Vendedores</small>
                    </div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fw-bold text-success">${stats.minPrice}</div>
                      <small className="text-muted">Precio Mínimo</small>
                    </div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fw-bold text-warning">${stats.avgPrice}</div>
                      <small className="text-muted">Precio Promedio</small>
                    </div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fw-bold text-danger">${stats.maxPrice}</div>
                      <small className="text-muted">Precio Máximo</small>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </Col>
        </Row>

        {/* Tabla de comparación */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3" />
            <p className="text-muted">Buscando todos los vendedores...</p>
          </div>
        ) : sellers.length === 0 ? (
          <Alert variant="info" className="text-center">
            <FaInfoCircle className="me-2" />
            No se encontraron otros vendedores para esta carta.
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Posición</th>
                  <th>Precio</th>
                  <th>Condición</th>
                  <th>Stock</th>
                  <th>Vendedor</th>
                  <th>Rating</th>
                  <th>Miembro desde</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller, index) => (
                  <tr key={seller.id} className={index === 0 ? 'table-success' : ''}>
                    <td>
                      <div className="d-flex align-items-center">
                        <Badge bg={index === 0 ? 'success' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                        {getBestDealBadge(seller, index)}
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold text-success fs-5">
                        ${seller.price}
                      </div>
                      {index === 0 && stats.priceRange > 0 && (
                        <small className="text-muted">
                          Ahorra ${(sellers[sellers.length - 1].price - seller.price).toFixed(2)}
                        </small>
                      )}
                    </td>
                    <td>{getConditionBadge(seller.condition)}</td>
                    <td>
                      <Badge bg="outline-secondary">
                        {seller.availableQuantity || seller.quantity || 1}
                      </Badge>
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">{seller.sellerName || 'Vendedor'}</div>
                        <small className="text-muted">ID: {seller.sellerId.slice(-6)}</small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <FaStar className="text-warning" size={14} />
                        <span className="fw-bold">{seller.sellerRating.toFixed(1)}</span>
                        <small className="text-muted">({seller.sellerReviews})</small>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {formatDate(seller.sellerJoinDate)}
                      </small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleAddToCart(seller)}
                          disabled={(seller.availableQuantity || seller.quantity || 1) <= 0}
                          title="Agregar al carrito"
                        >
                          <FaShoppingCart size={12} />
                        </Button>
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => window.open(`https://wa.me/${seller.userPhone}`, '_blank')}
                          title="Contactar por WhatsApp"
                        >
                          <FaWhatsapp size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Información adicional */}
        {sellers.length > 1 && (
          <Alert variant="info" className="mt-3">
            <FaInfoCircle className="me-2" />
            <strong>Tip:</strong> El precio puede variar según la condición y el vendedor. 
            Considera el rating del vendedor y los costos de envío al tomar tu decisión.
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}