// src/components/layout/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Logo */}
          <div className="footer-logo">
            <img src="/logo.jpeg" alt="Bilca - Encuentra profesionales cerca de ti" />
          </div>

          {/* Derechos reservados */}
          <p className="footer-text">
            &copy; {new Date().getFullYear()} Bilca. Todos los derechos reservados.
          </p>

          {/* Enlaces */}
          <nav className="footer-links">
            <Link to="/about" className="footer-link">
              Sobre nosotros
            </Link>
            <Link to="/terms" className="footer-link">
              Términos
            </Link>
            <Link to="/privacy" className="footer-link">
              Privacidad
            </Link>
            <Link to="/contact" className="footer-link">
              Contacto
            </Link>
          </nav>

          {/* Crédito opcional (opcional) */}
          <p className="footer-credit">
            Desarrollado por <a href="https://www.laring-ai.com">Laring AI</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
