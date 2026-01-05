// frontend/components/dashboard/CompleteProfileBanner.js
import React from "react";
import { Link } from "react-router-dom";
import { ToastContext } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthProvider";
import { useContext } from "react";
import "./CompleteProfileBanner.css";

const CompleteProfileBanner = () => {
  const { user } = useAuth();
  const { success } = useContext(ToastContext);

  if (!user || user.profileCompleted) return null;

  const isTempCity = ["Ciudad temporal", "No especificada"].includes(
    user.city?.trim()
  );
  const isTempCountry = ["País temporal", "No especificado"].includes(
    user.country?.trim()
  );
  const isTempPhone = user.phone === "123456789";
  const isTempBirthday =
    user.birthday && new Date(user.birthday).getFullYear() === 1990;

  const missingFields = [];
  if (!user.city || isTempCity) missingFields.push("ciudad");
  if (!user.country || isTempCountry) missingFields.push("país");
  if (!user.phone || isTempPhone) missingFields.push("teléfono");
  if (!user.birthday || isTempBirthday)
    missingFields.push("fecha de nacimiento");

  if (missingFields.length === 0) return null;

  return (
    <div className="complete-profile-banner">
      <i className="fas fa-exclamation-triangle"></i>
      <span>Completa tu perfil: {missingFields.join(", ")}</span>
      <Link to="/profile" className="btn-edit">
        Completar ahora
      </Link>
    </div>
  );
};

export default CompleteProfileBanner;
