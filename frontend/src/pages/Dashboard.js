// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs, Table, Badge, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { FaChartLine, FaBoxOpen, FaDollarSign, FaStar, FaEye, FaEdit, FaTrash, FaPlus, FaCalendarAlt, FaTrophy, FaHandshake, FaComments, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import backendAPI from '../services/backendAPI';
import SellCardModal from '../components/SellCardModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [transactions, setTransactions] = useState([]);
  const [listings, setListings] = useState([]);
  
  // Data states
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalListings: 0,
    activeListings: 0,
    averageRating: 0,
    totalReviews: 0,
    salesData: [],
    tcgDistribution: [],
    recentSales: [],
    allListings: [],
    buyerTransactions: [],
    sellerTransactions: []
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats from backend
      const statsResponse = await backendAPI.getDashboardStats();
      
      if (statsResponse.success) {
        setDashboardData({
          totalSales: statsResponse.stats.completedSales || 0,
          totalRevenue: 0, // TODO: Calculate from completed transactions
          totalListings: statsResponse.stats.totalListings || 0,
          activeListings: statsResponse.stats.totalListings || 0, // TODO: Separate active vs total
          averageRating: statsResponse.stats.rating || 0,
          totalReviews: 0, // TODO: Add review count to backend
          salesData: generateSalesChartData(statsResponse.recentActivity?.activeTransactions || [], parseInt(selectedPeriod)),
          tcgDistribution: generateTCGDistribution(statsResponse.recentActivity?.recentListings || []),
          recentSales: statsResponse.recentActivity?.activeTransactions?.slice(0, 10) || [],
          allListings: statsResponse.recentActivity?.recentListings || [],
          buyerTransactions: [],
          sellerTransactions: []
        });
      }

      // Fetch transactions
      const transactionsResponse = await backendAPI.getTransactions();
      if (transactionsResponse.success) {
        const allTransactions = transactionsResponse.transactions.map(t => ({
          ...t,
          createdAt: new Date(t.timeline?.created || t.createdAt),
          type: t.buyer.userId === user._id ? 'buyer' : 'seller'
        }));
        setTransactions(allTransactions);
      }

      // Fetch user listings
      const listingsResponse = await backendAPI.getUserListings();
      if (listingsResponse.success) {
        setListings(listingsResponse.listings || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const generateSalesChartData = (transactions, days) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayTransactions = transactions.filter(t => 
        t.createdAt && format(t.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      data.push({
        date: format(date, 'dd/MM', { locale: es }),
        sales: dayTransactions.length,
        revenue: dayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
      });
    }
    return data;
  };

  const generateTCGDistribution = (listings) => {
    const distribution = {};
    listings.forEach(listing => {
      const tcg = listing.tcgType || 'Unknown';
      distribution[tcg] = (distribution[tcg] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        // TODO: Implement delete endpoint in backend
        console.log('Delete listing:', listingId);
        alert('Funcionalidad de eliminar pendiente de implementar');
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Error al eliminar la publicación');
      }
    }
  };

  const handleMarkAsSold = async (listingId) => {
    if (window.confirm('¿Marcar esta publicación como vendida?')) {
      try {
        const updateData = {
          status: 'sold_out',
          availableQuantity: 0
        };
        
        const response = await backendAPI.updateListing(listingId, updateData);
        
        if (response.success) {
          fetchDashboardData();
          alert('Publicación marcada como vendida');
        } else {
          alert('Error al actualizar la publicación: ' + response.message);
        }
      } catch (error) {
        console.error('Error updating listing:', error);
        alert('Error al actualizar la publicación');
      }
    }
  };

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      // TODO: Implement specific transaction status update endpoints
      console.log('Update transaction:', transactionId, 'to:', newStatus);
      alert('Funcionalidad de actualizar transacción pendiente de implementar');
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error al actualizar la transacción');
    }
  };

  const openChat = (transaction) => {
    // TODO: Implement chat functionality
    alert('Funcionalidad de chat pendiente de implementar');
  };

  const getStatusBadgeTransaction = (status) => {
    const statusMap = {
      'PENDIENTE': { label: 'Pendiente', variant: 'warning', icon: FaClock },
      'ACEPTADA': { label: 'Aceptada', variant: 'info', icon: FaCheck },
      'ENVIADA': { label: 'Enviada', variant: 'primary', icon: FaBoxOpen },
      'COMPLETADA': { label: 'Completada', variant: 'success', icon: FaCheck },
      'CANCELADA': { label: 'Cancelada', variant: 'danger', icon: FaTimes }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary', icon: FaClock };
    const IconComponent = statusInfo.icon;
    return (
      <Badge bg={statusInfo.variant} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Activo', variant: 'success' },
      'sold': { label: 'Vendido', variant: 'info' },
      'inactive': { label: 'Inactivo', variant: 'secondary' }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge bg={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" />
          <p className="text-muted">Cargando dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📊 Dashboard de Vendedor</h2>
        <div className="d-flex gap-2 align-items-center">
          <Form.Select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </Form.Select>
          <Button 
            variant="primary" 
            onClick={() => setShowSellModal(true)}
            className="d-flex align-items-center gap-2"
          >
            <FaPlus size={14} />
            Nueva Venta
          </Button>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="overview" title="📈 Resumen">
          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaDollarSign className="text-success mb-2" size={24} />
                  <h3 className="text-success">{formatCurrency(dashboardData.totalRevenue)}</h3>
                  <small className="text-muted">Ingresos Totales</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaChartLine className="text-primary mb-2" size={24} />
                  <h3 className="text-primary">{dashboardData.totalSales}</h3>
                  <small className="text-muted">Ventas Realizadas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaBoxOpen className="text-warning mb-2" size={24} />
                  <h3 className="text-warning">{dashboardData.activeListings}</h3>
                  <small className="text-muted">Publicaciones Activas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaStar className="text-info mb-2" size={24} />
                  <h3 className="text-info">{dashboardData.averageRating.toFixed(1)}</h3>
                  <small className="text-muted">Rating Promedio ({dashboardData.totalReviews} reseñas)</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row className="mb-4">
            <Col md={8}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <FaChartLine className="text-primary" />
                    Ventas e Ingresos por Día
                  </h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#0d6efd" 
                        strokeWidth={2}
                        name="Ventas"
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#198754" 
                        strokeWidth={2}
                        name="Ingresos (₡)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Distribución por TCG</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.tcgDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.tcgDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Sales */}
          <Row>
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <FaTrophy className="text-warning" />
                    Ventas Recientes
                  </h5>
                </Card.Header>
                <Card.Body>
                  {dashboardData.recentSales.length === 0 ? (
                    <Alert variant="info" className="text-center">
                      <FaCalendarAlt className="me-2" />
                      No hay ventas registradas en este período.
                    </Alert>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Comprador</th>
                          <th>Productos</th>
                          <th>Total</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentSales.map((sale) => (
                          <tr key={sale.id}>
                            <td>
                              {sale.createdAt ? 
                                format(sale.createdAt, 'dd/MM/yyyy HH:mm', { locale: es }) : 
                                'N/A'
                              }
                            </td>
                            <td>{sale.buyerName || 'Usuario'}</td>
                            <td>{sale.items?.length || 1} producto(s)</td>
                            <td className="fw-bold text-success">
                              {formatCurrency(sale.totalAmount)}
                            </td>
                            <td>
                              <Badge bg="success">Completada</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="transactions" title="💰 Transacciones">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Historial de Transacciones</h4>
            <div className="d-flex gap-2">
              <Badge bg="info">Como Comprador: {dashboardData.buyerTransactions.length}</Badge>
              <Badge bg="success">Como Vendedor: {dashboardData.sellerTransactions.length}</Badge>
            </div>
          </div>

          {transactions.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FaHandshake className="me-2" />
              No tienes transacciones registradas en este período.
            </Alert>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Contraparte</th>
                      <th>Productos</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {transaction.createdAt ? 
                            format(transaction.createdAt, 'dd/MM/yyyy HH:mm', { locale: es }) : 
                            'N/A'
                          }
                        </td>
                        <td>
                          <Badge bg={transaction.type === 'seller' ? 'success' : 'primary'}>
                            {transaction.type === 'seller' ? '📤 Venta' : '📥 Compra'}
                          </Badge>
                        </td>
                        <td>
                          {transaction.type === 'seller' ? 
                            transaction.buyerName : 
                            transaction.sellerName
                          }
                        </td>
                        <td>
                          <div>
                            {transaction.items?.slice(0, 2).map((item, idx) => (
                              <small key={idx} className="d-block text-muted">
                                {item.cardName} (x{item.quantity})
                              </small>
                            ))}
                            {transaction.items?.length > 2 && (
                              <small className="text-muted">+{transaction.items.length - 2} más</small>
                            )}
                          </div>
                        </td>
                        <td className="fw-bold text-success">
                          {formatCurrency(transaction.totalAmount)}
                        </td>
                        <td>
                          {getStatusBadgeTransaction(transaction.status)}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openChat(transaction)}
                              title="Abrir chat"
                            >
                              <FaComments size={12} />
                            </Button>
                            
                            {transaction.type === 'seller' && transaction.status === 'PENDIENTE' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'ACEPTADA')}
                                title="Aceptar oferta"
                              >
                                <FaCheck size={12} />
                              </Button>
                            )}
                            
                            {transaction.type === 'seller' && transaction.status === 'ACEPTADA' && (
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'ENVIADA')}
                                title="Marcar como enviado"
                              >
                                <FaBoxOpen size={12} />
                              </Button>
                            )}
                            
                            {transaction.status === 'ENVIADA' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'COMPLETADA')}
                                title="Marcar como completado"
                              >
                                <FaTrophy size={12} />
                              </Button>
                            )}
                            
                            {['PENDIENTE', 'ACEPTADA'].includes(transaction.status) && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'CANCELADA')}
                                title="Cancelar transacción"
                              >
                                <FaTimes size={12} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="listings" title="📦 Mis Publicaciones">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Gestión de Publicaciones</h4>
            <Button 
              variant="primary" 
              onClick={() => setShowSellModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FaPlus size={14} />
              Nueva Publicación
            </Button>
          </div>

          {dashboardData.allListings.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FaBoxOpen className="me-2" />
              No tienes publicaciones activas. ¡Crea tu primera publicación!
            </Alert>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th>Carta</th>
                      <th>TCG</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Vistas</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.allListings.map((listing) => (
                      <tr key={listing.id}>
                        <td>
                          <img 
                            src={listing.cardImage || 'https://via.placeholder.com/50'} 
                            alt={listing.cardName}
                            style={{ width: '50px', height: '70px', objectFit: 'contain' }}
                            className="rounded"
                          />
                        </td>
                        <td>
                          <div>
                            <div className="fw-bold">{listing.cardName}</div>
                            <small className="text-muted">{listing.setName}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">{listing.tcgType?.toUpperCase()}</Badge>
                        </td>
                        <td className="fw-bold text-success">
                          {formatCurrency(listing.price)}
                        </td>
                        <td>
                          <Badge bg={listing.availableQuantity > 0 ? 'success' : 'danger'}>
                            {listing.availableQuantity || 0}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <FaEye className="text-muted" size={14} />
                            <span>{listing.views || 0}</span>
                          </div>
                        </td>
                        <td>{getStatusBadge(listing.status)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              title="Editar"
                            >
                              <FaEdit size={12} />
                            </Button>
                            {listing.status === 'active' && (
                              <Button 
                                variant="outline-warning" 
                                size="sm"
                                onClick={() => handleMarkAsSold(listing.id)}
                                title="Marcar como vendida"
                              >
                                <FaDollarSign size={12} />
                              </Button>
                            )}
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteListing(listing.id)}
                              title="Eliminar"
                            >
                              <FaTrash size={12} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>

      {/* Sell Card Modal */}
      <SellCardModal
        show={showSellModal}
        onHide={() => setShowSellModal(false)}
        onSuccess={() => {
          setShowSellModal(false);
          fetchDashboardData(); // Refresh dashboard data
        }}
      />

      {/* Chat Modal - TODO: Implement */}
    </Container>
  );
}