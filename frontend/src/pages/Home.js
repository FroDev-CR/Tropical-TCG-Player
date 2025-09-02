import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
// Temporalmente desactivados mientras migramos Firebase
// import CarouselHero from '../components/CarouselHero';
// import LatestCards from '../components/LatestCards';
// import UpcomingEvents from '../components/UpcomingEvents';
import CardDetailModal from '../components/CardDetailModal';

export default function Home() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
    setShowCardModal(false);
  };
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
            transition={{ duration: 0.8 }}
            className="text-center mb-5"
          >
            <h1 className="display-4 fw-bold text-primary mb-4">
              🏝️ Tropical TCG Players
            </h1>
            <p className="lead mb-4">
              Bienvenido a la comunidad #1 de Trading Card Games en Costa Rica
            </p>
            <div className="hero-cta">
              <p className="text-muted mb-4">
                Descubre, compra, vende e intercambia cartas de Pokémon, One Piece, Dragon Ball, Magic y más
              </p>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Modal de Detalle de Carta */}
      <CardDetailModal 
        show={showCardModal}
        onHide={closeCardModal}
        card={selectedCard}
      />

    </motion.div>
  );
}