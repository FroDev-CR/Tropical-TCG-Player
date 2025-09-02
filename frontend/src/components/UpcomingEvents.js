import { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const UpcomingEvents = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const now = new Date();
        const q = query(
          collection(/* db */ null, 'events'),
          where('date', '>=', Timestamp.fromDate(now)),
          orderBy('date', 'asc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        }));
        
        setUpcomingEvents(events);
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
        // Si hay error con el query (posiblemente por índices), cargar todos y filtrar
        try {
          const fallbackQuery = query(
            collection(/* db */ null, 'events'),
            orderBy('date', 'asc'),
            limit(10)
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const allEvents = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date()
          }));
          
          // Filtrar eventos futuros
          const now = new Date();
          const futureEvents = allEvents
            .filter(event => event.date >= now)
            .slice(0, 3);
          
          setUpcomingEvents(futureEvents);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilEvent = (eventDate) => {
    const now = new Date();
    const timeDiff = eventDate - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    if (days < 7) return `En ${days} días`;
    if (days < 30) return `En ${Math.floor(days / 7)} semanas`;
    return `En ${Math.floor(days / 30)} meses`;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando próximos eventos...</p>
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-4"
      >
        <div className="mb-4">
          <h3 className="h4 fw-bold text-primary mb-3">
            <i className="fas fa-calendar-alt me-2"></i>
            Próximos Eventos
          </h3>
        </div>
        <div className="card border-0">
          <div className="card-body py-4">
            <i className="fas fa-calendar-plus fa-2x text-white mb-3"></i>
            <p className="text-white mb-2">No hay eventos programados</p>
            <Link to="/eventos" className="btn btn-outline-primary btn-sm">
              Ver calendario completo
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="h4 fw-bold text-primary mb-0">
          <i className="fas fa-calendar-alt me-2"></i>
          Próximos Eventos
        </h3>
        <Link 
          to="/eventos" 
          className="btn btn-outline-primary btn-sm"
        >
          Ver calendario
        </Link>
      </div>
      
      <div className="latest-cards-horizontal">
        <div className="latest-cards-container">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              className="event-card-item"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className="h-100 shadow-sm border-0 upcoming-event-card square-event-card">
                <div className="event-image-container">
                  {event.image ? (
                    <Card.Img 
                      variant="top" 
                      src={event.image} 
                      className="event-square-image"
                    />
                  ) : (
                    <div className="event-placeholder-image">
                      <i className="fas fa-calendar-alt fa-2x text-muted"></i>
                    </div>
                  )}
                  <div className="event-overlay">
                    <span className="event-time-badge">
                      {getTimeUntilEvent(event.date)}
                    </span>
                  </div>
                </div>
                
                <Card.Body className="p-2">
                  <h6 className="card-title fw-bold mb-1 text-truncate small">
                    {event.title}
                  </h6>
                  
                  <p className="card-text text-muted mb-1" style={{ fontSize: '0.7rem' }}>
                    <i className="fas fa-clock me-1"></i>
                    {formatDate(event.date).split(',')[0]}
                  </p>
                  
                  {event.price && (
                    <span className="badge bg-success" style={{ fontSize: '0.6rem' }}>
                      ${event.price}
                    </span>
                  )}
                </Card.Body> 
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="text-center mt-4">
        <Link 
          to="/eventos" 
          className="btn btn-primary"
        >
          <i className="fas fa-calendar-check me-2"></i>
          Ver Todos los Eventos
        </Link>
      </div>
    </motion.div>
  );
};

export default UpcomingEvents;