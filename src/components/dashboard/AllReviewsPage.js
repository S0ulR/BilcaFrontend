// src/components/dashboard/AllReviewsPage.js
import React, { useState, useEffect, useContext } from "react";
import API from "../../services/api";
import StarRating from "../ui/StarRating";
import { ToastContext } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthProvider";
import Breadcrumb from "../ui/Breadcrumb";
import "./AllReviewsPage.css";

const AllReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
  });

  const { success, error } = useContext(ToastContext);
  const { user } = useAuth();
  const userId = user?._id;

  const ITEMS_PER_PAGE = 5;

  const fetchReviews = async (page = 1) => {
    if (!userId) {
      error("Error", "No estás autenticado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await API.get(`/reviews/workers/${userId}/reviews`, {
        params: { page, limit: ITEMS_PER_PAGE },
      });

      const data = res.data;
      setReviews(data.reviews || []);
      setPagination({
        currentPage: data.pagination?.currentPage || 1,
        totalPages: data.pagination?.totalPages || 1,
        totalReviews: data.pagination?.totalReviews || 0,
      });
    } catch (err) {
      console.error(
        "Error al cargar reseñas:",
        err.response?.data || err.message
      );
      error("No se pudieron cargar las reseñas");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e, reviewId) => {
    e.preventDefault();
    const replyText = e.target.reply.value.trim();
    if (!replyText) return;

    try {
      await API.post(`/reviews/${reviewId}/reply`, { replyText });
      success("Respuesta enviada", "Gracias por responder.");
      fetchReviews();
    } catch (err) {
      console.error("Error al responder reseña:", err);
      error("No se pudo enviar la respuesta");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchReviews(page);
    }
  };

  if (loading) {
    return (
      <div className="all-reviews-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Reseñas", active: true },
          ]}
        />
        <div className="welcome-card">
          <h1>Cargando tus reseñas...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="all-reviews-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Reseñas", active: true },
        ]}
      />

      <div className="welcome-card">
        <h1>Todas tus reseñas</h1>
        <p>
          Has recibido <strong>{pagination.totalReviews}</strong> reseñas con
          una valoración promedio de{" "}
          <strong>
            ⭐{" "}
            {reviews.length > 0
              ? (
                  reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                ).toFixed(1)
              : "0.0"}
          </strong>
          .
        </p>
      </div>

      {reviews.length > 0 && (
        <div className="rating-distribution">
          <h3>Distribución de valoraciones</h3>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r) => r.rating === stars).length;
            const percentage = (count / pagination.totalReviews) * 100;
            return (
              <div key={stars} className="rating-bar">
                <StarRating rating={stars} />
                <div className="bar-container">
                  <div
                    className="bar-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-star"></i>
            <p>Aún no tienes reseñas.</p>
            <p>
              Una vez que completes trabajos, los clientes recibirán un email
              para dejarte una reseña.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <img
                  src={review.user?.photo || "/assets/default-avatar.png"}
                  alt={review.user?.name}
                  className="user-photo"
                  onError={(e) => (e.target.src = "/assets/default-avatar.png")}
                />
                <div>
                  <strong>{review.user?.name}</strong>
                  <StarRating rating={review.rating} />
                </div>
              </div>
              <p className="review-comment">"{review.comment}"</p>
              <small>
                {new Date(review.createdAt).toLocaleDateString("es-ES", {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </small>

              {user?.role === "worker" && !review.reply && (
                <form
                  onSubmit={(e) => handleReply(e, review._id)}
                  className="reply-form"
                >
                  <input
                    type="text"
                    name="reply"
                    placeholder="Escribe una respuesta..."
                    required
                  />
                  <button type="submit">Responder</button>
                </form>
              )}

              {review.reply && (
                <div className="reply-box">
                  <strong>Respuesta:</strong>
                  <p>{review.reply.text}</p>
                  <small>
                    {new Date(review.reply.createdAt).toLocaleDateString(
                      "es-ES",
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }
                    )}
                  </small>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => goToPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            ← Anterior
          </button>
          <span>
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            onClick={() => goToPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default AllReviewsPage;
