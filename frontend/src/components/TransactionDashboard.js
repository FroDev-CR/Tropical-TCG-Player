// src/components/TransactionDashboard.js
// Dashboard completo para gestión de transacciones P2P

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useP2PTransactions } from '../hooks/useP2PTransactions';
import TransactionCard from './TransactionCard';
import TransactionFilters from './TransactionFilters';
import TransactionStats from './TransactionStats';
import './TransactionDashboard.css';

export default function TransactionDashboard() {
  const {
    transactions,
    loading,
    error,
    getUserStats,
    getFilteredTransactions,
    getUpcomingActions,
    formatTimeRemaining,
    clearError
  } = useP2PTransactions();

  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [stats, setStats] = useState({});
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [upcomingActions, setUpcomingActions] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!loading) {
      setStats(getUserStats());
      setUpcomingActions(getUpcomingActions());
    }
  }, [transactions, loading]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let currentFilters = { ...filters };

    // Aplicar filtro por tab activo
    switch (activeTab) {
      case 'buyer':
        currentFilters.role = 'buyer';
        break;
      case 'seller':
        currentFilters.role = 'seller';
        break;
      case 'pending':
        currentFilters.status = ['pending_seller_response', 'accepted_pending_delivery', 'delivered_pending_payment', 'payment_confirmed'];
        break;
      case 'completed':
        currentFilters.status = 'completed';
        break;
      case 'urgent':
        currentFilters.urgent = true;
        break;
      default:
        // 'all' - sin filtros adicionales
        break;
    }

    const filtered = getFilteredTransactions(currentFilters);
    setFilteredTransactions(filtered);
  }, [activeTab, filters, transactions]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'buyer':
        return transactions.filter(t => t.role === 'buyer').length;
      case 'seller':
        return transactions.filter(t => t.role === 'seller').length;
      case 'pending':
        return transactions.filter(t => !['completed', 'cancelled_by_seller', 'timeout_cancelled', 'disputed'].includes(t.status)).length;
      case 'completed':
        return transactions.filter(t => t.status === 'completed').length;
      case 'urgent':
        return upcomingActions.filter(a => a.urgent).length;
      default:
        return transactions.length;
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Cargando transacciones...</span>
        </Spinner>
        <p className="text-muted">Cargando tus transacciones...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="transaction-dashboard py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">📊 Panel de Transacciones</h2>
              <p className="text-muted mb-0">Gestiona tus compras y ventas P2P</p>
            </div>
            <Button
              variant="outline-primary"
              onClick={() => setShowFilters(!showFilters)}
              className="d-flex align-items-center"
            >
              🔍 Filtros
              {Object.keys(filters).length > 0 && (
                <Badge bg="primary" className="ms-2">{Object.keys(filters).length}</Badge>
              )}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={clearError}>
              <Alert.Heading>Error</Alert.Heading>
              <p className="mb-0">{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Stats Cards */}
      <TransactionStats stats={stats} upcomingActions={upcomingActions} />

      {/* Filters */}
      {showFilters && (
        <Row className="mb-4">
          <Col>
            <TransactionFilters
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </Col>
        </Row>
      )}

      {/* Navigation Tabs */}
      <Row className="mb-4">
        <Col>
          <Nav variant="pills" className="transaction-tabs">
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                className="d-flex align-items-center"
              >
                📋 Todas
                <Badge bg="secondary" className="ms-2">{getTabCount('all')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'urgent'}
                onClick={() => setActiveTab('urgent')}
                className="d-flex align-items-center"
              >
                🔥 Urgentes
                <Badge bg="danger" className="ms-2">{getTabCount('urgent')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'pending'}
                onClick={() => setActiveTab('pending')}
                className="d-flex align-items-center"
              >
                ⏳ Pendientes
                <Badge bg="warning" className="ms-2">{getTabCount('pending')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'buyer'}
                onClick={() => setActiveTab('buyer')}
                className="d-flex align-items-center"
              >
                🛒 Compras
                <Badge bg="info" className="ms-2">{getTabCount('buyer')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'seller'}
                onClick={() => setActiveTab('seller')}
                className="d-flex align-items-center"
              >
                💰 Ventas
                <Badge bg="success" className="ms-2">{getTabCount('seller')}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === 'completed'}
                onClick={() => setActiveTab('completed')}
                className="d-flex align-items-center"
              >
                ✅ Completadas
                <Badge bg="success" className="ms-2">{getTabCount('completed')}</Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>

      {/* Upcoming Actions Alert */}
      {upcomingActions.length > 0 && activeTab !== 'urgent' && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" className="d-flex justify-content-between align-items-center">
              <div>
                <strong>⚠️ Tienes {upcomingActions.length} acción{upcomingActions.length > 1 ? 'es' : ''} pendiente{upcomingActions.length > 1 ? 's' : ''}</strong>
                <div className="small mt-1">
                  {upcomingActions.slice(0, 2).map((action, index) => (
                    <div key={action.transactionId}>
                      • {action.cardName} - {action.statusText}
                      {action.urgent && <Badge bg="danger" className="ms-2">Urgente</Badge>}
                    </div>
                  ))}
                  {upcomingActions.length > 2 && (
                    <div className="text-muted">...y {upcomingActions.length - 2} más</div>
                  )}
                </div>
              </div>
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => setActiveTab('urgent')}
              >
                Ver Urgentes
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Transactions List */}
      <Row>
        <Col>
          {filteredTransactions.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <div className="mb-3" style={{ fontSize: '3rem' }}>
                  {activeTab === 'all' ? '📭' : 
                   activeTab === 'urgent' ? '🔥' : 
                   activeTab === 'pending' ? '⏳' : 
                   activeTab === 'buyer' ? '🛒' : 
                   activeTab === 'seller' ? '💰' : '✅'}
                </div>
                <h5 className="text-muted">
                  {activeTab === 'all' ? 'No tienes transacciones aún' :
                   activeTab === 'urgent' ? 'No tienes acciones urgentes' :
                   activeTab === 'pending' ? 'No tienes transacciones pendientes' :
                   activeTab === 'buyer' ? 'No tienes compras registradas' :
                   activeTab === 'seller' ? 'No tienes ventas registradas' :
                   'No tienes transacciones completadas'}
                </h5>
                <p className="text-muted">
                  {activeTab === 'all' || activeTab === 'buyer' ? 
                    'Ve al marketplace para empezar a comprar cartas' :
                   activeTab === 'seller' ?
                    'Crea listados en el marketplace para empezar a vender' :
                    'Las transacciones aparecerán aquí cuando las tengas'}
                </p>
                {(activeTab === 'all' || activeTab === 'buyer') && (
                  <Button variant="primary" href="/marketplace">
                    🛒 Ir al Marketplace
                  </Button>
                )}
              </Card.Body>
            </Card>
          ) : (
            <div className="transactions-grid">
              {filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => handleTransactionClick(transaction)}
                  showRole={activeTab === 'all'}
                />
              ))}
            </div>
          )}
        </Col>
      </Row>

      {/* Transaction Details Modal */}
      <Modal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        size="lg"
        className="transaction-details-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            📄 Detalles de Transacción
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div>
              <h5>{selectedTransaction.items?.[0]?.cardName || 'Transacción'}</h5>
              <p>Estado: {selectedTransaction.status}</p>
              <p>Rol: {selectedTransaction.role === 'buyer' ? 'Comprador' : 'Vendedor'}</p>
              <p>Monto: ₡{selectedTransaction.totalAmount?.toLocaleString()}</p>
              <p>Fecha: {selectedTransaction.createdAt?.toDate?.()?.toLocaleDateString()}</p>
              {/* Aquí se pueden agregar más detalles */}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}