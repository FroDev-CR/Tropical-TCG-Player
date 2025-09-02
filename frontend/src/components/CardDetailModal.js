// src/components/CardDetailModal.js
// ⚠️ SIMPLIFICADO: Versión básica sin Firebase para evitar errores de compilación
// TODO: Implementar completamente con backend API

import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Button, Alert } from 'react-bootstrap';
import { FaHeart, FaInfoCircle } from 'react-icons/fa';

export default function CardDetailModal({ show, onHide, card }) {
  const [favorites, setFavorites] = useState([]);

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

  if (!card) {
    return null;
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          {card.name}
          <Button
            variant={favorites.includes(card.id) ? "danger" : "outline-secondary"}
            onClick={() => toggleFavorite(card.id)}
            size="sm"
          >
            <FaHeart size={14} />
          </Button>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row>
          <Col md={6}>
            <img
              src={card.images?.large || card.images?.small || 'https://via.placeholder.com/300x400'}
              alt={card.name}
              className="img-fluid rounded"
            />
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <h6>Información Básica</h6>
              <p><strong>Set:</strong> {card.set?.name || 'N/A'}</p>
              <p><strong>Rareza:</strong> <Badge bg="secondary">{card.rarity || 'N/A'}</Badge></p>
              {card.tcgType && <p><strong>TCG:</strong> {card.tcgType.toUpperCase()}</p>}
            </div>

            {/* Información específica por TCG */}
            {card.tcgType === 'pokemon' && (
              <div className="mb-3">
                <h6>Datos Pokémon</h6>
                {card.hp && <p><strong>HP:</strong> {card.hp}</p>}
                {card.types && <p><strong>Tipo:</strong> {card.types.join(', ')}</p>}
              </div>
            )}

            {/* Vendedores placeholder */}
            <div className="mb-3">
              <h6>Vendedores</h6>
              <Alert variant="info">
                <FaInfoCircle className="me-2" />
                Funcionalidad de vendedores en desarrollo.
                <br />
                <small>Se integrará con el backend API próximamente.</small>
              </Alert>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}