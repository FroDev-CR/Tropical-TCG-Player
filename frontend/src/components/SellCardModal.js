// src/components/SellCardModal.js
import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Row, Col, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { FaSearch, FaTimes, FaCheck, FaInfoCircle, FaDragon, FaSkull, FaRocket, FaMagic, FaGamepad, FaFilter } from 'react-icons/fa';
import { GiPirateCaptain, GiRobotGolem } from 'react-icons/gi';
import { useCart } from '../contexts/CartContext';

const POKEMON_API_KEY = process.env.REACT_APP_POKEMON_API_KEY;
const TCG_API_KEY = process.env.REACT_APP_TCG_API_KEY;

// Configuración de TCGs disponibles - UNIFICADA CON UNA SOLA API
const TCG_CONFIGS = {
  pokemon: {
    name: 'Pokémon',
    icon: FaRocket,
    color: 'primary',
    api: 'tcgapis',
    endpoint: 'https://www.apitcg.com/api/pokemon/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    headers: { 'x-api-key': TCG_API_KEY }
  },
  onepiece: {
    name: 'One Piece',
    icon: GiPirateCaptain,
    color: 'warning',
    api: 'tcgapis',
    endpoint: 'https://www.apitcg.com/api/one-piece/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    headers: { 'x-api-key': TCG_API_KEY }
  },
  dragonball: {
    name: 'Dragon Ball',
    icon: FaDragon,
    color: 'danger',
    api: 'tcgapis',
    endpoint: 'https://www.apitcg.com/api/dragon-ball-fusion/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    headers: { 'x-api-key': TCG_API_KEY }
  },
  digimon: {
    name: 'Digimon',
    icon: FaGamepad,
    color: 'info',
    api: 'tcgapis',
    endpoint: 'https://www.apitcg.com/api/digimon/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    headers: { 'x-api-key': TCG_API_KEY }
  },
  magic: {
    name: 'Magic: The Gathering',
    icon: FaMagic,
    color: 'secondary',
    api: 'tcgapis',
    endpoint: 'https://www.apitcg.com/api/magic/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    headers: { 'x-api-key': TCG_API_KEY }
  },
  unionarena: {
    name: 'Union Arena',
    icon: FaSkull,
    color: 'dark',
    api: 'tcgapis',
    endpoint: 'https://www.apitcg.com/api/union-arena/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    headers: { 'x-api-key': TCG_API_KEY }
  },
  gundam: {
    name: 'Gundam',
    icon: GiRobotGolem,
    color: 'success',
    api: 'tcgapis',
    endpoint: 'https://www.apitcg.com/api/gundam/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    headers: { 'x-api-key': TCG_API_KEY }
  }
};

// Función para generar datos de ejemplo cuando CORS falla
const getExampleCards = (gameType, searchTerm) => {
  const examples = {
    pokemon: [
      {
        id: "base1-4",
        name: "Charizard",
        images: { 
          small: "https://via.placeholder.com/200/ff6b35/fff?text=Charizard",
          large: "https://via.placeholder.com/400/ff6b35/fff?text=Charizard"
        },
        set: { name: "Base Set" },
        rarity: "Rare Holo",
        type: "Fire",
        hp: "120",
        attacks: ["Fire Spin", "Flamethrower"]
      },
      {
        id: "base1-58",
        name: "Pikachu",
        images: { 
          small: "https://via.placeholder.com/200/ffeb3b/333?text=Pikachu",
          large: "https://via.placeholder.com/400/ffeb3b/333?text=Pikachu"
        },
        set: { name: "Base Set" },
        rarity: "Common",
        type: "Lightning",
        hp: "40",
        attacks: ["Thunder Jolt", "Agility"]
      }
    ],
    onepiece: [
      {
        id: "OP01-001",
        name: "Monkey D. Luffy",
        images: { 
          small: "https://via.placeholder.com/200/ff6b6b/fff?text=Luffy",
          large: "https://via.placeholder.com/400/ff6b6b/fff?text=Luffy"
        },
        set: { name: "Romance Dawn [OP01]" },
        rarity: "L",
        type: "LEADER",
        cost: "-",
        power: "5000",
        color: "Red"
      },
      {
        id: "OP01-024",
        name: "Roronoa Zoro",
        images: { 
          small: "https://via.placeholder.com/200/4ecdc4/fff?text=Zoro",
          large: "https://via.placeholder.com/400/4ecdc4/fff?text=Zoro"
        },
        set: { name: "Romance Dawn [OP01]" },
        rarity: "R",
        type: "CHARACTER",
        cost: "3",
        power: "4000",
        color: "Green"
      }
    ],
    dragonball: [
      {
        id: "FB01-001",
        name: "Son Goku",
        images: { 
          small: "https://via.placeholder.com/200/ffa726/fff?text=Goku",
          large: "https://via.placeholder.com/400/ffa726/fff?text=Goku"
        },
        set: { name: "Awakened Pulse [FB01]" },
        rarity: "L",
        type: "LEADER",
        cost: "-",
        power: "15000",
        color: "Red"
      }
    ],
    digimon: [
      {
        id: "BT1-001",
        name: "Agumon",
        images: { 
          small: "https://via.placeholder.com/200/26a69a/fff?text=Agumon",
          large: "https://via.placeholder.com/400/26a69a/fff?text=Agumon"
        },
        set: { name: "Release Special [BT1]" },
        rarity: "C",
        type: "Digimon",
        cost: "3",
        power: "2000",
        color: "Red"
      }
    ],
    magic: [
      {
        id: "LEA-158",
        name: "Lightning Bolt",
        images: { 
          small: "https://via.placeholder.com/200/ab47bc/fff?text=Lightning",
          large: "https://via.placeholder.com/400/ab47bc/fff?text=Lightning"
        },
        set: { name: "Limited Edition Alpha" },
        rarity: "Common",
        type: "Instant",
        cost: "R",
        power: "3",
        color: "Red"
      }
    ],
    unionarena: [
      {
        id: "HTR-1-005",
        name: "Gon Freecss",
        images: { 
          small: "https://via.placeholder.com/200/66bb6a/fff?text=Gon",
          large: "https://via.placeholder.com/400/66bb6a/fff?text=Gon"
        },
        set: { name: "Hunter x Hunter" },
        rarity: "C",
        type: "Character",
        cost: "1",
        power: "1500",
        color: "Blue"
      }
    ],
    gundam: [
      {
        id: "ST04-001",
        name: "Strike Freedom Gundam",
        images: { 
          small: "https://via.placeholder.com/200/5c6bc0/fff?text=Strike",
          large: "https://via.placeholder.com/400/5c6bc0/fff?text=Strike"
        },
        set: { name: "Edition Beta" },
        rarity: "LR",
        type: "UNIT",
        cost: "4",
        power: "4",
        color: "White"
      }
    ]
  };

  const gameCards = examples[gameType] || [];
  return gameCards.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export default function SellCardModal({ show, handleClose }) {
  // TODO: Replace with AuthContext when migrated
  const { user, userData, syncUserData } = { user: null, userData: null, syncUserData: () => {} };
  const [activeTab, setActiveTab] = useState('pokemon');
  const [sellSearchTerm, setSellSearchTerm] = useState('');
  const [sellCards, setSellCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('NM');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [language, setLanguage] = useState('english'); // Campo para idioma de Pokémon
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros avanzados
  const [filters, setFilters] = useState({
    rarity: '',
    type: '',
    color: '',
    set: ''
  });

  // Estados para la paginación en la búsqueda del modal
  const [sellPage, setSellPage] = useState(1);
  const [sellTotalPages, setSellTotalPages] = useState(1);

  // Función para buscar cartas en la API seleccionada
  const searchSellCards = async (page = 1) => {
    if (!sellSearchTerm.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const config = TCG_CONFIGS[activeTab];
      const sanitizedTerm = sellSearchTerm.trim().toLowerCase().replace(/[^a-z0-9\s\-']/g, '').replace(/\s+/g, ' ');
      
      if (!sanitizedTerm) {
        throw new Error('Por favor ingresa un término de búsqueda válido');
      }
      
      let response, data, fetchedCards = [], totalCount = 0;
      
      // Usar la misma API para todos los TCGs incluyendo Pokémon
      {
        // API de TCG unificada - Usar proxy local en desarrollo
        const isProduction = process.env.NODE_ENV === 'production';
        const apiUrl = isProduction 
          ? config.endpoint 
          : config.endpoint.replace('https://www.apitcg.com/api', '/api/tcg');
        
        console.log(`Searching ${config.name} with URL:`, apiUrl);
        
        try {
          response = await fetch(
            `${apiUrl}?name=${encodeURIComponent(sanitizedTerm)}&limit=8&page=${page}`,
            { 
              method: 'GET',
              headers: isProduction ? {
                'x-api-key': config.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              } : {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              mode: 'cors'
            }
          );
          
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Error de autenticación con la API - verifica la API key');
            } else if (response.status === 429) {
              throw new Error('Demasiadas búsquedas. Espera un momento y vuelve a intentar.');
            } else if (response.status >= 500) {
              throw new Error('Servicio temporalmente no disponible. Inténtalo más tarde.');
            }
            throw new Error(`Error ${response.status}: No se pudieron cargar las cartas de ${config.name}`);
          }
          
          data = await response.json();
          console.log('Data recibida:', data);
          
        } catch (corsError) {
          console.warn('Error de conexión:', corsError);
          
          // Fallback a datos de ejemplo solo si es error de CORS
          if (corsError.message.includes('CORS') || corsError.message.includes('Failed to fetch')) {
            console.log('Usando datos de ejemplo debido a CORS');
            const exampleCards = getExampleCards(activeTab, sanitizedTerm);
            if (exampleCards.length > 0) {
              fetchedCards = exampleCards;
              totalCount = exampleCards.length;
            } else {
              throw new Error(`No se encontraron cartas de ejemplo para ${config.name}. Verifica la configuración de CORS.`);
            }
          } else {
            throw corsError;
          }
        }
        
        if (fetchedCards.length === 0 && data) {
          // Manejar diferentes estructuras de respuesta
          let cards = [];
          if (data?.data) {
            if (Array.isArray(data.data)) {
              cards = data.data;
            } else {
              cards = [data.data];
            }
          } else if (Array.isArray(data)) {
            cards = data;
          }
          
          if (cards.length === 0) {
            throw new Error(`No se encontraron cartas de ${config.name} para tu búsqueda`);
          }
          
          // Adaptar formato al estándar común
          fetchedCards = cards.map(card => ({
            id: card.id || card.code,
            name: card.name,
            images: { 
              small: card.images?.small || card.images?.large || 'https://via.placeholder.com/200',
              large: card.images?.large || card.images?.small || 'https://via.placeholder.com/400'
            },
            set: { 
              name: card.set?.name || card.getIt || card.sourceTitle || `${config.name} Set`
            },
            rarity: card.rarity || 'Common',
            type: card.type || card.cardType || card.form,
            cost: card.cost || card.playCost || card.specifiedCost,
            power: card.power || card.dp || card.ap || card.bp,
            color: card.color || (card.colors ? card.colors.join('/') : null),
            attribute: card.attribute?.name || card.attribute,
            ability: card.ability || card.effect,
            family: card.family || card.features || card.trait
          }));
          
          totalCount = data.total || data.totalCount || cards.length;
        }
      }
      
      setSellCards(fetchedCards);
      setSellTotalPages(Math.ceil(totalCount / 8));
      setSellPage(page);
      
    } catch (error) {
      console.error('Error buscando cartas:', error);
      setError(error.message || 'Error al buscar cartas. Inténtalo de nuevo.');
      setSellCards([]);
      setSellTotalPages(1);
    }
    setLoading(false);
  };

  // Manejar el envío del listado para crear la venta
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Debes iniciar sesión para vender cartas.');
      return;
    }
    if (!selectedCard) {
      alert('Por favor, selecciona una carta.');
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      alert('Ingresa un precio válido.');
      return;
    }
    if (!location.trim()) {
      alert('Por favor, especifica la ubicación.');
      return;
    }
    setSubmitting(true);
    try {
      // TODO: Replace with backend API call
      console.log('🚧 SellCardModal: Firebase code commented out - using mock submission');
      
      const listingData = {
        cardId: selectedCard.id || selectedCard.code,
        cardName: selectedCard.name,
        cardImage: selectedCard.images?.small || selectedCard.images?.large || 'https://via.placeholder.com/300',
        tcgType: activeTab, // Nuevo campo para identificar el tipo de TCG
        setName: selectedCard.set?.name || selectedCard.set || 'Desconocido',
        rarity: selectedCard.rarity || 'Sin rareza',
        language: activeTab === 'pokemon' ? language : null, // Solo para Pokémon
        quantity: Number(quantity),
        availableQuantity: Number(quantity),
        condition,
        description,
        location,
        price: parseFloat(price),
        sellerId: user.uid || 'test-seller',
        sellerName: userData?.username || userData?.displayName || user.email || 'Sin nombre',
        userPhone: userData?.phone || '',
        userEmail: user.email || 'test@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
      /*
      const listingRef = await addDoc(collection(db, 'listings'), listingData);

      const userRef = doc(db, 'users', user.uid);
      const currentListings = userData?.listings || [];
      await updateDoc(userRef, {
        listings: [...currentListings, listingRef.id],
        updatedAt: new Date()
      });

      await syncUserData();
      */

      // Mock success for development
      console.log('Mock listing created:', listingData);
      alert('🚧 Funcionalidad en desarrollo - Listado simulado creado exitosamente.');
      
      // Reiniciamos los campos del formulario
      setSellSearchTerm('');
      setSellCards([]);
      setSelectedCard(null);
      setQuantity(1);
      setCondition('NM');
      setDescription('');
      setLocation('');
      setPrice('');
      setLanguage('english');
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error al crear el listado');
    }
    setSubmitting(false);
  };

  const getConditionLabel = (condition) => {
    switch (condition) {
      case 'NM': return 'Near Mint';
      case 'GOOD': return 'Good';
      case 'POOR': return 'Poor';
      default: return condition;
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered className="sell-card-modal glassmorphism-modal">
      <Modal.Header closeButton className="border-bottom-0 pb-0 glassmorphism-header">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaCheck className="text-success" />
          Vender Cartas
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-0 glassmorphism-body">
        {!user ? (
          <div className="text-center py-4">
            <h5>Debes iniciar sesión para vender cartas</h5>
            <p className="text-muted">Inicia sesión o regístrate para poder publicar tus cartas en el marketplace.</p>
            <Button variant="primary" onClick={handleClose}>
              Entendido
            </Button>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {/* Selector de TCG */}
            <div className="mb-4">
              <Form.Label className="fw-bold text-white" style={{ fontFamily: 'Montserrat Alternates, sans-serif', fontWeight: '900', textTransform: 'uppercase' }}>1. Seleccionar Trading Card Game</Form.Label>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => {
                  setActiveTab(k);
                  setSellSearchTerm('');
                  setSellCards([]);
                  setSelectedCard(null);
                  setSellPage(1);
                  setError('');
                  setFilters({ rarity: '', type: '', color: '', set: '' });
                  setShowFilters(false);
                }}
                className="mb-3"
              >
                {Object.entries(TCG_CONFIGS).map(([key, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <Tab
                      key={key}
                      eventKey={key}
                      title={
                        <span className="d-flex align-items-center gap-2 text-white" style={{ fontFamily: 'Montserrat Alternates, sans-serif', fontWeight: '700', textTransform: 'uppercase' }}>
                          <IconComponent size={16} />
                          <span className="d-none d-sm-inline">{config.name}</span>
                          <span className="d-inline d-sm-none">{config.name.split(' ')[0]}</span>
                        </span>
                      }
                    />
                  );
                })}
              </Tabs>
              
              {error && (
                <Alert variant="danger" className="mb-3">
                  <FaInfoCircle className="me-2" />
                  {error}
                </Alert>
              )}
            </div>

            {/* Buscador para la carta */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-white" style={{ fontFamily: 'Montserrat Alternates, sans-serif', fontWeight: '900', textTransform: 'uppercase' }}>
                2. Buscar Carta en {TCG_CONFIGS[activeTab].name}
              </Form.Label>
              <div className="d-flex gap-2 mb-2">
                <Form.Control
                  type="text"
                  placeholder={`Buscar en ${TCG_CONFIGS[activeTab].name} (ej: ${
                    activeTab === 'pokemon' ? "'Charizard ex', 'Pikachu V'" :
                    activeTab === 'onepiece' ? "'Luffy', 'Zoro'" :
                    activeTab === 'dragonball' ? "'Goku', 'Vegeta'" :
                    activeTab === 'digimon' ? "'Agumon', 'Gabumon'" :
                    activeTab === 'magic' ? "'Lightning Bolt', 'Black Lotus'" :
                    activeTab === 'unionarena' ? "'Gon', 'Killua'" :
                    "'Strike Freedom', 'Barbatos'"
                  })...`}
                  value={sellSearchTerm}
                  onChange={(e) => {
                    setSellSearchTerm(e.target.value);
                    setSellPage(1);
                  }}
                  className="flex-grow-1"
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  className="d-flex align-items-center gap-2"
                  title="Filtros avanzados"
                >
                  <FaFilter size={14} />
                  <span className="d-none d-lg-inline">Filtros</span>
                </Button>
                <Button 
                  variant="outline-light"
                  onClick={() => searchSellCards(1)} 
                  disabled={loading || !sellSearchTerm.trim()}
                  className="d-flex align-items-center gap-2"
                  style={{ color: 'white', borderColor: 'white' }}
                >
                  {loading ? (
                    <Spinner size="sm" animation="border" role="status" />
                  ) : (
                    <FaSearch size={14} />
                  )}
                  <span className="d-none d-sm-inline">Buscar</span>
                </Button>
              </div>
              
              {/* Filtros avanzados */}
              {showFilters && (
                <div className="border rounded p-3 mb-3 bg-light">
                  <Row className="g-3">
                    <Col xs={12} sm={6} md={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Rareza</Form.Label>
                        <Form.Select
                          size="sm"
                          value={filters.rarity}
                          onChange={(e) => setFilters({...filters, rarity: e.target.value})}
                        >
                          <option value="">Todas</option>
                          {activeTab === 'pokemon' ? (
                            <>
                              <option value="Common">Common</option>
                              <option value="Uncommon">Uncommon</option>
                              <option value="Rare">Rare</option>
                              <option value="Rare Holo">Rare Holo</option>
                              <option value="Ultra Rare">Ultra Rare</option>
                            </>
                          ) : (
                            <>
                              <option value="C">Common</option>
                              <option value="UC">Uncommon</option>
                              <option value="R">Rare</option>
                              <option value="SR">Super Rare</option>
                              <option value="UR">Ultra Rare</option>
                            </>
                          )}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    {activeTab === 'pokemon' ? (
                      <Col xs={12} sm={6} md={3}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Tipo</Form.Label>
                          <Form.Select
                            size="sm"
                            value={filters.type}
                            onChange={(e) => setFilters({...filters, type: e.target.value})}
                          >
                            <option value="">Todos</option>
                            <option value="Fire">Fire</option>
                            <option value="Water">Water</option>
                            <option value="Grass">Grass</option>
                            <option value="Lightning">Lightning</option>
                            <option value="Psychic">Psychic</option>
                            <option value="Fighting">Fighting</option>
                            <option value="Darkness">Darkness</option>
                            <option value="Metal">Metal</option>
                            <option value="Dragon">Dragon</option>
                            <option value="Fairy">Fairy</option>
                            <option value="Colorless">Colorless</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    ) : (
                      <Col xs={12} sm={6} md={3}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Color</Form.Label>
                          <Form.Select
                            size="sm"
                            value={filters.color}
                            onChange={(e) => setFilters({...filters, color: e.target.value})}
                          >
                            <option value="">Todos</option>
                            <option value="Red">Red</option>
                            <option value="Blue">Blue</option>
                            <option value="Green">Green</option>
                            <option value="Yellow">Yellow</option>
                            <option value="Purple">Purple</option>
                            <option value="Black">Black</option>
                            <option value="White">White</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                    
                    <Col xs={12} sm={6} md={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Set</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          placeholder="Ej: Base Set"
                          value={filters.set}
                          onChange={(e) => setFilters({...filters, set: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col xs={12} sm={6} md={3}>
                      <div className="d-flex align-items-end h-100">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setFilters({ rarity: '', type: '', color: '', set: '' })}
                          className="w-100"
                        >
                          <FaTimes size={12} /> Limpiar
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </Form.Group>

            {/* Resultados de búsqueda con paginación */}
            {!selectedCard && sellCards.length > 0 && (
              <div className="mb-4">
                <Form.Label className="fw-bold text-white" style={{ fontFamily: 'Montserrat Alternates, sans-serif', fontWeight: '900', textTransform: 'uppercase' }}>3. Seleccionar Carta</Form.Label>
                <div className="row g-2 mb-3">
                  {sellCards.map(card => (
                    <Col key={card.id} xs={12} sm={6} md={4}>
                      <div 
                        className="card-selectable p-2 border rounded cursor-pointer"
                        onClick={() => setSelectedCard(card)}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={card.images?.small || card.images?.large || 'https://via.placeholder.com/50'}
                            alt={card.name}
                            style={{ width: '40px', height: '56px', objectFit: 'contain' }}
                            className="rounded"
                          />
                          <div className="flex-grow-1">
                            <div className="fw-bold small line-clamp-2">{card.name}</div>
                            <div className="text-muted small">{typeof card.set === 'object' ? (card.set.name || 'Set desconocido') : (card.set || 'Set desconocido')}</div>
                            <div className="text-muted small">{card.rarity || 'Sin rareza'}</div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </div>
                
                {sellTotalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      disabled={sellPage === 1} 
                      onClick={() => searchSellCards(sellPage - 1)}
                    >
                      ← Anterior
                    </Button>
                    <span className="text-muted small">
                      Página {sellPage} de {sellTotalPages}
                    </span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      disabled={sellPage === sellTotalPages} 
                      onClick={() => searchSellCards(sellPage + 1)}
                    >
                      Siguiente →
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Mostrar carta seleccionada */}
            {selectedCard && (
              <div className="mb-4">
                <Form.Label className="fw-bold text-white" style={{ fontFamily: 'Montserrat Alternates, sans-serif', fontWeight: '900', textTransform: 'uppercase' }}>3. Carta Seleccionada</Form.Label>
                <div className="card border-primary p-3">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={selectedCard.images?.small || selectedCard.images?.large || 'https://via.placeholder.com/50'}
                      alt={selectedCard.name}
                      style={{ width: '60px', height: '84px', objectFit: 'contain' }}
                      className="rounded"
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{selectedCard.name}</h6>
                      <p className="text-muted small mb-0">{typeof selectedCard.set === 'object' ? (selectedCard.set.name || 'Set desconocido') : (selectedCard.set || 'Set desconocido')}</p>
                      <div className="d-flex gap-2 mt-1">
                        <Badge bg={TCG_CONFIGS[activeTab].color}>{TCG_CONFIGS[activeTab].name}</Badge>
                        <Badge bg="secondary">{selectedCard.rarity || 'Sin rareza'}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setSelectedCard(null)}
                      className="d-flex align-items-center gap-1"
                    >
                      <FaTimes size={12} />
                      <span className="d-none d-sm-inline">Cambiar</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de detalles de venta */}
            {selectedCard && (
              <div className="mb-4">
                <Form.Label className="fw-bold text-white" style={{ fontFamily: 'Montserrat Alternates, sans-serif', fontWeight: '900', textTransform: 'uppercase' }}>4. Detalles de Venta</Form.Label>
                <Row className="g-3">
                  <Col xs={6} sm={3}>
                    <Form.Group>
                      <Form.Label className="small">Cantidad</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6} sm={3}>
                    <Form.Group>
                      <Form.Label className="small">Condición</Form.Label>
                      <Form.Select 
                        value={condition} 
                        onChange={(e) => setCondition(e.target.value)} 
                        required
                      >
                        <option value="NM">Near Mint</option>
                        <option value="GOOD">Good</option>
                        <option value="POOR">Poor</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {activeTab === 'pokemon' && (
                    <Col xs={12} sm={3}>
                      <Form.Group>
                        <Form.Label className="small">Idioma</Form.Label>
                        <Form.Select 
                          value={language} 
                          onChange={(e) => setLanguage(e.target.value)}
                          required
                        >
                          <option value="english">Inglés</option>
                          <option value="spanish">Español</option>
                          <option value="japanese">Japonés</option>
                          <option value="korean">Coreano</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                  <Col xs={12} sm={activeTab === 'pokemon' ? 3 : 6}>
                    <Form.Group>
                      <Form.Label className="small">Precio (CRC - Colones)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Ej: 5000"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small">Ubicación</Form.Label>
                      <Form.Control
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ej: San José, Costa Rica"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small">
                        Descripción (opcional)
                        <FaInfoCircle className="ms-1 text-muted" size={12} />
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe detalles de la carta, estado, etc."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* Resumen de la venta */}
            {selectedCard && price && (
              <div className="mb-4">
                <Form.Label className="fw-bold text-white" style={{ fontFamily: 'Montserrat Alternates, sans-serif', fontWeight: '900', textTransform: 'uppercase' }}>5. Resumen</Form.Label>
                <div className="card bg-light p-3">
                  <div className="row g-2 text-center">
                    <div className="col-4">
                      <div className="small text-muted">Carta</div>
                      <div className="fw-bold">{selectedCard.name}</div>
                    </div>
                    <div className="col-4">
                      <div className="small text-muted">Condición</div>
                      <div className="fw-bold">{getConditionLabel(condition)}</div>
                    </div>
                    <div className="col-4">
                      <div className="small text-muted">Precio Total</div>
                      <div className="fw-bold text-success">₡{(parseFloat(price) * quantity).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="outline-secondary" 
                onClick={handleClose} 
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                variant="success" 
                type="submit" 
                disabled={submitting || !selectedCard || !price || !location}
                className="d-flex align-items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" animation="border" role="status" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <FaCheck size={14} />
                    <span>Publicar Listado</span>
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
