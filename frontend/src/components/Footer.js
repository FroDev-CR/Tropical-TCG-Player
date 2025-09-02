import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/images/logo.png';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="custom-footer text-center py-4 mt-auto">
      <div className="container">
        <Link to="/" className="footer-logo-link">
          <img 
            src={logoImage} 
            alt="Tropical Players TCG Logo" 
            className="footer-logo"
          />
        </Link>
        <div className="footer-text mt-2">
          <small className="text-white-50">
            © 2024 Tropical TCG Players - Tu marketplace de cartas favorito
          </small>
        </div>
      </div>
    </footer>
  );
}