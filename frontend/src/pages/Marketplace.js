// src/pages/Marketplace.js
import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Spinner, Button, Pagination, Alert } from 'react-bootstrap';
import apiClient from '../services/api';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuthActions } from '../hooks/useAuthActions';
import SellCardModal from '../components/SellCardModal';
import MarketplaceFilters from '../components/MarketplaceFilters';
import FeaturedSections from '../components/FeaturedSections';
import CardDetailModalOptimized from '../components/CardDetailModalOptimized';
import FloatingCart from '../components/FloatingCart';
import { FaShoppingCart, FaWhatsapp, FaHeart, FaSearch, FaFilter } from 'react-icons/fa';
import apiSearchService from '../services/apiSearchService';

// Configuración simple para mapear tipos de TCG
const TCG_GAMES = {
  pokemon: { name: 'Pokémon TCG' },
  onepiece: { name: 'One Piece' },
  dragonball: { name: 'Dragon Ball' },
  digimon: { name: 'Digimon' },
  magic: { name: 'Magic: The Gathering' },
  unionarena: { name: 'Union Arena' },
  gundam: { name: 'Gundam' },
  unknown: { name: 'Desconocido' }
};

// Utility functions moved to CardDetailModal for better organization

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTCG, setSelectedTCG] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showSellModal, setShowSellModal] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Nuevos estados para las funcionalidades mejoradas
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tcgTypes: [],
    priceRange: null,
    conditions: [],
    rarities: [],
    minRating: 0,
    sortBy: 'newest'
  });
  
  
  const { addToCart } = useCart();
  const { protectedAction } = useAuthActions();

  const [latestListings, setLatestListings] = useState([]);

  // Función para aplicar filtros avanzados (actualizada para cartas unificadas)
  const applyFilters = (cards, activeFilters) => {
    let filtered = [...cards];

    // Filtro por TCG Types
    if (activeFilters.tcgTypes.length > 0) {
      filtered = filtered.filter(card => 
        activeFilters.tcgTypes.includes(card.tcgType)
      );
    }

    // Filtro por precio (basado en precio promedio de la carta)
    if (activeFilters.priceRange) {
      const priceRanges = {
        'under10': { min: 0, max: 10 },
        '10to25': { min: 10, max: 25 },
        '25to50': { min: 25, max: 50 },
        '50to100': { min: 50, max: 100 },
        'over100': { min: 100, max: 9999 }
      };
      
      const range = priceRanges[activeFilters.priceRange];
      if (range) {
        filtered = filtered.filter(card => {
          const price = card.averagePrice || card.minPrice || 0;
          return price >= range.min && price <= range.max;
        });
      }
    }

    // Filtro por condición (si tiene vendedores con esa condición)
    if (activeFilters.conditions.length > 0) {
      filtered = filtered.filter(card => 
        card.sellers && card.sellers.some(seller => 
          activeFilters.conditions.includes(seller.condition)
        )
      );
    }

    // Filtro por rareza
    if (activeFilters.rarities.length > 0) {
      filtered = filtered.filter(card => 
        activeFilters.rarities.includes(card.rarity)
      );
    }

    // Filtro por rating mínimo del vendedor (simulado)
    if (activeFilters.minRating > 0) {
      // Por ahora simulamos el rating, después se puede implementar con datos reales
      filtered = filtered.filter(() => Math.random() > (activeFilters.minRating / 5 - 0.3));
    }

    // Filtro adicional: solo cartas con vendedores
    const onlyWithSellers = activeFilters.onlyWithSellers || false;
    if (onlyWithSellers) {
      filtered = filtered.filter(card => card.sellers && card.sellers.length > 0);
    }

    // Ordenamiento
    switch (activeFilters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.maxPrice || 0) - (a.maxPrice || 0));
        break;
      case 'name-az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'sellers-most':
        filtered.sort((a, b) => (b.sellers?.length || 0) - (a.sellers?.length || 0));
        break;
      case 'sellers-least':
        filtered.sort((a, b) => (a.sellers?.length || 0) - (b.sellers?.length || 0));
        break;
      case 'newest':
      default:
        // Ordenar por carta más reciente (basado en el listing más reciente)
        filtered.sort((a, b) => {
          const aLatest = a.sellers?.length > 0 ? Math.max(...a.sellers.map(s => s.createdAt?.seconds || 0)) : 0;
          const bLatest = b.sellers?.length > 0 ? Math.max(...b.sellers.map(s => s.createdAt?.seconds || 0)) : 0;
          return bLatest - aLatest;
        });
        break;
    }

    return filtered;
  };

  // Contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.tcgTypes.length > 0) count++;
    if (filters.priceRange) count++;
    if (filters.conditions.length > 0) count++;
    if (filters.rarities.length > 0) count++;
    if (filters.minRating > 0) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  useEffect(() => {
    const fetchLatestListings = async () => {
      try {
        const response = await apiClient.get('/api/v1/listings', {
          params: {
            sortBy: 'createdAt',
            page: 1,
            limit: 15
          }
        });
        
        if (response.data.success) {
          setLatestListings(response.data.listings);
        }
      } catch (error) {
        console.error('Error al obtener últimas cartas publicadas:', error);
      }
    };
    
    if (!searchTerm.trim()) {
      fetchLatestListings();
    }
  }, [searchTerm]);

  // Función simplificada - buscar en una sola API según el TCG seleccionado
  const searchCardsUnified = async (searchTerm, selectedTcg, page = 1, pageSize = 12) => {
    const sanitizedTerm = searchTerm
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s\-']/g, '')
      .replace(/\s+/g, ' ');
    
    console.log(`🔍 Búsqueda en ${selectedTcg}: "${sanitizedTerm}"`);
    
    try {
      // Buscar en la API específica seleccionada
      const apiResults = await apiSearchService.searchSpecificAPI(
        selectedTcg,
        sanitizedTerm, 
        page, 
        Math.max(pageSize, 50) // Aumentar minídmo a 50 cartas
      );
      
      // Buscar vendedores locales en paralelo
      const localSellers = await searchLocalSellers(sanitizedTerm);
      
      // Función para formatear información del set
      const formatSetInfo = (set) => {
        if (!set) return 'Set desconocido';
        if (typeof set === 'string') return set;
        if (typeof set === 'object' && set !== null) {
          const name = set.name || '';
          const series = set.series || '';
          if (name && series) return `${name}, ${series}`;
          else if (name) return name;
          else if (series) return series;
          else return 'Set desconocido';
        }
        return String(set);
      };

      // Combinar resultados: agregar vendedores locales a las cartas de API
      const enrichedCards = apiResults.cards.map(card => {
        const cardSellers = localSellers.filter(seller => 
          seller.cardId === card.id || 
          (seller.cardName.toLowerCase().trim() === card.name.toLowerCase().trim())
        );
        
        return {
          ...card,
          // Formatear el objeto set correctamente
          set: { name: formatSetInfo(card.set) },
          sellers: cardSellers,
          hasLocalSellers: cardSellers.length > 0
        };
      });
      
      return {
        cards: enrichedCards,
        totalResults: apiResults.totalResults,
        errors: apiResults.errors || [],
        page: apiResults.page,
        totalPages: apiResults.totalPages
      };
      
    } catch (error) {
      console.error('Error en búsqueda específica:', error);
      // Fallback: buscar solo en vendedores locales
      const localResults = await searchLocalSellers(sanitizedTerm);
      return {
        cards: convertListingsToCards(localResults),
        totalResults: localResults.length,
        errors: [{ api: 'Specific', error: `API de ${selectedTcg} falló, mostrando solo vendedores locales` }]
      };
    }
  };
  
  // Buscar solo en vendedores locales
  const searchLocalSellers = async (searchTerm) => {
    try {
      const response = await apiClient.get('/api/v1/listings', {
        params: {
          search: searchTerm,
          status: 'active',
          sortBy: 'createdAt',
          page: 1,
          limit: 100
        }
      });
      
      if (response.data.success) {
        return response.data.listings;
      }
      
      return [];
    } catch (error) {
      console.error('Error buscando vendedores locales:', error);
      return [];
    }
  };
  
  // Convertir listings a formato de cartas
  const convertListingsToCards = (listings) => {
    const cardMap = new Map();
    
    listings.forEach(listing => {
      const cardId = listing.cardId || listing._id;
      
      if (!cardMap.has(cardId)) {
        cardMap.set(cardId, {
          id: cardId,
          name: listing.cardName,
          images: { small: listing.cardImage, large: listing.cardImage },
          set: { name: listing.setName || 'Desconocido' },
          rarity: listing.rarity || 'Sin rareza',
          tcgType: listing.tcgType || 'unknown',
          tcgName: TCG_GAMES[listing.tcgType]?.name || 'Desconocido',
          sellers: [],
          hasLocalSellers: true
        });
      }
      
      const card = cardMap.get(cardId);
      card.sellers.push({
        listingId: listing._id,
        sellerId: listing.sellerId?._id || listing.sellerId,
        sellerName: listing.sellerId?.username || listing.sellerName,
        price: listing.price,
        condition: listing.condition,
        quantity: listing.availableQuantity || listing.quantity || 1,
        createdAt: listing.createdAt,
        userPhone: listing.sellerId?.phone || listing.userPhone
      });
    });
    
    return Array.from(cardMap.values());
  };


  // Función de búsqueda específica por TCG
  const performSearch = useCallback(async (term, page = 1) => {
    if (!term.trim()) {
      setCards([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    if (!selectedTCG) {
      setSearchError('⚠️ Selecciona un TCG antes de buscar');
      return;
    }

    setLoading(true);
    setSearchError('');
    
    try {
      // Búsqueda específica en el TCG seleccionado + vendedores locales  
      const searchResults = await searchCardsUnified(term, selectedTCG, page, 48); // Aumentar a 48 cartas por página
      
      // Procesar cartas y calcular precios de vendedores
      const processedCards = searchResults.cards.map(card => {
        if (card.sellers && card.sellers.length > 0) {
          const prices = card.sellers.map(s => s.price);
          const quantities = card.sellers.map(s => s.quantity);
          
          card.minPrice = Math.min(...prices);
          card.maxPrice = Math.max(...prices);
          card.totalStock = quantities.reduce((sum, q) => sum + q, 0);
          
          const totalWeightedPrice = card.sellers.reduce((sum, seller) => {
            return sum + (seller.price * seller.quantity);
          }, 0);
          card.averagePrice = totalWeightedPrice / card.totalStock;
          
          // Ordenar vendedores por precio
          card.sellers.sort((a, b) => a.price - b.price);
        }
        
        return card;
      });
      
      // Aplicar filtros locales
      let finalCards = applyFilters(processedCards, filters);

      setCards(finalCards);
      setTotalResults(searchResults.totalResults);
      setTotalPages(searchResults.totalPages || Math.ceil(finalCards.length / 48));
      setCurrentPage(page);

      // Mostrar información sobre el estado de los datos
      if (searchResults.errors && searchResults.errors.length > 0) {
        const errorMessages = searchResults.errors.map(err => `${err.api}: ${err.error}`).join('; ');
        setSearchError(`⚠️ ${errorMessages}`);
      }
      
      if (finalCards.length === 0) {
        setSearchError(`No se encontraron cartas de ${TCG_GAMES[selectedTCG]?.name || selectedTCG} que coincidan con tu búsqueda.`);
      }

      console.log(`✅ Búsqueda en ${selectedTCG} completada: ${finalCards.length} cartas encontradas`);

    } catch (error) {
      console.error('Error searching cards:', error);
      setCards([]);
      setTotalResults(0);
      setTotalPages(1);
      setSearchError('Error al buscar cartas. Verifica tu conexión e inténtalo de nuevo.');
    }
    setLoading(false);
  }, [filters, selectedTCG]);

  // Paginación
  const handlePagination = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (searchTerm.trim()) {
      performSearch(searchTerm, newPage);
    }
  }, [totalPages, searchTerm, performSearch]);

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setSearchError('');
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    if (!value.trim()) {
      setCards([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }
    
    if (!selectedTCG) {
      setSearchError('⚠️ Selecciona un TCG antes de buscar');
      return;
    }
    
    const timer = setTimeout(() => {
      performSearch(value, 1);
    }, 300); // Búsqueda rápida - solo 300ms
    
    setDebounceTimer(timer);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (cardId) => {
    const newFavorites = favorites.includes(cardId) 
      ? favorites.filter(id => id !== cardId)
      : [...favorites, cardId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const openCardModal = (card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
    setShowCardModal(false);
  };


  // Función para manejar cambios en filtros
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    if (searchTerm.trim()) {
      setTimeout(() => performSearch(searchTerm, 1), 100);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container>
        {/* Header del Marketplace */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="section-title mb-2">🎯 Marketplace TCG</h2>
            {selectedTCG && (
              <div className="mt-2">
                <span className="badge bg-primary fs-6">
                  Buscando en {TCG_GAMES[selectedTCG]?.name}
                </span>
              </div>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-light" 
              onClick={protectedAction(
                () => setShowSellModal(true),
                'Debes iniciar sesión para vender cartas'
              )}
              className="d-flex align-items-center gap-2 btn-lg"
              style={{
                color: 'white',
                borderColor: 'white',
                backgroundColor: 'transparent',
                fontSize: '1.1rem',
                padding: '0.75rem 1.5rem'
              }}
            >
              <FaShoppingCart size={16} />
              Vender Cartas
            </Button>
          </div>
        </div>


        {/* Selector de TCG obligatorio */}
        <div className="mb-4">
          <div className="row align-items-center mb-3">
            <div className="col-12 col-md-4">
              <Form.Group>
                <Form.Label className="fw-bold">1. Selecciona el TCG</Form.Label>
                <Form.Select
                  value={selectedTCG}
                  onChange={(e) => {
                    setSelectedTCG(e.target.value);
                    setSearchError('');
                    setCards([]);
                  }}
                  className="form-select-lg"
                  size="lg"
                >
                  <option value="">Elige un Trading Card Game</option>
                  {Object.entries(TCG_GAMES).filter(([key]) => key !== 'unknown').map(([key, tcg]) => (
                    <option key={key} value={key}>
                      {tcg.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12 col-md-8">
              <Form.Group>
                <Form.Label className="fw-bold">2. Buscar cartas</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder={selectedTCG ? `🔍 Buscar cartas de ${TCG_GAMES[selectedTCG]?.name}...` : "Selecciona un TCG primero"}
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchTerm.trim() && selectedTCG && performSearch(searchTerm, 1)}
                    className="form-control-lg"
                    disabled={!selectedTCG}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-lg d-flex align-items-center gap-2"
                    title="Filtros avanzados"
                    disabled={!selectedTCG}
                  >
                    <FaFilter />
                    {getActiveFiltersCount() > 0 && (
                      <span className="badge bg-primary">{getActiveFiltersCount()}</span>
                    )}
                    <span className="d-none d-md-inline">Filtros</span>
                  </Button>
                  <Button 
                    onClick={() => searchTerm.trim() && selectedTCG && performSearch(searchTerm, 1)} 
                    disabled={loading || !searchTerm.trim() || !selectedTCG}
                    variant="primary"
                    className="btn-lg"
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" role="status" />
                    ) : (
                      <FaSearch size={14} />
                    )}
                    <span className="d-none d-sm-inline ms-2">
                      {loading ? 'Buscando...' : 'Buscar'}
                    </span>
                  </Button>
                </div>
              </Form.Group>
            </div>
          </div>
          

          {/* Mostrar información sobre el estado de los datos */}
          {searchError && (
            <Alert 
              variant={searchError.includes('demostración') ? "info" : "warning"} 
              className="mb-3"
            >
              <strong>
                {searchError.includes('demostración') ? '💡 Información:' : '⚠️ Atención:'}
              </strong> {searchError}
              {searchError.includes('demostración') && (
                <div className="mt-2 small">
                  <strong>Para acceder a datos reales:</strong> Configura las API keys en las variables de entorno y cambia <code>useMockData</code> a <code>false</code> en el servicio.
                </div>
              )}
            </Alert>
          )}
          
          {totalResults > 0 && (
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                <strong>Cartas encontradas:</strong> Mostrando {(currentPage - 1) * 48 + 1} - {Math.min(currentPage * 48, cards.length)} de {totalResults} resultados
                <span className="ms-2">
                  {searchError.includes('demostración') ? 
                    '🎭 Datos de demostración' : 
                    '📡'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Layout principal con sidebar de filtros */}
        <Row className="g-4">
          {/* Sidebar de filtros */}
          {showFilters && (
            <Col lg={3}>
              <MarketplaceFilters 
                filters={filters}
                onFiltersChange={handleFiltersChange}
                activeFiltersCount={getActiveFiltersCount()}
              />
            </Col>
          )}
          
          {/* Contenido principal */}
          <Col lg={showFilters ? 9 : 12}>
            {/* Secciones destacadas (solo cuando no hay búsqueda activa) */}
            {!searchTerm.trim() && !getActiveFiltersCount() && (
              <FeaturedSections onViewCard={openCardModal} />
            )}


        {cards.length > 0 && (
          <>
            <div className="mb-4">
              <Pagination className="justify-content-center">
                <Pagination.Prev 
                  disabled={currentPage === 1} 
                  onClick={() => handlePagination(currentPage - 1)}
                  aria-label="Página anterior"
                />
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  
                  if (startPage > 1) {
                    pages.push(
                      <Pagination.Item key={1} onClick={() => handlePagination(1)}>
                        1
                      </Pagination.Item>
                    );
                    if (startPage > 2) {
                      pages.push(<Pagination.Ellipsis key="start-ellipsis" />);
                    }
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Pagination.Item
                        key={i}
                        active={i === currentPage}
                        onClick={() => handlePagination(i)}
                      >
                        {i}
                      </Pagination.Item>
                    );
                  }
                  
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<Pagination.Ellipsis key="end-ellipsis" />);
                    }
                    pages.push(
                      <Pagination.Item key={totalPages} onClick={() => handlePagination(totalPages)}>
                        {totalPages}
                      </Pagination.Item>
                    );
                  }
                  
                  return pages;
                })()}
                <Pagination.Next 
                  disabled={currentPage === totalPages} 
                  onClick={() => handlePagination(currentPage + 1)}
                  aria-label="Página siguiente"
                />
              </Pagination>
            </div>
            <Row className="g-4">
              {cards.map(card => (
                <Col key={card.id} md={6} lg={4} className="mb-4">
                  {/* Vista simplificada: solo imagen de carta + información de vendedores */}
                  <div className="simplified-marketplace-card">
                    <div className="simplified-card-image-wrapper" onClick={() => openCardModal(card)}>
                      <img 
                        src={card.images?.small || 'https://via.placeholder.com/300x400'} 
                        alt={card.name}
                        className="simplified-card-image"
                      />
                      
                      {/* Botón de favoritos flotante */}
                      <div className="simplified-favorite-btn">
                        <Button
                          variant={favorites.includes(card.id) ? "danger" : "outline-light"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            protectedAction(
                              () => toggleFavorite(card.id),
                              'Debes iniciar sesión para agregar cartas a favoritos'
                            )();
                          }}
                          className="rounded-circle"
                          title={favorites.includes(card.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          <FaHeart size={12} />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Información de vendedores solo si hay */}
                    {card.sellers && card.sellers.length > 0 && (
                      <div className="simplified-sellers-info">
                        <div className="simplified-best-price">
                          <div className="seller-info">
                            <small className="seller-availability">
                              {card.sellers.length === 1 ? 
                                "Vendedor con stock disponible" :
                                `${card.sellers.length} vendedores con stock disponible`
                              }
                            </small>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
          </Col>
        </Row>
      </Container>

      <SellCardModal show={showSellModal} handleClose={() => setShowSellModal(false)} />
      
      {/* Modal de Detalle de Carta - Componente optimizado para móviles */}
      <CardDetailModalOptimized 
        show={showCardModal}
        onHide={closeCardModal}
        card={selectedCard}
      />

      {/* Carrito flotante */}
      <FloatingCart />

    </motion.div>
  );
}