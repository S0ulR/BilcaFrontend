// src/components/workers/WorkerCard.js
import React from "react";
import "./WorkerCard.css";

const StarRating = ({ rating, size = "1rem" }) => {
  return (
    <div className="star-rating" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={
            star <= rating
              ? "fas fa-star"
              : star - 0.5 <= rating
              ? "fas fa-star-half-alt"
              : "far fa-star"
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const WorkerCard = ({ worker, onClick }) => {
  // ========================
  // FLAGS DE NEGOCIO
  // ========================
  const isRecommended = worker.subscriptionTier === "featured";

  const isVerified =
    worker.subscriptionTier === "professional" ||
    worker.subscriptionTier === "featured";

  const isTopRated = typeof worker.rating === "number" && worker.rating >= 4.8;

  const isNew =
    worker.createdAt &&
    new Date() - new Date(worker.createdAt) < 30 * 24 * 60 * 60 * 1000;

  // ========================
  // BADGES (ACUMULATIVOS + JERARQUÍA)
  // ========================
  const badges = [];

  if (isRecommended) {
    badges.push({
      key: "recommended",
      className: "recommended",
      icon: "fa-star",
      label: "Recomendado",
    });
  }

  if (isVerified) {
    badges.push({
      key: "verified",
      className: "verified",
      icon: "fa-check-circle",
      label: "Verificado",
    });
  }

  if (isTopRated) {
    badges.push({
      key: "top-rated",
      className: "top-rated",
      icon: "fa-award",
      label: "Mejor valorado",
    });
  }

  if (isNew) {
    badges.push({
      key: "new",
      className: "new",
      icon: "fa-clock",
      label: "Usuario nuevo",
    });
  }

  // ========================
  // SERVICIOS
  // ========================
  const activeServices = Array.isArray(worker.services)
    ? worker.services.filter((s) => s.isActive !== false)
    : [];

  const displayedServices = activeServices.slice(0, 2);
  const hasMore = activeServices.length > 2;
  const mainService = activeServices[0];

  return (
    <div className="worker-card" onClick={onClick} role="button" tabIndex={0}>
      {badges.length > 0 && (
        <div className="worker-badges-container">
          {/* BADGES - ESTILOS EN LÍNEA (SIN CSS EXTERNO) */}
          {badges.length > 0 && (
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                zIndex: 10,
                pointerEvents: "none", // evita interferir con el onClick del card
              }}
            >
              {badges.map((b) => {
                let badgeStyle = {
                  fontSize: "0.6rem",
                  padding: "0.25rem 0.5rem",
                  fontWeight: "bold",
                  borderRadius: "50px",
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  background: "gray", // fallback
                };

                // Aplicamos colores específicos
                if (b.className === "top-rated") {
                  badgeStyle.background =
                    "linear-gradient(135deg, #ff9d00, #d48000)";
                } else if (b.className === "new") {
                  badgeStyle.background =
                    "linear-gradient(135deg, #2e8b57, #226a42)";
                } else if (b.className === "verified") {
                  badgeStyle.background =
                    "linear-gradient(135deg, #1e88e5, #0d47a1)";
                } else if (b.className === "recommended") {
                  badgeStyle.background =
                    "linear-gradient(135deg, #ff5722, #e64a19)";
                }

                return (
                  <span key={b.key} style={badgeStyle}>
                    <i className={`fas ${b.icon}`}></i>
                    {b.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="worker-photo-container">
        <img
          src={worker.photo || "/assets/default-avatar.png"}
          alt={`${worker.name || "Trabajador"} - Foto de perfil`}
          className="worker-photo"
          loading="lazy"
        />
      </div>

      <h3 className="worker-name">{worker.name}</h3>

      <p className="worker-profession">
        <i className="fas fa-briefcase" />{" "}
        {mainService?.profession
          ? mainService.profession.charAt(0).toUpperCase() +
            mainService.profession.slice(1)
          : "Sin oficio"}
      </p>

      {mainService?.hourlyRate && (
        <p className="worker-rate">
          <i className="fas fa-tag" /> $
          {mainService.hourlyRate.toLocaleString()} / hora
        </p>
      )}

      <p className="worker-location">
        <i className="fas fa-map-marker-alt" />{" "}
        {worker.location?.address || worker.city || "Ubicación no disponible"}
      </p>

      <div className="worker-rating">
        <StarRating rating={worker.rating || 0} size="1.1rem" />
        <span className="rating-count">({worker.totalJobs || 0} trabajos)</span>
      </div>

      <p className="worker-bio">
        {mainService?.bio
          ? mainService.bio.length > 100
            ? `${mainService.bio.substring(0, 100)}...`
            : mainService.bio
          : worker.bio
          ? worker.bio.length > 100
            ? `${worker.bio.substring(0, 100)}...`
            : worker.bio
          : "Este profesional aún no ha agregado una descripción."}
      </p>

      {displayedServices.length > 0 && (
        <div className="worker-services-tags">
          {displayedServices.map((service, i) => (
            <span key={i} className="service-tag">
              {service.profession.charAt(0).toUpperCase() +
                service.profession.slice(1)}
            </span>
          ))}
          {hasMore && (
            <span className="service-tag service-tag-more">
              +{activeServices.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="worker-actions">
        <button className="btn btn-gradient">
          Ver perfil <i className="fas fa-arrow-right" />
        </button>
      </div>
    </div>
  );
};

export default WorkerCard;
