import { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';
// Firebase removed - using static data for now
// TODO: Connect to backend API
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LatestCards = ({ onCardClick }) => {
  const [latestCards, setLatestCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchLatestCards = async () => {
      try {
        // TODO: Replace with backend API call - backendAPI.getListings()
        // Mock data for now to prevent Firebase errors
        const mockCards = [
          {
            id: '1',
            cardName: 'Charizard EX',
            cardImage: 'https://images.pokemontcg.io/xy1/1.png',
            price: 25000,
            condition: 'Near Mint',
            sellerName: 'TestUser'
          },
          {
            id: '2', 
            cardName: 'Monkey D. Luffy',
            cardImage: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
            price: 15000,
            condition: 'Mint',
            sellerName: 'TestUser'
          }
        ];
        
        setLatestCards(mockCards);
      } catch (error) {
        console.error('Error loading latest cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCards();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando últimas cartas...</p>
      </div>
    );
  }

  if (latestCards.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No hay cartas disponibles</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="h4 fw-bold text-primary mb-0">
          <i className="fas fa-fire me-2"></i>
          Últimas Cartas Añadidas
        </h3>
        <Link 
          to="/marketplace" 
          className="btn btn-outline-primary btn-sm"
        >
          Ver todas
        </Link>
      </div>
      
      <div className="latest-cards-horizontal">
        <div className="latest-cards-container">
          {latestCards.map((card, index) => (
            <motion.div
              key={card.id}
              className="latest-card-item"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              {/* Vista simplificada: solo imagen de carta + datos esenciales */}
              <div 
                className="simple-card-container"
                onClick={() => onCardClick && onCardClick({
                  id: card.cardId || card.id,
                  name: card.cardName,
                  images: { 
                    small: card.cardImage, 
                    large: card.cardImage 
                  },
                  set: { 
                    name: typeof card.setName === 'object' ? 
                      (card.setName.name || 'Desconocido') : 
                      (card.setName || 'Desconocido') 
                  },
                  rarity: card.rarity || 'Sin rareza',
                  tcgType: card.tcgType || 'unknown',
                  // Agregar información de precios
                  tcgPlayer: {
                    low: card.price * 0.8, // Precio bajo simulado
                    market: card.price,     // Precio de mercado
                    high: card.price * 1.2  // Precio alto simulado
                  },
                  // Agregar vendedores locales
                  sellers: [{
                    listingId: card.id,
                    sellerId: card.sellerId,
                    sellerName: card.sellerName,
                    price: card.price,
                    condition: card.condition,
                    quantity: card.availableQuantity || card.quantity || 1,
                    createdAt: card.createdAt,
                    userPhone: card.userPhone,
                    userEmail: card.userEmail,
                    location: card.location
                  }],
                  hasLocalSellers: true,
                  // Agregar campos específicos según el TCG
                  language: card.language || null
                })}
                style={{ cursor: onCardClick ? 'pointer' : 'default' }}
              >
                <div className="simple-card-image-wrapper">
                  <img 
                    src={card.cardImage || 'https://via.placeholder.com/300x400'} 
                    alt={card.cardName}
                    className="simple-card-image"
                  />
                  
                  {/* Overlay con precio */}
                  <div className="simple-card-overlay">
                    <div className="simple-price-badge">
                      ₡{typeof card.price === 'number' ? card.price.toLocaleString() : card.price}
                    </div>
                  </div>
                </div>
                
                {/* Información del vendedor debajo */}
                <div className="simple-card-info">
                  <small className="seller-name">
                    {card.sellerName || "Vendedor"}
                  </small>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="text-center mt-3">
        <Link 
          to="/marketplace" 
          className="btn btn-primary"
        >
          <i className="fas fa-shopping-cart me-2"></i>
          Explorar Marketplace
        </Link>
      </div>
    </motion.div>
  );
};

export default LatestCards;