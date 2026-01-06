// src/components/dashboard/ProfileForm.js
import React, { useState, useEffect, useContext } from "react";
import { useAuth } from "../../context/AuthProvider";
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import "./ProfileForm.css";

const ProfileForm = ({ onUpdateUser }) => {
  const { user: currentUser, login } = useAuth();
  const { success: showSuccess, error: showError } = useContext(ToastContext);

  const [originalData, setOriginalData] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    country: "",
    phone: "",
    birthday: "",
    bio: "",
    hourlyRate: "",
    address: "",
    photo: "",
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true); // ✅ Estado de carga

  const [services, setServices] = useState([]);
  const [availableProfessions] = useState([
    "plomero",
    "electricista",
    "niñero",
    "albañil",
    "jardinero",
    "carpintero",
    "pintor",
    "limpieza",
    "paseador de perros",
    "cuidadores de adultos",
    "mudanzas",
    "gasista",
  ]);

  // ✅ Cargar perfil completo al montar el componente
  useEffect(() => {
    const loadFullProfile = async () => {
      if (!currentUser?._id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await API.get(`/users/${currentUser._id}`);
        const fullUser = res.data;

        if (onUpdateUser) onUpdateUser(fullUser);

        const formatBirthday = (date) => {
          if (!date) return "";
          const d = new Date(date);
          return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
        };

        const data = {
          name: fullUser.name || "",
          city: fullUser.city || "",
          country: fullUser.country || "",
          phone: fullUser.phone || "",
          birthday: formatBirthday(fullUser.birthday),
          bio: fullUser.bio || "",
          hourlyRate: fullUser.hourlyRate || "",
          address: fullUser.location?.address || "",
          photo: "",
        };

        setOriginalData(data);
        setFormData(data);
        setPreview(fullUser.photo || "/assets/default-avatar.png");
        initializeServicesFromUser(fullUser);
      } catch (err) {
        console.error("Error al cargar perfil completo:", err);
        showError("No se pudo cargar tu perfil completo");
      } finally {
        setLoading(false);
      }
    };

    loadFullProfile();
  }, [currentUser?._id]);

  const loadFullUser = async () => {
    try {
      const res = await API.get(`/users/${currentUser._id}`);
      const freshUser = res.data;

      if (onUpdateUser) onUpdateUser(freshUser);
      login();

      initializeServicesFromUser(freshUser);
    } catch (err) {
      console.error("Error al cargar usuario desde API:", err);
      showError("No se pudieron cargar tus servicios. Revisa tu conexión.");
      initializeServicesFromUser(currentUser);
    }
  };

  const initializeServicesFromUser = (user) => {
    const servicesArray = Array.isArray(user.services)
      ? user.services.map((s) => ({
          profession: s.profession || "",
          hourlyRate: s.hourlyRate !== undefined ? Number(s.hourlyRate) : "",
          bio: s.bio || "",
        }))
      : [];

    setServices(servicesArray);
    setIsDirty(false);
  };

  useEffect(() => {
    if (!currentUser) return;

    const hasProfileChanges =
      formData.name !== (currentUser.name || "") ||
      formData.city !== (currentUser.city || "") ||
      formData.country !== (currentUser.country || "") ||
      formData.phone !== (currentUser.phone || "") ||
      formData.birthday !==
        (currentUser.birthday
          ? new Date(currentUser.birthday).toISOString().split("T")[0]
          : "") ||
      formData.bio !== (currentUser.bio || "") ||
      formData.hourlyRate !== (currentUser.hourlyRate || "") ||
      formData.address !== (currentUser.location?.address || "") ||
      formData.photo instanceof File;

    const currentServices = Array.isArray(currentUser.services)
      ? currentUser.services
          .map((s) => ({
            profession: s.profession,
            hourlyRate: s.hourlyRate,
            bio: s.bio,
          }))
          .sort((a, b) => a.profession.localeCompare(b.profession))
      : [];

    const localServices = [...services].sort((a, b) =>
      a.profession.localeCompare(b.profession)
    );

    const hasServiceChanges =
      JSON.stringify(currentServices) !== JSON.stringify(localServices);

    setIsDirty(hasProfileChanges || hasServiceChanges);
  }, [formData, services, currentUser]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      const file = e.target.files[0];
      if (file) {
        setFormData({ ...formData, photo: file });
        setPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCancel = () => {
    setFormData({
      ...originalData,
      photo: "",
    });
    const userPhoto = currentUser?.photo || "/assets/default-avatar.png";
    setPreview(userPhoto);

    const currentServices = Array.isArray(currentUser.services)
      ? currentUser.services.map((s) => ({
          profession: s.profession || "",
          hourlyRate: s.hourlyRate !== undefined ? Number(s.hourlyRate) : "",
          bio: s.bio || "",
        }))
      : [];

    setServices(currentServices);
    setIsDirty(false);
    setError("");
    setSuccess("");
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { profession: "", hourlyRate: "", bio: "" }]);
  };

  const removeService = async (index) => {
    const serviceToRemove = services[index];
    if (!serviceToRemove || !serviceToRemove.profession) return;

    const confirm = window.confirm(
      `¿Estás seguro de que quieres eliminar tu servicio de "${serviceToRemove.profession}"?`
    );
    if (!confirm) return;

    try {
      const res = await API.delete(
        `/users/services/${serviceToRemove.profession}`
      );

      const updatedUser = res.data.user;
      const newUser = { ...currentUser, ...updatedUser };

      const normalizedServices = Array.isArray(updatedUser.services)
        ? updatedUser.services.map((s) => ({
            profession: s.profession || "",
            hourlyRate: s.hourlyRate !== undefined ? Number(s.hourlyRate) : "",
            bio: s.bio || "",
          }))
        : [];

      setServices(normalizedServices);
      if (onUpdateUser) onUpdateUser(newUser);
      login(
        newUser,
        sessionStorage.getItem("token"),
        sessionStorage.getItem("sessionId")
      );

      const msg =
        normalizedServices.length > 0
          ? res.data.msg
          : "Ya no ofreces servicios. Tu perfil ha sido actualizado.";
      showSuccess(msg);
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "Error al eliminar el servicio";
      showError(errorMsg);
    }
  };

  const convertToWorker = () => {
    addService();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) return;
    if (!currentUser._id) {
      console.error("Usuario sin _id:", currentUser);
      return setError("Usuario inválido: falta el ID.");
    }

    try {
      let data, endpoint, msg;

      if (activeTab === "profile") {
        data = new FormData();
        data.append("name", formData.name);
        data.append("city", formData.city);
        data.append("country", formData.country);
        data.append("phone", formData.phone);
        data.append("birthday", formData.birthday);
        data.append("bio", formData.bio || "");
        if (formData.hourlyRate) data.append("hourlyRate", formData.hourlyRate);
        if (formData.address) data.append("address", formData.address);
        if (formData.photo instanceof File) {
          data.append("photo", formData.photo);
        }

        endpoint = `/users/${currentUser._id}`;
        msg = "Perfil actualizado correctamente";
      }

      if (activeTab === "services") {
        if (services.length === 0) {
          return setError(
            "Debes agregar al menos un servicio para convertirte en trabajador."
          );
        }

        for (let s of services) {
          if (
            !s.profession ||
            s.hourlyRate === "" ||
            s.hourlyRate === null ||
            s.hourlyRate === undefined
          ) {
            return setError("Completa todos los campos de cada servicio");
          }
        }

        const professions = services.map((s) => s.profession);
        const duplicates = professions.filter(
          (p, i) => professions.indexOf(p) !== i
        );
        if (duplicates.length > 0) {
          return setError(
            `Ya estás ofreciendo este servicio: ${duplicates.join(
              ", "
            )}. No puedes repetirlo.`
          );
        }

        data = { services };
        endpoint = `/users/services`;
        msg =
          services.length > 0
            ? "¡Tus servicios han sido actualizados con éxito!"
            : "Servicios actualizados";
      }

      const res = await API.put(endpoint, data, {
        headers:
          activeTab === "profile"
            ? { "Content-Type": "multipart/form-data" }
            : { "Content-Type": "application/json" },
      });

      const updatedUser = { ...currentUser, ...res.data.user };
      if (onUpdateUser) onUpdateUser(updatedUser);

      setOriginalData({
        name: updatedUser.name || "",
        city: updatedUser.city || "",
        country: updatedUser.country || "",
        phone: updatedUser.phone || "",
        birthday: updatedUser.birthday
          ? new Date(updatedUser.birthday).toISOString().split("T")[0]
          : "",
        bio: updatedUser.bio || "",
        hourlyRate: updatedUser.hourlyRate || "",
        address: updatedUser.location?.address || "",
      });

      setFormData((prev) => ({
        ...prev,
        name: updatedUser.name,
        city: updatedUser.city,
        country: updatedUser.country,
        phone: updatedUser.phone,
        birthday: updatedUser.birthday
          ? new Date(updatedUser.birthday).toISOString().split("T")[0]
          : "",
        bio: updatedUser.bio,
        hourlyRate: updatedUser.hourlyRate,
        address: updatedUser.location?.address,
        photo: "",
      }));

      setPreview(updatedUser.photo || "/assets/default-avatar.png");

      const normalizedServices = Array.isArray(res.data.user.services)
        ? res.data.user.services.map((s) => ({
            profession: s.profession || "",
            hourlyRate: s.hourlyRate !== undefined ? Number(s.hourlyRate) : "",
            bio: s.bio || "",
          }))
        : [];

      setServices(normalizedServices);
      setIsDirty(false);

      setSuccess(msg);
    } catch (err) {
      console.error("Error al guardar cambios:", err);
      const errorMsg =
        err.response?.data?.msg ||
        "Error al actualizar el perfil. Verifica los campos.";
      setError(errorMsg);
    }
  };

  // ✅ Manejar estado de carga y errores
  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="error">Debes iniciar sesión para editar tu perfil.</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="welcome-card">
        <h1>Editar Perfil</h1>
        <p>Gestiona tu información personal y servicios ofrecidos</p>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => setActiveTab("profile")}
          role="tab"
          aria-selected={activeTab === "profile"}
        >
          Datos personales
        </button>
        <button
          className={activeTab === "services" ? "active" : ""}
          onClick={() => setActiveTab("services")}
          role="tab"
          aria-selected={activeTab === "services"}
        >
          Mis servicios
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        {activeTab === "profile" && (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={currentUser.email || ""}
                  disabled
                  className="disabled"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Ciudad *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ej: Buenos Aires"
                  required
                />
              </div>
              <div className="form-group">
                <label>País *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Ej: Argentina"
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej: +54 9 11 1234-5678"
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento *</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Biografía</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Cuéntanos sobre ti..."
                rows="4"
              ></textarea>
            </div>

            <div className="form-grid">
              {currentUser.role === "worker" && (
                <div className="form-group">
                  <label>Tarifa por hora (COP)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="Ej: 25000"
                    min="0"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Tu dirección completa"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Foto de perfil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  name="photo"
                />
              </div>
              <div className="form-group preview">
                <img
                  src={preview || "/assets/default-avatar.png"}
                  alt="Vista previa"
                  className="preview-img"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "services" && (
          <div className="services-tab">
            {services.length === 0 ? (
              <div className="convert-prompt">
                <i
                  className="fas fa-tools"
                  style={{
                    fontSize: "2rem",
                    color: "#4a9d9c",
                    marginBottom: "0.5rem",
                  }}
                ></i>
                <h3>¿Quieres ofrecer servicios?</h3>
                <p>
                  Agrega tus habilidades y conviértete en un profesional visible
                  para miles de usuarios.
                </p>
                <button
                  type="button"
                  onClick={convertToWorker}
                  className="btn-convert"
                >
                  ✅ Comenzar a ofrecer servicios
                </button>
              </div>
            ) : (
              <>
                <p>Gestiona los servicios que ofreces:</p>
                {services.map((service, index) => {
                  const usedProfessions = services
                    .map((s) => s.profession)
                    .filter((_, i) => i !== index);
                  const available = availableProfessions.filter(
                    (p) => !usedProfessions.includes(p)
                  );

                  return (
                    <div key={index} className="service-row">
                      <select
                        value={service.profession || ""}
                        onChange={(e) =>
                          handleServiceChange(
                            index,
                            "profession",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="">Selecciona un oficio</option>
                        {availableProfessions.map((p) => {
                          const isUsed =
                            usedProfessions.includes(p) &&
                            service.profession !== p;
                          return (
                            <option key={p} value={p} disabled={isUsed}>
                              {isUsed
                                ? `(✔️) ${p}`
                                : p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                          );
                        })}
                      </select>
                      <input
                        type="number"
                        placeholder="Tarifa por hora (COP)"
                        value={service.hourlyRate || ""}
                        onChange={(e) =>
                          handleServiceChange(
                            index,
                            "hourlyRate",
                            e.target.value
                          )
                        }
                        required
                        min="0"
                      />
                      <textarea
                        placeholder="Describe tu servicio..."
                        value={service.bio || ""}
                        onChange={(e) =>
                          handleServiceChange(index, "bio", e.target.value)
                        }
                        rows="2"
                      />
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="btn-remove"
                        aria-label={`Eliminar servicio de ${service.profession}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addService}
                  className="btn-add"
                  disabled={availableProfessions.every((p) =>
                    services.some((s) => s.profession === p)
                  )}
                >
                  + Agregar otro servicio
                </button>
                {availableProfessions.every((p) =>
                  services.some((s) => s.profession === p)
                ) && (
                  <p className="no-more-services">
                    Has agregado todos los servicios disponibles.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCancel}
            disabled={!isDirty}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!isDirty}>
            Guardar cambios
          </button>
        </div>

        {isDirty && (
          <p className="unsaved-warning">Tienes cambios sin guardar.</p>
        )}
      </form>
    </div>
  );
};

export default ProfileForm;
