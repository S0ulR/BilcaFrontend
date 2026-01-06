// src/components/subscription/SubscriptionSuccess.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import API from "../../services/api";
import "./SubscriptionSuccess.css";

const SubscriptionSuccess = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        // ✅ Corregido: ruta correcta para perfil
        const res = await API.get(`/users/${user?._id}`);
        const updatedUser = res.data;

        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        login(updatedUser, token, sessionStorage.getItem("sessionId"));

        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } catch (err) {
        console.error("Error al actualizar usuario:", err);
        navigate("/dashboard");
      }
    };

    refreshUser();
  }, [login, navigate, user?._id]);

  return (
    <div className="subscription-success">
      <div className="checkmark-circle">
        <i className="fas fa-check"></i>
      </div>
      <h2>¡Suscripción activada!</h2>
      <p>
        Gracias por confiar en Bilca. Tu perfil está ahora verificado y
        destacado.
      </p>
      <p>Redirigiendo a tu dashboard...</p>
    </div>
  );
};

export default SubscriptionSuccess;
