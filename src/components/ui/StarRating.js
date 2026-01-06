// src/components/ui/StarRating.js

import React from "react";
import "./StarRating.css";

const StarRating = ({ rating, size = "1rem", maxStars = 5 }) => {
  // Aseguramos que el rating esté entre 0 y 5
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    let starClass = "far fa-star"; // vacía

    if (i <= normalizedRating) {
      starClass = "fas fa-star"; // llena
    } else if (i - 0.5 <= normalizedRating) {
      starClass = "fas fa-star-half-alt"; // media
    }

    stars.push(
      <i
        key={i}
        className={starClass}
        style={{ color: "#FFA726", fontSize: size }}
      ></i>
    );
  }

  return <div className="star-rating">{stars}</div>;
};

export default StarRating;
