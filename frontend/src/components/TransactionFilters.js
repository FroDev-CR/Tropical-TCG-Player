// src/components/TransactionFilters.js
// Componente de filtros avanzados para transacciones

import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import './TransactionFilters.css';

export default function TransactionFilters({ onFilterChange, currentFilters = {} }) {
  const [filters, setFilters] = useState({
    status: currentFilters.status || '',
    role: currentFilters.role || '',
    dateRange: currentFilters.dateRange || '',
    amountRange: currentFilters.amountRange || '',
    cardName: currentFilters.cardName || '',
    participantName: currentFilters.participantName || '',
    ...currentFilters
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    // Limpiar filtros vacíos
    const cleanFilters = Object.keys(filters).reduce((acc, key) => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        acc[key] = filters[key];
      }
      return acc;
    }, {});

    onFilterChange(cleanFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: '',
      role: '',
      dateRange: '',
      amountRange: '',
      cardName: '',
      participantName: ''
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(currentFilters).length;
  };

  const statusOptions = [
    { value: 'pending_seller_response', label: 'Esperando respuesta vendedor' },
    { value: 'accepted_pending_delivery', label: 'Preparando entrega' },
    { value: 'delivered_pending_payment', label: 'Esperando pago' },
    { value: 'payment_confirmed', label: 'Pago confirmado' },
    { value: 'completed_pending_rating', label: 'Esperando calificación' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled_by_seller', label: 'Cancelada por vendedor' },
    { value: 'timeout_cancelled', label: 'Cancelada por tiempo' },
    { value: 'disputed', label: 'En disputa' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Últimos 3 meses' },
    { value: 'year', label: 'Este año' }
  ];

  const amountRangeOptions = [
    { value: '0-5000', label: '₡0 - ₡5,000' },
    { value: '5000-15000', label: '₡5,000 - ₡15,000' },
    { value: '15000-30000', label: '₡15,000 - ₡30,000' },
    { value: '30000-50000', label: '₡30,000 - ₡50,000' },
    { value: '50000+', label: '₡50,000+' }
  ];

  return (
    <Card className="transaction-filters">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">🔍 Filtros Avanzados</h6>
        {getActiveFilterCount() > 0 && (
          <Badge bg="primary">{getActiveFilterCount()} activo{getActiveFilterCount() > 1 ? 's' : ''}</Badge>
        )}
      </Card.Header>
      <Card.Body>
        <Row>
          {/* Estado */}
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label>📋 Estado</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos los estados</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Rol */}
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label>👤 Rol</Form.Label>
              <Form.Select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">Comprador y Vendedor</option>
                <option value="buyer">🛒 Solo como Comprador</option>
                <option value="seller">💰 Solo como Vendedor</option>
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Rango de Fechas */}
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label>📅 Período</Form.Label>
              <Form.Select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="">Todo el tiempo</option>
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Rango de Montos */}
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label>💰 Monto</Form.Label>
              <Form.Select
                value={filters.amountRange}
                onChange={(e) => handleFilterChange('amountRange', e.target.value)}
              >
                <option value="">Cualquier monto</option>
                {amountRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Nombre de Carta */}
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label>🃏 Carta</Form.Label>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre de carta..."
                value={filters.cardName}
                onChange={(e) => handleFilterChange('cardName', e.target.value)}
              />
            </Form.Group>
          </Col>

          {/* Nombre de Participante */}
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label>👥 Participante</Form.Label>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre de usuario..."
                value={filters.participantName}
                onChange={(e) => handleFilterChange('participantName', e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Botones de Acción */}
        <div className="filter-actions mt-3 pt-3 border-top">
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={applyFilters}
              className="d-flex align-items-center"
            >
              🔍 Aplicar Filtros
            </Button>
            <Button
              variant="outline-secondary"
              onClick={clearFilters}
              disabled={getActiveFilterCount() === 0}
            >
              🧹 Limpiar
            </Button>
          </div>
          <div className="filter-help mt-2">
            <small className="text-muted">
              💡 Usa múltiples filtros para búsquedas más específicas
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}