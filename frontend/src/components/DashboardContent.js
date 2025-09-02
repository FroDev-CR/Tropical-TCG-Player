// src/components/DashboardContent.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tab, Tabs, Table, Badge, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { FaChartLine, FaBoxOpen, FaDollarSign, FaStar, FaEye, FaEdit, FaTrash, FaPlus, FaCalendarAlt, FaTrophy } from 'react-icons/fa';
// Comentado Firebase - ahora usa backend API
// import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc, limit } from 'firebase/firestore';
// import { db } from '../firebase';
import backendAPI from '../services/backendAPI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import SellCardModal from './SellCardModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardContent({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  
  // Data states
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalListings: 0,
    activeListings: 0,
    averageRating: 0,
    totalReviews: 0,
    salesData: [],
    popularTCGs: [],
    topCards: [],
    recentSales: [],
    listings: [],
    transactions: []
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch dashboard data from backend
      const statsResponse = await backendAPI.getDashboardStats();
      
      if (statsResponse.success) {
        const days = parseInt(selectedPeriod);
        
        // Generate sales data for chart
        const salesData = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = subDays(new Date(), i);
          salesData.push({
            date: format(date, 'dd/MM', { locale: es }),
            sales: 0, // Real data will come from transactions
            revenue: 0 // Real data will come from transactions
          });
        }
        
        // Set dashboard data
        const stats = statsResponse.data?.stats || {};
        setDashboardData({
          totalSales: stats.transactions?.sales?.total || 0,
          totalRevenue: stats.transactions?.sales?.earned || 0,
          totalListings: stats.listings?.total || 0,
          activeListings: stats.listings?.byStatus?.active || 0,
          averageRating: stats.user?.rating || 0,
          totalReviews: 0, // TODO: Add reviews count
          salesData: salesData,
          listings: statsResponse.data?.recentActivity?.recentListings || [],
          transactions: statsResponse.data?.recentActivity?.activeTransactions || []
        });
      } else {
        throw new Error(statsResponse.message || 'Error fetching dashboard data');
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data as fallback
      setDashboardData({
        totalSales: 0,
        totalRevenue: 0,
        totalListings: 0,
        activeListings: 0,
        averageRating: 0,
        totalReviews: 0,
        salesData: [],
        listings: [],
        transactions: []
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, selectedPeriod]);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      return;
    }
    
    try {
      // TODO: Implement delete endpoint in backend
      console.log('Delete listing:', listingId);
      alert('Funcionalidad de eliminar pendiente de implementar');
      // await backendAPI.deleteListing(listingId);
      // fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error eliminando publicación:', error);
    }
  };

  if (!user) {
    return (
      <Alert variant="warning">
        Debes iniciar sesión para ver tu dashboard.
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Period selector */}
      <Row className="mb-4">
        <Col md={6}>
          <h4>Mi Dashboard</h4>
        </Col>
        <Col md={6} className="text-end">
          <Form.Select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: 'auto', display: 'inline-block' }}
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 admin-card">
            <Card.Body className="text-center">
              <FaDollarSign size={40} className="text-success mb-3" />
              <h3>₡${dashboardData.totalRevenue.toFixed(2)}</h3>
              <p className="text-muted mb-0">Ingresos Totales</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 admin-card">
            <Card.Body className="text-center">
              <FaChartLine size={40} className="text-primary mb-3" />
              <h3>{dashboardData.totalSales}</h3>
              <p className="text-muted mb-0">Ventas Completadas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 admin-card">
            <Card.Body className="text-center">
              <FaBoxOpen size={40} className="text-warning mb-3" />
              <h3>{dashboardData.activeListings}/{dashboardData.totalListings}</h3>
              <p className="text-muted mb-0">Publicaciones Activas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 admin-card">
            <Card.Body className="text-center">
              <FaStar size={40} className="text-info mb-3" />
              <h3>{dashboardData.averageRating.toFixed(1)}</h3>
              <p className="text-muted mb-0">Calificación ({dashboardData.totalReviews} reviews)</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs Content */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="overview" title="Resumen">
          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Ventas e Ingresos</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Ventas" />
                      <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Ingresos (₡)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card>
                <Card.Header>
                  <h5>Acciones Rápidas</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="primary" onClick={() => setShowSellModal(true)}>
                      <FaPlus className="me-2" />
                      Nueva Publicación
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="listings" title="Mis Publicaciones">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Mis Publicaciones ({dashboardData.listings.length})</h5>
              <Button variant="primary" size="sm" onClick={() => setShowSellModal(true)}>
                <FaPlus className="me-2" />
                Nueva Publicación
              </Button>
            </Card.Header>
            <Card.Body>
              {dashboardData.listings.length === 0 ? (
                <Alert variant="info">No tienes publicaciones aún.</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Carta</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Stock</th>
                      <th>Creada</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.listings.map(listing => (
                      <tr key={listing.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img 
                              src={listing.cardImage} 
                              alt={listing.cardName}
                              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                              className="me-2"
                            />
                            <div>
                              <div className="fw-bold">{listing.cardName}</div>
                              <small className="text-muted">{listing.condition}</small>
                            </div>
                          </div>
                        </td>
                        <td>₡${listing.price}</td>
                        <td>
                          <Badge bg={listing.status === 'active' ? 'success' : 'secondary'}>
                            {listing.status === 'active' ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </td>
                        <td>{listing.availableQuantity || listing.quantity}</td>
                        <td>{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteListing(listing.id)}>
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Sell Modal */}
      <SellCardModal 
        show={showSellModal}
        onHide={() => setShowSellModal(false)}
        onSuccess={() => {
          setShowSellModal(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
}