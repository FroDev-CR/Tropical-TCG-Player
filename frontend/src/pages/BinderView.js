import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Card, Button, Row, Col, Modal,
  Form, Spinner, InputGroup
} from 'react-bootstrap';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaTrashAlt } from 'react-icons/fa';


const API_KEY = process.env.REACT_APP_POKEMON_API_KEY;

export default function BinderView() {
  const { id } = useParams();
  const [binder, setBinder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [results, setResults] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [page, setPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  const cardsPerPage = {
    '3x3': 9,
    '4x4': 16,
    '2x2': 4,
    'Jumbo': 1
  }[binder?.type || '3x3'];

  const totalPages = Math.ceil((binder?.cards?.length || 0) / cardsPerPage);

  useEffect(() => {
    const fetchBinder = async () => {
      try {
        // TODO: Replace with backend API calls
        console.log('🚧 BinderView: Firebase code commented out - using mock data');
        
        // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
        /*
        const docRef = doc(db, 'binders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBinder({ id: docSnap.id, ...docSnap.data() });
        }
        */

        // Mock binder data for development
        const mockBinder = {
          id: id,
          type: '3x3',
          name: 'Mi Carpeta Pokémon',
          description: 'Carpeta de demostración con cartas de muestra',
          cards: [
            {
              id: 'base1-4',
              name: 'Charizard',
              images: {
                small: 'https://images.pokemontcg.io/base1/4.png',
                large: 'https://images.pokemontcg.io/base1/4_hires.png'
              },
              set: { name: 'Base Set' },
              types: ['Fire'],
              rarity: 'Rare Holo'
            },
            {
              id: 'base1-58',
              name: 'Pikachu',
              images: {
                small: 'https://images.pokemontcg.io/base1/58.png',
                large: 'https://images.pokemontcg.io/base1/58_hires.png'
              },
              set: { name: 'Base Set' },
              types: ['Lightning'],
              rarity: 'Common'
            },
            {
              id: 'base1-7',
              name: 'Blastoise',
              images: {
                small: 'https://images.pokemontcg.io/base1/2.png',
                large: 'https://images.pokemontcg.io/base1/2_hires.png'
              },
              set: { name: 'Base Set' },
              types: ['Water'],
              rarity: 'Rare Holo'
            }
          ]
        };

        setBinder(mockBinder);
      } catch (error) {
        console.error("Error cargando binder:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBinder();
  }, [id]);

  const searchCards = async () => {
    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${searchTerm}*`, {
        headers: { 'X-Api-Key': API_KEY }
      });
      const data = await response.json();
      setResults(data.data);
    } catch (err) {
      console.error("Error buscando cartas:", err);
    }
  };

  const handleDeleteCard = async (cardId) => {
    // TODO: Replace with backend API call
    console.log('🚧 BinderView: Firebase delete commented out - using mock delete');
    
    const updatedCards = binder.cards.filter(card => card.id !== cardId);
    
    // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
    /*
    await updateDoc(doc(db, 'binders', id), { cards: updatedCards });
    */
    
    // Mock update for development
    setBinder(prev => ({ ...prev, cards: updatedCards }));
  };
  

  const toggleCardSelect = (card) => {
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
    } else {
      setSelectedCards(prev => [...prev, card]);
    }
  };

  const saveCardsToBinder = async () => {
    try {
      // TODO: Replace with backend API call
      console.log('🚧 BinderView: Firebase save commented out - using mock save');
      
      const updatedCards = [...(binder.cards || []), ...selectedCards];
      
      // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
      /*
      await updateDoc(doc(db, 'binders', id), { cards: updatedCards });
      */
      
      // Mock save for development
      setBinder(prev => ({ ...prev, cards: updatedCards }));
      setShowModal(false);
      setSelectedCards([]);
    } catch (err) {
      console.error("Error guardando cartas:", err);
    }
  };

  const filteredCards = binder?.cards?.filter(card => {
    const matchesName = !searchTerm || card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || card.types?.includes(filterType);
    const setName = typeof card.set === 'object' ? card.set.name : card.set;
    const matchesSet = !filterSet || setName === filterSet;
    return matchesName && matchesType && matchesSet;
  }) || [];
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [15, -15]);
  const rotateY = useTransform(x, [-50, 50], [-15, 15]);
  
  const handleMouseMove = (e) => {
    const bounds = ref.current.getBoundingClientRect();
    const xPos = e.clientX - bounds.left - bounds.width / 2;
    const yPos = e.clientY - bounds.top - bounds.height / 2;
    x.set(xPos);
    y.set(yPos);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  const paginatedCards = filteredCards.slice((page - 1) * cardsPerPage, page * cardsPerPage);
  const typesList = [...new Set(binder?.cards?.flatMap(c => c.types || []))];
  const setsList = [...new Set(binder?.cards?.map(c => typeof c.set === 'object' ? c.set.name : c.set))].filter(Boolean);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="section"
      style={{
        minHeight: '100vh',
        backgroundImage: 'url(https://www.transparenttextures.com/patterns/black-linen.png)',
        backgroundColor: '#1a1a1a',
        paddingTop: '60px'
      }}
    >
      <Container className="text-white">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-0">Binder tipo {binder.type}</h2>
            <p className="text-light">{binder.description || 'Sin descripción'}</p>
          </div>
          <Button onClick={() => setShowModal(true)}>Añadir cartas</Button>
        </div>

        {/* Filtros */}
        <Row className="mb-4">
          <Col md={6}>
            <InputGroup>
              <Form.Control
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Filtrar por tipo</option>
              {typesList.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select value={filterSet} onChange={(e) => setFilterSet(e.target.value)}>
              <option value="">Filtrar por expansión</option>
              {setsList.map(set => (
                <option key={set} value={set}>{set}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
          >
            <Row
              className="g-3 justify-content-center"
              style={{
                padding: '25px',
                background: '#2b2b2b',
                borderRadius: '10px',
                border: '1px solid #444'
              }}
            >
              {paginatedCards.map((card) => (
                <Col
                  key={card.id}
                  xs={binder.type === 'Jumbo' ? 12 : 4}
                  sm={binder.type === '4x4' ? 3 : binder.type === '2x2' ? 6 : 4}
                  md={binder.type === '4x4' ? 3 : binder.type === '2x2' ? 6 : 4}
                >
                  <Card
  className="bg-dark border-0 position-relative"
  style={{ cursor: 'pointer' }}
  onClick={() => {
    setPreviewCard(card);
    setShowPreview(true);
  }}
>
  <Card.Img
    src={card.images.small}
    alt=""
    style={{
      width: '100%',
      height: '160px',
      objectFit: 'contain',
      border: '2px solid #333',
      borderRadius: '6px'
    }}
  />
  <Button
    variant="danger"
    size="sm"
    className="position-absolute top-0 end-0 m-1"
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteCard(card.id);
    }}
  >
    <FaTrashAlt />
  </Button>
</Card>
                </Col>
              ))}
            </Row>
          </motion.div>
        </AnimatePresence>

        {/* Flechas */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-4 gap-4">
            <Button
              variant="light"
              size="lg"
              className="rounded-circle"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <FaArrowLeft />
            </Button>
            <span className="text-muted">Página {page} de {totalPages}</span>
            <Button
              variant="light"
              size="lg"
              className="rounded-circle"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <FaArrowRight />
            </Button>
          </div>
        )}
      </Container>

      {/* Modal vista previa de carta */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="md" centered>
  <motion.div
    ref={ref}
    style={{
      rotateX,
      rotateY,
      x,
      y,
      transformStyle: 'preserve-3d',
      cursor: 'grab'
    }}
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    transition={{ type: 'spring', stiffness: 150, damping: 10 }}
  >
    <Modal.Body style={{ background: '#222', borderRadius: '10px' }}>
      {previewCard && (
        <img
          src={previewCard.images.large}
          alt={previewCard.name}
          style={{ width: '100%', borderRadius: '8px' }}
        />
      )}
    </Modal.Body>
  </motion.div>
</Modal>


      {/* Modal para añadir cartas */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Añadir Cartas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            placeholder="Buscar carta (ej: Charizard)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchCards()}
          />
          <Button onClick={searchCards} className="mt-2 mb-3">Buscar</Button>
          <Row className="g-3">
            {results.map(card => (
              <Col key={card.id} md={3}>
                <Card
                  onClick={() => toggleCardSelect(card)}
                  className={`h-100 shadow-sm cursor-pointer ${selectedCards.some(c => c.id === card.id) ? 'border-primary' : ''}`}
                >
                  <Card.Img variant="top" src={card.images.small} />
                  <Card.Body>
                    <Card.Title className="fs-6">{card.name}</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {selectedCards.length > 0 && (
            <div className="text-end mt-4">
              <Button onClick={saveCardsToBinder}>
                Guardar {selectedCards.length} carta{selectedCards.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </motion.div>
  );
}
