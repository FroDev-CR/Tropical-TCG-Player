// src/components/FeaturedSections.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { FaFire, FaStar, FaGem, FaClock, FaCrown, FaEye, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { useCart } from '../contexts/CartContext';

const SECTION_CONFIGS = {
  offers: {
    title: "🔥 Ofertas del Día",
    subtitle: "Cartas con los mejores precios",
    icon: FaFire,
    color: "danger",
    limit: 6
  },
  popular: {
    title: "⭐ Más Populares", 
    subtitle: "Las cartas más vistas y compradas",
    icon: FaStar,
    color: "warning",
    limit: 6
  },
  rare: {
    title: "💎 Cartas Raras",
    subtitle: "Encuentra cartas especiales y únicas",
    icon: FaGem,
    color: "info",
    limit: 6
  },
  recent: {
    title: "Recién Agregadas",
    subtitle: "Últimas cartas publicadas",
    icon: FaClock,
    color: "success",
    limit: 6
  },
};

function FeaturedCard({ listing, onViewCard, onAddToCart }) {
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await onAddToCart(listing);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    setLoading(false);
  };

  return (
    <div 
      className="simple-card-container"
      onClick={() => {
        // Crear objeto completo de carta con toda la información necesaria
        const cardData = {
          id: listing.cardId || listing.id,
          name: listing.cardName,
          images: { 
            small: listing.cardImage, 
            large: listing.cardImage 
          },
          set: { 
            name: typeof listing.setName === 'object' ? 
              (listing.setName.name || 'Desconocido') : 
              (listing.setName || 'Desconocido') 
          },
          rarity: listing.rarity || 'Sin rareza',
          tcgType: listing.tcgType || 'unknown',
          // Agregar información de precios
          tcgPlayer: {
            low: listing.price * 0.8, // Precio bajo simulado
            market: listing.price,     // Precio de mercado
            high: listing.price * 1.2  // Precio alto simulado
          },
          // Agregar vendedores locales
          sellers: [{
            listingId: listing.id,
            sellerId: listing.sellerId,
            sellerName: listing.sellerName,
            price: listing.price,
            condition: listing.condition,
            quantity: listing.availableQuantity || listing.quantity || 1,
            createdAt: listing.createdAt,
            userPhone: listing.userPhone,
            userEmail: listing.userEmail,
            location: listing.location
          }],
          hasLocalSellers: true,
          // Agregar campos específicos según el TCG
          language: listing.language || null
        };
        onViewCard(cardData);
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="simple-card-image-wrapper">
        <img 
          src={listing.cardImage || 'https://via.placeholder.com/300x400'} 
          alt={listing.cardName}
          className="simple-card-image"
        />
        
        {/* Overlay con precio */}
        <div className="simple-card-overlay">
          <div className="simple-price-badge">
            ₡{typeof listing.price === 'number' ? listing.price.toLocaleString() : listing.price}
          </div>
        </div>
      </div>
      
      {/* Información del vendedor debajo */}
      <div className="simple-card-info">
        <small className="seller-name">
          {listing.sellerName || "Vendedor"}
        </small>
      </div>
    </div>
  );
}

function FeaturedSection({ sectionKey, listings, onViewCard, onAddToCart }) {
  const config = SECTION_CONFIGS[sectionKey];
  
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="featured-section mb-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className={`d-flex align-items-center gap-2 text-${config.color}`}>
          <config.icon size={24} />
          <div>
            <h4 className="mb-0">{config.title}</h4>
            <small className="text-muted">{config.subtitle}</small>
          </div>
        </div>
      </div>
      
      <div className="latest-cards-horizontal">
        <div className="latest-cards-container">
          {listings.slice(0, config.limit).map(listing => (
            <div key={listing.id} className="latest-card-item">
              <FeaturedCard 
                listing={listing}
                onViewCard={onViewCard}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedSections({ onViewCard }) {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        // TODO: Replace with backend API calls
        console.log('🚧 FeaturedSections: Firebase code commented out - using mock data');
        
        // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
        /*
        const offersQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          where('price', '<=', 15),
          orderBy('price', 'asc'),
          limit(6)
        );
        const offersSnapshot = await getDocs(offersQuery);
        */

        // Mock data for development
        const mockListings = [
          {
            id: 'mock-1',
            cardId: 'pokemon-1',
            cardName: 'Pikachu VMAX',
            cardImage: 'https://images.pokemontcg.io/swsh4/188_hires.png',
            tcgType: 'pokemon',
            setName: 'Vivid Voltage',
            rarity: 'Ultra Rare',
            price: 12.99,
            condition: 'NM',
            quantity: 3,
            availableQuantity: 3,
            sellerId: 'seller-1',
            sellerName: 'Juan Carlos',
            userPhone: '8888-8888',
            userEmail: 'juan@test.com',
            location: 'San José',
            status: 'active',
            createdAt: new Date()
          },
          {
            id: 'mock-2',
            cardId: 'onepiece-1',
            cardName: 'Monkey D. Luffy',
            cardImage: 'https://via.placeholder.com/300x400/ff6b6b/ffffff?text=Luffy',
            tcgType: 'onepiece',
            setName: 'Romance Dawn',
            rarity: 'Special Rare',
            price: 25.50,
            condition: 'NM',
            quantity: 1,
            availableQuantity: 1,
            sellerId: 'seller-2',
            sellerName: 'María López',
            userPhone: '8777-7777',
            userEmail: 'maria@test.com',
            location: 'Cartago',
            status: 'active',
            createdAt: new Date()
          }
        ];

        const sectionsData = {
          offers: mockListings.filter(l => l.price <= 15),
          popular: mockListings.filter(l => l.price >= 20),
          rare: mockListings.filter(l => l.rarity.toLowerCase().includes('rare')),
          recent: mockListings
        };

        setSections(sectionsData);
      } catch (error) {
        console.error('Error fetching featured sections:', error);
      }
      setLoading(false);
    };

    fetchFeaturedListings();
  }, []);

  const handleAddToCart = async (listing) => {
    try {
      await addToCart(listing);
      // Aquí podrías mostrar un toast de éxito
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" className="mb-3" />
        <p className="text-muted">Cargando secciones destacadas...</p>
      </div>
    );
  }

  return (
    <div className="featured-sections">
      {Object.entries(sections).map(([sectionKey, listings]) => (
        <FeaturedSection
          key={sectionKey}
          sectionKey={sectionKey}
          listings={listings}
          onViewCard={onViewCard}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}