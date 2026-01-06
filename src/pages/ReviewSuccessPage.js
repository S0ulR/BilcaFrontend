// src/pages/ReviewSuccessPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb";
import "./ReviewSuccessPage.css";

const ReviewSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="review-success-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/" },
          { label: "Reseña", path: "/review" },
          { label: "¡Gracias!", active: true },
        ]}
      />
      
      <div className="welcome-card success-card">
        <div className="success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h1>¡Gracias por tu reseña!</h1>
        <p>
          Tu opinión es muy valiosa y ayudará a otros usuarios a tomar mejores
          decisiones.
        </p>
        <button 
          onClick={() => navigate("/")}
          className="btn-primary"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default ReviewSuccessPage;
