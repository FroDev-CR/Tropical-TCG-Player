// src/components/MarketplaceFilters.js
import React from 'react';
import { Card, Form, Button, Badge, Accordion } from 'react-bootstrap';
import { FaFilter, FaTimes, FaStar } from 'react-icons/fa';

const TCG_TYPES = [
  { key: 'pokemon', name: 'Pokémon', icon: '⚡' },
  { key: 'onepiece', name: 'One Piece', icon: '🏴‍☠️' },
  { key: 'dragonball', name: 'Dragon Ball', icon: '🐉' },
  { key: 'digimon', name: 'Digimon', icon: '🦖' },
  { key: 'magic', name: 'Magic', icon: '🪄' },
  { key: 'unionarena', name: 'Union Arena', icon: '⚔️' },
  { key: 'gundam', name: 'Gundam', icon: '🤖' }
];

const PRICE_RANGES = [
  { key: 'under10', label: 'Menos de ₡10', min: 0, max: 10 },
  { key: '10to25', label: '₡10 - ₡25', min: 10, max: 25 },
  { key: '25to50', label: '₡25 - ₡50', min: 25, max: 50 },
  { key: '50to100', label: '₡50 - ₡100', min: 50, max: 100 },
  { key: 'over100', label: 'Más de ₡100', min: 100, max: 9999 }
];

const CONDITIONS = [
  { key: 'NM', label: 'Near Mint', color: 'success' },
  { key: 'GOOD', label: 'Good', color: 'warning' },
  { key: 'POOR', label: 'Poor', color: 'danger' }
];

const RARITIES = [
  'Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare', 'Secret Rare', 'Special'
];

export default function MarketplaceFilters({ filters, onFiltersChange, activeFiltersCount }) {
  const handleFilterChange = (category, value) => {
    const newFilters = { ...filters };
    
    if (category === 'tcgTypes') {
      if (newFilters.tcgTypes.includes(value)) {
        newFilters.tcgTypes = newFilters.tcgTypes.filter(t => t !== value);
      } else {
        newFilters.tcgTypes = [...newFilters.tcgTypes, value];
      }
    } else if (category === 'conditions') {
      if (newFilters.conditions.includes(value)) {
        newFilters.conditions = newFilters.conditions.filter(c => c !== value);
      } else {
        newFilters.conditions = [...newFilters.conditions, value];
      }
    } else if (category === 'rarities') {
      if (newFilters.rarities.includes(value)) {
        newFilters.rarities = newFilters.rarities.filter(r => r !== value);
      } else {
        newFilters.rarities = [...newFilters.rarities, value];
      }
    } else {
      newFilters[category] = value;
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      tcgTypes: [],
      priceRange: null,
      conditions: [],
      rarities: [],
      minRating: 0,
      sortBy: 'newest'
    });
  };

  return (
    <Card className="h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <FaFilter />
          <strong>Filtros</strong>
          {activeFiltersCount > 0 && (
            <Badge bg="primary">{activeFiltersCount}</Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={clearAllFilters}
            className="d-flex align-items-center gap-1"
          >
            <FaTimes size={12} />
            Limpiar
          </Button>
        )}
      </Card.Header>

      <Card.Body className="p-0">
        <Accordion defaultActiveKey={['0', '1', '2']} alwaysOpen>
          {/* Filtro por TCG */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Trading Card Games</Accordion.Header>
            <Accordion.Body>
              {TCG_TYPES.map(tcg => (
                <Form.Check
                  key={tcg.key}
                  type="checkbox"
                  id={`tcg-${tcg.key}`}
                  label={
                    <span className="d-flex align-items-center gap-2">
                      <span>{tcg.icon}</span>
                      <span>{tcg.name}</span>
                    </span>
                  }
                  checked={filters.tcgTypes.includes(tcg.key)}
                  onChange={() => handleFilterChange('tcgTypes', tcg.key)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>

          {/* Filtro por Precio */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>Rango de Precio</Accordion.Header>
            <Accordion.Body>
              <Form.Check
                type="radio"
                id="price-all"
                name="priceRange"
                label="Todos los precios"
                checked={!filters.priceRange}
                onChange={() => handleFilterChange('priceRange', null)}
                className="mb-2"
              />
              {PRICE_RANGES.map(range => (
                <Form.Check
                  key={range.key}
                  type="radio"
                  id={`price-${range.key}`}
                  name="priceRange"
                  label={range.label}
                  checked={filters.priceRange === range.key}
                  onChange={() => handleFilterChange('priceRange', range.key)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>

          {/* Filtro por Condición */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>Condición</Accordion.Header>
            <Accordion.Body>
              {CONDITIONS.map(condition => (
                <Form.Check
                  key={condition.key}
                  type="checkbox"
                  id={`condition-${condition.key}`}
                  label={
                    <span className="d-flex align-items-center gap-2">
                      <Badge bg={condition.color} className="small">
                        {condition.label}
                      </Badge>
                    </span>
                  }
                  checked={filters.conditions.includes(condition.key)}
                  onChange={() => handleFilterChange('conditions', condition.key)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>

          {/* Filtro por Rareza */}
          <Accordion.Item eventKey="3">
            <Accordion.Header>Rareza</Accordion.Header>
            <Accordion.Body>
              {RARITIES.map(rarity => (
                <Form.Check
                  key={rarity}
                  type="checkbox"
                  id={`rarity-${rarity}`}
                  label={rarity}
                  checked={filters.rarities.includes(rarity)}
                  onChange={() => handleFilterChange('rarities', rarity)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>

          {/* Filtro por Rating del Vendedor */}
          <Accordion.Item eventKey="4">
            <Accordion.Header>Rating del Vendedor</Accordion.Header>
            <Accordion.Body>
              <Form.Range
                min={0}
                max={5}
                step={0.5}
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                className="mb-2"
              />
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">Mínimo:</small>
                <div className="d-flex align-items-center gap-1">
                  <FaStar className="text-warning" size={14} />
                  <strong>{filters.minRating}</strong>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Ordenamiento */}
          <Accordion.Item eventKey="5">
            <Accordion.Header>Ordenar por</Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="name-az">Nombre: A-Z</option>
                <option value="name-za">Nombre: Z-A</option>
                <option value="rating">Mejor rating</option>
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
}