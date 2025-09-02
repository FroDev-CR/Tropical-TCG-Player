// src/components/RatingStars.js
// Componente de estrellas para calificaciones

import React, { useState } from 'react';
import './RatingStars.css';

export default function RatingStars({ 
  rating = 0, 
  onRatingChange, 
  size = 'medium', 
  interactive = false,
  showLabel = false 
}) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (interactive) {
      setHoveredRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredRating(0);
    }
  };

  const getStarClass = (starIndex) => {
    const currentRating = hoveredRating || rating;
    const baseClass = `rating-star ${size}`;
    
    if (currentRating >= starIndex) {
      return `${baseClass} filled`;
    } else if (currentRating >= starIndex - 0.5) {
      return `${baseClass} half-filled`;
    } else {
      return `${baseClass} empty`;
    }
  };

  const stars = [1, 2, 3, 4, 5].map((starIndex) => (
    <span
      key={starIndex}
      className={getStarClass(starIndex)}
      onClick={() => handleStarClick(starIndex)}
      onMouseEnter={() => handleStarHover(starIndex)}
      onMouseLeave={handleMouseLeave}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : -1}
      aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
    >
      ⭐
    </span>
  ));

  const getRatingText = () => {
    if (rating === 0) return 'Sin calificar';
    if (rating <= 1) return 'Muy malo';
    if (rating <= 2) return 'Malo';
    if (rating <= 3) return 'Regular';
    if (rating <= 4) return 'Bueno';
    return 'Excelente';
  };

  return (
    <div className={`rating-stars-container ${interactive ? 'interactive' : 'readonly'}`}>
      <div className="stars-wrapper">
        {stars}
      </div>
      {showLabel && (
        <div className="rating-label">
          <span className="rating-value">{rating.toFixed(1)}</span>
          <span className="rating-text">({getRatingText()})</span>
        </div>
      )}
    </div>
  );
}