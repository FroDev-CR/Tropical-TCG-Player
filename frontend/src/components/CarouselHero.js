import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import './CarouselHero.css';

const CarouselHero = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar imágenes desde Firebase
  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        const q = query(
          collection(/* db */ null, 'carousel'), 
          orderBy('order', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const carouselData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (carouselData.length > 0) {
          setImages(carouselData);
        } else {
          // Imágenes por defecto si no hay nada en Firebase
          setImages([
            {
              id: 'default-1',
              imageUrl: 'https://images.pokemontcg.io/swsh12/1_hires.png',
              title: 'Pokémon TCG',
              subtitle: 'Las mejores cartas de Pokémon',
              active: true
            },
            {
              id: 'default-2',
              imageUrl: 'https://limitlesstcg.nyc3.digitaloceanspaces.com/tpci/OP01/OP01_001_EN.png',
              title: 'One Piece TCG',
              subtitle: 'Aventuras épicas en el mar',
              active: true
            },
            {
              id: 'default-3',
              imageUrl: 'https://www.dbs-cardgame.com/images/cardlist/series1/BT1-001.png',
              title: 'Dragon Ball Super',
              subtitle: 'El poder de los Saiyajins',
              active: true
            }
          ]);
        }
      } catch (error) {
        console.error('Error cargando carrusel:', error);
        // Fallback a imágenes por defecto
        setImages([
          {
            id: 'fallback-1',
            imageUrl: 'https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=TropicalTCG',
            title: 'Bienvenido a TropicalTCG',
            subtitle: 'Tu marketplace de cartas favorito',
            active: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselImages();
  }, []);

  // Auto-advance del carrusel
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, [images.length]);

  // Funciones de navegación
  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="carousel-hero-container">
        <div className="carousel-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="carousel-hero-container">
        <div className="carousel-empty">
          <h3>No hay imágenes configuradas</h3>
          <p>Configura el carrusel desde el panel de administración</p>
        </div>
      </div>
    );
  }

  const activeImages = images.filter(img => img.active);
  
  if (activeImages.length === 0) {
    return null;
  }

  return (
    <div className="carousel-hero-container">
      <div className="carousel-hero">
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            className="carousel-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.4,
              ease: "easeInOut"
            }}
          >
            <div className="carousel-image-container">
              <img
                src={
                  isMobile && activeImages[currentIndex]?.mobileImageUrl 
                    ? activeImages[currentIndex].mobileImageUrl 
                    : activeImages[currentIndex]?.imageUrl
                }
                alt={activeImages[currentIndex]?.title || 'Carousel slide'}
                className="carousel-image"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x400/007BFF/FFFFFF?text=TropicalTCG';
                }}
              />
              <div className="carousel-overlay">
                <motion.div
                  className="carousel-content"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  {activeImages[currentIndex]?.title && (
                    <h2 className="carousel-title">
                      {activeImages[currentIndex].title}
                    </h2>
                  )}
                  {activeImages[currentIndex]?.subtitle && (
                    <p className="carousel-subtitle">
                      {activeImages[currentIndex].subtitle}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {activeImages.length > 1 && (
          <>
            <button 
              className="carousel-nav carousel-nav-prev"
              onClick={goToPrevious}
              aria-label="Imagen anterior"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="carousel-nav carousel-nav-next"
              onClick={goToNext}
              aria-label="Siguiente imagen"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </>
        )}

        {/* Dots indicator */}
        {activeImages.length > 1 && (
          <div className="carousel-dots">
            {activeImages.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarouselHero;