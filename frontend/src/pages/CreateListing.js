// src/pages/CreateListing.js
import { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';

const API_KEY = process.env.REACT_APP_POKEMON_API_KEY;

export default function CreateListing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    condition: 'Nueva',
    quantity: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchCards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${searchTerm}*`, {
        headers: { 'X-Api-Key': API_KEY }
      });
      const data = await response.json();
      setSearchResults(data.data);
    } catch (error) {
      setError('Error buscando cartas');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCard) {
      setError('Debes seleccionar una carta primero');
      return;
    }
    
    try {
      // TODO: Replace with backend API calls
      console.log('🚧 CreateListing: Firebase code commented out - using mock creation');
      
      // FIREBASE CODE COMMENTED OUT - REPLACE WITH BACKEND API
      /*
      await addDoc(collection(db, 'listings'), {
        ...formData,
        cardId: selectedCard.id,
        cardName: selectedCard.name,
        cardImage: selectedCard.images.small,
        userId: auth.currentUser.uid,
        userPhone: auth.currentUser.phoneNumber,
        userProvince: auth.currentUser.province,
        createdAt: new Date()
      });
      */

      // Mock listing creation for development
      const listingData = {
        ...formData,
        cardId: selectedCard.id,
        cardName: selectedCard.name,
        cardImage: selectedCard.images.small,
        userId: 'test-user',
        userPhone: '8888-8888',
        userProvince: 'San José',
        createdAt: new Date()
      };
      
      console.log('Mock listing created:', listingData);
      
      setSuccess('🚧 Funcionalidad en desarrollo - ¡Listado creado exitosamente (simulado)!');
      setFormData({ price: '', condition: 'Nueva', quantity: 1 });
      setSelectedCard(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error creando listado');
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
        <h2 className="section-title">Crear Listado</h2>
        
        <div className="mb-4">
          <Form.Control
            type="text"
            placeholder="Buscar carta para listar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchCards()}
          />
          <Button className="mt-2" onClick={searchCards} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Buscar'}
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row className="g-4">
          {searchResults.map(card => (
            <Col key={card.id} md={4}>
              <Card 
                className={`h-100 shadow-sm cursor-pointer ${selectedCard?.id === card.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedCard(card)}
              >
                <Card.Img variant="top" src={card.images.small} />
                <Card.Body>
                  <Card.Title>{card.name}</Card.Title>
                  <Card.Text>
                    {typeof card.set === 'object' ? (card.set.name || 'Set desconocido') : (card.set || 'Set desconocido')} - {card.rarity}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {selectedCard && (
          <Form onSubmit={handleSubmit} className="mt-5">
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Precio (USD)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Condición</Form.Label>
                  <Form.Select
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  >
                    <option>Nueva</option>
                    <option>Usada - Excelente</option>
                    <option>Usada - Buena</option>
                    <option>Usada - Regular</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cantidad</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <div className="text-center mt-4">
                <Button type="submit" variant="primary" size="lg">
                  Publicar Listado
                </Button>
              </div>
            </Row>
          </Form>
        )}
      </Container>
    </motion.div>
  );
}