// src/components/dashboard/SettingsPage.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import { useContext } from "react";
import "./SettingsPage.css";

const SettingsPage = () => {
  const { user, login } = useAuth();
  const { success: showSuccess, error: showError } = useContext(ToastContext);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [emailNotifications, setEmailNotifications] = useState(
    user.emailNotifications ?? true
  );
  const [isPrivate, setIsPrivate] = useState(user.isPrivate ?? false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      await API.post("/users/change-password", passwordData);
      setSuccess("Contraseña actualizada correctamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      showSuccess("Contraseña actualizada");
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "Error al cambiar la contraseña";
      setError(errorMsg);
      showError("No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (e) => {
    const checked = e.target.checked;
    setEmailNotifications(checked);
    setError("");
    setSuccess("");

    try {
      const res = await API.put("/users/settings", {
        emailNotifications: checked,
      });
      setSuccess(res.data.msg);
      login(
        { ...user, emailNotifications: checked },
        sessionStorage.getItem("token"),
        sessionStorage.getItem("sessionId")
      );
      showSuccess("Preferencia guardada");
    } catch (err) {
      console.error("Error al guardar notificaciones:", err);
      const errorMsg = "No se pudo guardar la preferencia";
      setError(errorMsg);
      setEmailNotifications(!checked);
      showError(errorMsg);
    }
  };

  const handlePrivacyChange = async (e) => {
    const value = e.target.value === "private";
    setIsPrivate(value);
    setError("");
    setSuccess("");

    try {
      const res = await API.put("/users/settings", { isPrivate: value });
      setSuccess(res.data.msg);
      login(
        { ...user, isPrivate: value },
        sessionStorage.getItem("token"),
        sessionStorage.getItem("sessionId")
      );
      showSuccess("Privacidad actualizada");
    } catch (err) {
      console.error("Error al guardar privacidad:", err);
      const errorMsg = "No se pudo guardar la privacidad";
      setError(errorMsg);
      setIsPrivate(!value);
      showError(errorMsg);
    }
  };

  return (
    <div className="settings-page">
      <div className="welcome-card">
        <h1>Configuración de Cuenta</h1>
        <p>Gestiona tu seguridad, notificaciones y privacidad</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="settings-section">
        <h2>
          <i className="fas fa-lock"></i> Seguridad
        </h2>
        <form onSubmit={handleChangePassword} className="settings-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Contraseña actual *</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña actual"
                required
              />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Nueva contraseña *</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                minLength="6"
              />
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña *</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={passwordData.confirmNewPassword}
                onChange={handleChange}
                placeholder="Repite la nueva contraseña"
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Actualizando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <h2>
          <i className="fas fa-bell"></i> Notificaciones
        </h2>
        <div className="toggle-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={handleNotificationChange}
            />
            <span className="toggle-text">
              Recibir notificaciones por correo
            </span>
          </label>
          <small className="toggle-hint">
            Te avisaremos sobre nuevas solicitudes, mensajes y más.
          </small>
        </div>
      </div>

      <div className="settings-section">
        <h2>
          <i className="fas fa-shield-alt"></i> Privacidad
        </h2>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="privacy"
              value="public"
              checked={!isPrivate}
              onChange={handlePrivacyChange}
            />
            <span>
              <strong>Perfil público</strong>
              <small>Todos pueden encontrarte y ver tus servicios.</small>
            </span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="privacy"
              value="private"
              checked={isPrivate}
              onChange={handlePrivacyChange}
            />
            <span>
              <strong>Perfil privado</strong>
              <small>Solo usuarios que ya te contactaron podrán verte.</small>
            </span>
          </label>
        </div>
      </div>

      <div className="profile-status">
        <i
          className={`fas ${
            user.isPrivate ? "fa-user-secret" : "fa-globe-americas"
          }`}
        ></i>
        <span>
          Tu perfil está{" "}
          <strong>{user.isPrivate ? "privado" : "público"}</strong>.
          {user.role === "worker" && (
            <>
              {" "}
              Ofreces servicios como{" "}
              {user.services?.map((s) => s.profession).join(", ") ||
                "trabajador"}
              .
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;
