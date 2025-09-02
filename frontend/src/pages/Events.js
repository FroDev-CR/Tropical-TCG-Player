import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import EventCalendar from '../components/EventCalendar';

export default function Events() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <section className="section">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold text-primary mb-3">
                Eventos TCG
              </h1>
              <p className="lead text-muted">
                Descubre torneos, lanzamientos y eventos especiales de Trading Card Games
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <EventCalendar />
          </motion.div>

          <motion.div
            className="mt-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm bg-light">
                  <div className="card-body p-4">
                    <h3 className="h5 fw-bold text-primary mb-3">
                      <i className="fas fa-calendar-plus me-2"></i>
                      ¿Organizas eventos TCG?
                    </h3>
                    <p className="text-muted mb-3">
                      Si eres organizador de torneos o eventos de TCG, contáctanos para 
                      incluir tu evento en nuestro calendario oficial.
                    </p>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      <a 
                        href="mailto:eventos@tropicaltcg.com" 
                        className="btn btn-primary btn-sm"
                      >
                        <i className="fas fa-envelope me-1"></i>
                        Contactar por Email
                      </a>
                      <a 
                        href="https://wa.me/50612345678" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-success btn-sm"
                      >
                        <i className="fab fa-whatsapp me-1"></i>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </motion.div>
  );
}