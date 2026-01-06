// frontend/src/components/auth/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./ResetPassword.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await API.get(`/auth/reset-password/${token}`);
        if (res.data.valid) {
          setTokenValid(true);
        } else {
          setError("El enlace es inválido o ha expirado.");
        }
      } catch (err) {
        setError("El enlace es inválido o ha expirado.");
      }
    };

    validateToken();
  }, [token]);

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommon: !["12345678", "password", "admin", "contraseña"].includes(
      password.toLowerCase()
    ),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!isPasswordValid) {
      setError("La contraseña no cumple con los requisitos.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      setSuccess(
        "Contraseña actualizada correctamente. Serás redirigido al login..."
      );
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "No se pudo restablecer la contraseña. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid && error) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h1>Bilca</h1>
            <p>Recupera el acceso a tu cuenta</p>
          </div>
          <div className="reset-password-error">
            <div className="error">{error}</div>
            <a href="/forgotpassword" className="btn-primary btn-block">
              Solicitar un nuevo enlace
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h1>Bilca</h1>
          <p>Recupera el acceso a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <h2>Restablece tu contraseña</h2>
          <p className="subtitle">Ingresa tu nueva contraseña.</p>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="input-group stacked">
            <label htmlFor="password">Nueva contraseña</label>
            <div className="input-wrapper">
              <i className="fas fa-lock"></i>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i
                className={`fas ${
                  showPassword ? "fa-eye" : "fa-eye-slash"
                } toggle-visibility`}
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              ></i>
            </div>
          </div>

          <div className="input-group stacked">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <div className="input-wrapper">
              <i className="fas fa-check-circle"></i>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <i
                className={`fas ${
                  showConfirmPassword ? "fa-eye" : "fa-eye-slash"
                } toggle-visibility`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                role="button"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación"
                    : "Mostrar confirmación"
                }
              ></i>
            </div>
          </div>

          <div className="password-requirements">
            <p
              style={{ color: passwordRequirements.length ? "green" : "#999" }}
            >
              • Mínimo 8 caracteres
            </p>
            <p
              style={{
                color: passwordRequirements.uppercase ? "green" : "#999",
              }}
            >
              • Al menos una mayúscula
            </p>
            <p
              style={{ color: passwordRequirements.number ? "green" : "#999" }}
            >
              • Al menos un número
            </p>
            <p
              style={{ color: passwordRequirements.special ? "green" : "#999" }}
            >
              • Carácter especial (!@#$%...)
            </p>
            <p
              style={{
                color: passwordRequirements.notCommon ? "green" : "#999",
              }}
            >
              • No usar contraseñas comunes
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-block"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Actualizando...
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </button>

          <p className="back-link">
            <a href="/login" className="link-accent">
              ← Volver al inicio de sesión
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
