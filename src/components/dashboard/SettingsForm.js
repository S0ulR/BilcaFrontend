// frontend/components/dashboard/SettingsPage.js
import React, { useState } from "react";
import "./SettingsForm.css";

const SettingsForm = ({ user }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState("public");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    // Aquí iría: await API.post(`/users/${user._id}/change-password`, passwordData);
    setSuccess("Contraseña actualizada correctamente");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  };

  return (
    <div className="settings-page">
      <h1>Configuración de Cuenta</h1>

      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      <div className="settings-section">
        <h2>Seguridad</h2>
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Contraseña actual</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={passwordData.confirmNewPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Cambiar contraseña
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <h2>Notificaciones</h2>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
          <span className="toggle-text">Recibir notificaciones por email</span>
        </label>
      </div>

      <div className="settings-section">
        <h2>Privacidad</h2>
        <label className="radio-label">
          <input
            type="radio"
            name="privacy"
            value="public"
            checked={privacy === "public"}
            onChange={() => setPrivacy("public")}
          />
          <span>Perfil público</span>
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="privacy"
            value="private"
            checked={privacy === "private"}
            onChange={() => setPrivacy("private")}
          />
          <span>Perfil privado</span>
        </label>
      </div>
    </div>
  );
};

export default SettingsForm;
