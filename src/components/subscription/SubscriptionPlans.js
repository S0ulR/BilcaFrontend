// src/components/subscription/SubscriptionPlans.js
import React, { useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthProvider";
import { Navigate } from "react-router-dom";
import "./SubscriptionPlans.css";

const PLANS = [
  {
    id: "professional",
    name: "Profesional",
    price: 5000,
    currency: "ARS",
    features: [
      "✅ Verificación de perfil",
      "🔝 Destacado en búsquedas",
      "📊 Estadísticas de perfil",
      "📩 Prioridad en solicitudes",
    ],
    cta: "Activar plan",
  },
  {
    id: "featured",
    name: "Destacado",
    price: 10000,
    currency: "ARS",
    features: [
      "✅ Verificación de perfil",
      "🔝 Destacado en búsquedas",
      "📊 Estadísticas de perfil",
      "📩 Prioridad en solicitudes",
      "🌟 Aparece en 'Recomendados'",
      "📄 Contratos digitales gratis",
      "⚡ Soporte prioritario",
    ],
    cta: "Quiero ser Destacado",
  },
];

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== "worker") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubscribe = async (planId) => {
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/subscriptions/subscribe", {
        plan: planId,
      });

      window.location.href = res.data.init_point;
    } catch (err) {
      if (err.response?.status === 409) {
        const initPoint = err.response.data?.init_point;

        if (initPoint) {
          window.location.href = initPoint;
          return;
        }

        setError("Ya tienes una suscripción activa.");
      } else {
        setError("Error al iniciar la suscripción. Intenta más tarde.");
      }

      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="subscription-plans">
      <h2>Elige tu plan</h2>
      <p className="subtitle">¡Destaca entre los mejores profesionales!</p>

      {error && <div className="error">{error}</div>}

      <div className="plans-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price">{plan.price}</span>
                <span className="currency">{plan.currency}</span>
                <span className="period">/mes</span>
              </div>
            </div>
            <ul className="plan-features">
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button
              className="btn-plan"
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading}
            >
              {loading ? "Procesando..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="note">
        <i className="fas fa-lock"></i> Pago seguro con Mercado Pago. Prueba
        gratis 7 días.
      </p>
    </div>
  );
};

export default SubscriptionPlans;
