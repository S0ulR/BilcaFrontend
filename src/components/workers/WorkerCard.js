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
        ></i>
      ))}
    </div>
  );
};

const WorkerCard = ({ worker, onClick }) => {
  const isTopRated = worker.rating >= 4.8;
  const isNew =
    !isTopRated &&
    worker.createdAt &&
    new Date() - new Date(worker.createdAt) < 30 * 24 * 60 * 60 * 1000;

  const activeServices = Array.isArray(worker.services)
    ? worker.services.filter(s => s.isActive !== false)
    : [];

  const displayedServices = activeServices.slice(0, 2);
  const hasMore = activeServices.length > 2;
  const mainService = activeServices[0];

  return (
    <div className="worker-card" onClick={onClick} role="button" tabIndex={0}>
      {/* Badges arriba a la derecha */}
      <div className="worker-badges">
        {isTopRated && <span className="badge top-rated">⭐ Mejor Valorado</span>}
        {isNew && <span className="badge new">🆕 Nuevo</span>}
      </div>

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
        <i className="fas fa-briefcase"></i>{" "}
        {mainService?.profession
          ? mainService.profession.charAt(0).toUpperCase() + mainService.profession.slice(1)
          : "Sin oficio"}
      </p>

      {mainService?.hourlyRate && (
        <p className="worker-rate">
          <i className="fas fa-tag"></i> ${mainService.hourlyRate.toLocaleString()} / hora
        </p>
      )}

      <p className="worker-location">
        <i className="fas fa-map-marker-alt"></i>{" "}
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
              {service.profession.charAt(0).toUpperCase() + service.profession.slice(1)}
            </span>
          ))}
          {hasMore && <span className="service-tag service-tag-more">+{activeServices.length - 2}</span>}
        </div>
      )}

      <div className="worker-actions">
        <button className="btn btn-gradient">
          Ver perfil <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default WorkerCard;
