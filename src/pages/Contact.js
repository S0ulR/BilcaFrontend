// src/components/pages/Contact.js
import React, { useState, useContext } from "react";
import ToastContext from "../context/ToastContext";
import Breadcrumb from "../components/ui/Breadcrumb";
import "./Contact.css";

const Contact = () => {
  const { success, error } = useContext(ToastContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      error("Por favor completa todos los campos.");
      return;
    }

    try {
      success(
        "¡Mensaje enviado!",
        "Gracias por contactarnos, te responderemos a la brevedad."
      );
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      error(
        "Error",
        "No se pudo enviar el mensaje. Inténtalo de nuevo más tarde."
      );
    }
  };

  return (
    <div className="contact-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/" },
          { label: "Contacto", active: true },
        ]}
      />
      <div className="contact-content">
        <h1 className="page-title">Contáctanos</h1>
        <p className="intro-text">
          ¿Tienes alguna pregunta o sugerencia? Estamos aquí para ayudarte.
        </p>

        <div className="contact-grid">
          <div className="contact-info">
            <h2 className="section-title">Información de Contacto</h2>
            <ul className="contact-list">
              <li className="contact-item">
                <i className="fab fa-whatsapp"></i>
                <a
                  href="https://wa.me/5491112345678"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +54 9 11 1234-5678
                </a>
              </li>
              <li className="contact-item">
                <i className="fab fa-instagram"></i>
                <a
                  href="https://www.instagram.com/laring.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @laring.ai
                </a>
              </li>
              <li className="contact-item">
                <i className="fab fa-linkedin"></i>
                <a
                  href="https://www.linkedin.com/company/laring-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Laring AI
                </a>
              </li>
            </ul>
          </div>

          <div className="contact-form-container">
            <h2 className="section-title">Envíanos un Mensaje</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="input-group">
                <label htmlFor="name">Nombre</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="message">Mensaje</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Escribe tu mensaje aquí..."
                  rows="5"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-primary">
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
