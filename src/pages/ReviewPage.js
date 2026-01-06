// src/pages/ReviewPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import StarRating from "../components/ui/StarRating";
import Breadcrumb from "../components/ui/Breadcrumb";
import "./ReviewPage.css";

const ReviewPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hireData, setHireData] = useState(null);
  const [review, setReview] = useState({
    rating: 0,
    comment: ""
  });

  // Validar el token de reseña
  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await API.get(`/reviews/validate/${token}`);
        if (res.data.valid) {
          setHireData(res.data.hire);
        } else {
          setError(res.data.msg || "El enlace de reseña no es válido");
        }
      } catch (err) {
        console.error("Error al validar token:", err);
        setError("El enlace de reseña no es válido o ha expirado");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleRatingChange = (rating) => {
    setReview(prev => ({ ...prev, rating }));
  };

  const handleCommentChange = (e) => {
    setReview(prev => ({ ...prev, comment: e.target.value }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (review.rating === 0) {
      setError("Por favor, selecciona una calificación");
      return;
    }

    try {
      await API.post("/reviews/submit", {
        token,
        rating: review.rating,
        comment: review.comment
      });
      
      navigate("/review/success");
    } catch (err) {
      console.error("Error al enviar reseña:", err);
      setError(err.response?.data?.msg || "No se pudo enviar la reseña");
    }
  };

  if (loading) {
    return (
      <div className="review-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/" },
            { label: "Reseña", active: true },
          ]}
        />
        <div className="welcome-card">
          <h1>Validando enlace de reseña...</h1>
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/" },
            { label: "Reseña", active: true },
          ]}
        />
        <div className="welcome-card error-card">
          <h1>Enlace de reseña inválido</h1>
          <p>{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="btn-primary"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!hireData) {
    return (
      <div className="review-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/" },
            { label: "Reseña", active: true },
          ]}
        />
        <div className="welcome-card">
          <h1>Error al cargar los datos</h1>
          <p>No se pudieron cargar los datos del trabajo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/" },
          { label: "Reseña", active: true },
        ]}
      />
      
      <div className="welcome-card">
        <h1>Deja una reseña</h1>
        <p>
          Ayuda a otros usuarios compartiendo tu experiencia con{" "}
          <strong>{hireData.worker.name}</strong>.
        </p>
      </div>

      <div className="review-form-container">
        <div className="worker-info">
          <img
            src={hireData.worker.photo || "/assets/default-avatar.png"}
            alt={hireData.worker.name}
            className="worker-photo"
          />
          <div className="worker-details">
            <h2>{hireData.worker.name}</h2>
            <p>{hireData.service}</p>
          </div>
        </div>

        <form onSubmit={handleSubmitReview} className="review-form">
          <div className="form-group">
            <label>Calificación *</label>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${review.rating >= star ? 'selected' : ''}`}
                  onClick={() => handleRatingChange(star)}
                  aria-label={`Calificar con ${star} estrellas`}
                >
                  <i className={review.rating >= star ? "fas fa-star" : "far fa-star"}></i>
                </button>
              ))}
            </div>
            {review.rating > 0 && (
              <p className="rating-text">
                {review.rating === 5 ? "Excelente" :
                 review.rating === 4 ? "Muy bueno" :
                 review.rating === 3 ? "Bueno" :
                 review.rating === 2 ? "Regular" : "Malo"}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Comentario (opcional)</label>
            <textarea
              value={review.comment}
              onChange={handleCommentChange}
              placeholder="Comparte tu experiencia con este profesional..."
              rows="4"
              maxLength="500"
            />
            <small>{review.comment.length}/500 caracteres</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={review.rating === 0}
            >
              Enviar reseña
            </button>
          </div>
        </form>
      </div>

      <div className="review-guidelines">
        <h3>Guía para reseñas</h3>
        <ul>
          <li>📍 Sé específico sobre los servicios recibidos</li>
          <li>💬 Sé respetuoso y constructivo</li>
          <li>✅ Esta reseña será visible públicamente en el perfil del trabajador</li>
          <li>🔒 Tu información personal no será compartida</li>
        </ul>
      </div>
    </div>
  );
};

export default ReviewPage;
