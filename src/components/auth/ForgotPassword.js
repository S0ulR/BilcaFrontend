// frontend/src/components/auth/ForgotPassword.js
import React, { useState } from "react";
import API from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por favor ingresa un email válido");
      setLoading(false);
      return;
    }

    try {
      await API.post("/auth/forgotpassword", { email });
      setSuccess(
        "Si tu email está registrado, recibirás un enlace para restablecer tu contraseña."
      );
    } catch (err) {
      setError("No se pudo procesar la solicitud. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Bilca</h1>
          <p>Recupera el acceso a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p className="subtitle">
            Ingresa tu email y te enviaremos un enlace para restablecerla.
          </p>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="input-group stacked">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-block"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enviando...
              </>
            ) : (
              "Enviar enlace"
            )}
          </button>

          <p className="back-link">
            <Link to="/login" className="link-accent">
              ← Volver al inicio de sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
