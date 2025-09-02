import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Modal, Button, Image } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

export default function EventCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Datos de eventos estáticos temporales (reemplazar con API cuando esté lista)
        const eventsData = [
          {
            id: '1',
            title: 'Torneo Pokémon TCG',
            start: new Date(2025, 8, 15, 10, 0), // Sept 15, 2025
            end: new Date(2025, 8, 15, 18, 0),
            description: 'Torneo oficial de Pokémon TCG con premios increíbles',
            price: 5000,
            image: 'https://via.placeholder.com/500x300?text=Pokemon+TCG'
          },
          {
            id: '2', 
            title: 'Liga One Piece',
            start: new Date(2025, 8, 22, 14, 0), // Sept 22, 2025
            end: new Date(2025, 8, 22, 20, 0),
            description: 'Liga semanal de One Piece TCG',
            price: 3000,
            image: 'https://via.placeholder.com/500x300?text=One+Piece+TCG'
          },
          {
            id: '3',
            title: 'Draft Dragon Ball',
            start: new Date(2025, 8, 29, 16, 0), // Sept 29, 2025
            end: new Date(2025, 8, 29, 21, 0),
            description: 'Draft de Dragon Ball Super Card Game',
            price: 4000,
            image: 'https://via.placeholder.com/500x300?text=Dragon+Ball+TCG'
          }
        ];
        setEvents(eventsData);
      } catch (error) {
        console.error("Error cargando eventos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const eventStyle = (event) => ({
    style: {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${event.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }
  });

  const EventContent = ({ event }) => (
    <div className="p-1 text-center w-100">
      <div className="event-title">{event.title}</div>
      {event.price > 0 && <div className="event-price">₡${event.price}</div>}
    </div>
  );

  return (
    <>
      <div className="calendar-container">
        {loading ? (
          <div className="text-center my-5">Cargando eventos...</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            components={{ event: EventContent }}
            eventPropGetter={eventStyle}
            onSelectEvent={(event) => {
              setSelectedEvent(event);
              setShowModal(true);
            }}
            messages={{
              today: 'Hoy',
              previous: 'Anterior',
              next: 'Siguiente',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              noEventsInRange: 'No hay eventos programados.'
            }}
          />
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-primary">{selectedEvent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-4">
            <div className="col-md-6">
              <Image 
                src={selectedEvent?.image} 
                alt={selectedEvent?.title}
                fluid
                className="rounded-3 modal-image"
              />
            </div>
            <div className="col-md-6">
              <div className="d-flex flex-column h-100">
                <div className="mb-3">
                  <h5 className="text-accent">Detalles del Evento</h5>
                  <div className="detail-item">
                    <i className="bi bi-calendar-event me-2"></i>
                    {moment(selectedEvent?.start).format('DD MMM YYYY - HH:mm')}
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-cash me-2"></i>
                    Valor: ₡${selectedEvent?.price}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-muted mb-0">
                    {selectedEvent?.description || 'Descripción no disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

