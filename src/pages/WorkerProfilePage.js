// src/pages/WorkerProfilePage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider"; // Nuevo
import API from "../services/api";
import StarRating from "../components/ui/StarRating";
import Modal from "../components/ui/ModalForm";
import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";
import Breadcrumb from "../components/ui/Breadcrumb";
import "./WorkerProfilePage.css";

const WorkerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación
  const { success, error: showError } = useContext(ToastContext);

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const [hireForm, setHireForm] = useState({
    service: "",
    description: "",
    budget: "",
  });

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    profession: "",
    startDate: "",
    description: "",
    address: "",
    locality: "",
    province: "",
    country: "Argentina",
    urgent: "no",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const isAuth = !!user;
  const isWorker = user && user._id === id;

  // Inicializar formularios con datos del trabajador
  useEffect(() => {
    if (worker?.location) {
      const fullAddress = [
        worker.location.address || "",
        worker.location.locality || "",
        worker.location.province || "",
        worker.location.country || "Argentina"
      ].filter(Boolean).join(", ");

      setBudgetForm(prev => ({
        ...prev,
        address: fullAddress,
        country: worker.location.country || "Argentina"
      }));
    }
  }, [worker]);

  // Cargar perfil del trabajador
  const fetchWorker = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/workers/${id}`);
      const data = res.data;

      // Asegurar datos válidos
      const services = Array.isArray(data.services) ? data.services : [];

      setWorker(data);

      // Inicializar formularios
      const defaultService = services.length > 0 ? services[0].profession : "Servicio";

      setHireForm(prev => ({
        ...prev,
        service: prev.service || `Contratación de ${defaultService}`
      }));

      const fullAddress = [
        data.location?.address,
        data.location?.locality,
        data.location?.province,
        data.location?.country
      ].filter(Boolean).join(", ");

      setBudgetForm(prev => ({
        ...prev,
        profession: prev.profession || defaultService,
        address: fullAddress || "",
        country: data.location?.country || "Argentina"
      }));
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      showError("No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorker();
  }, [id]);

  // Contactar al trabajador
  const handleContact = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      return showError(
        "Acceso restringido",
        <span>
          Para contactar,{" "}
          <a href="/login" style={{ color: "#FFA726" }}>
            inicia sesión
          </a>.
        </span>
      );
    }

    try {
      await API.post("/messages/send", {
        recipient: id,
        content: contactMessage,
      });
      setContactModalOpen(false);
      setContactMessage("");
      success("Mensaje enviado", "La conversación ha comenzado");
      navigate("/dashboard/messages");
    } catch (err) {
      showError("Error", "No se pudo enviar el mensaje");
    }
  };

  // Contratar al trabajador
  const handleHire = async () => {
    if (!isAuth) {
      return showError(
        "Inicia sesión",
        <span>
          Para contratar,{" "}
          <a href="/login" style={{ color: "#FFA726" }}>
            inicia sesión
          </a>.
        </span>
      );
    }

    if (!hireForm.description.trim()) {
      return showError("Campo requerido", "La descripción es obligatoria");
    }

    try {
      await API.post("/hires", {
        worker: id,
        service: hireForm.service,
        description: hireForm.description,
        budget: hireForm.budget ? Number(hireForm.budget) : undefined,
      });

      success("¡Solicitud enviada!", "El trabajador la recibirá pronto");
      setHireForm({
        service: worker.services?.length > 0 ? `Contratación de ${worker.services[0].profession}` : "Nuevo trabajo",
        description: "",
        budget: "",
      });
      navigate("/dashboard/hires/user");
    } catch (err) {
      showError("Error", err.response?.data?.msg || "No se pudo enviar");
    }
  };

  // Solicitar presupuesto
  const handleSubmitBudget = async (e) => {
    e.preventDefault();

    // Validación adicional
    if (!budgetForm.province?.trim()) {
      return showError("Campo requerido", "La provincia no pudo ser detectada. Por favor, escribe una dirección válida.");
    }
    if (!budgetForm.locality?.trim()) {
      return showError("Campo requerido", "La localidad no pudo ser detectada.");
    }

    try {
      await API.post("/budget-requests/create", {
        worker: id,
        ...budgetForm,
      });

      success("Solicitud enviada", "El trabajador recibirá tu solicitud");
      setBudgetModalOpen(false);

      // Resetear formulario
      setBudgetForm({
        profession: worker.services?.length > 0 ? worker.services[0].profession : "",
        startDate: "",
        description: "",
        address: "",
        locality: "",
        province: "",
        country: "Argentina",
        urgent: "no",
      });
      setSuggestions([]);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "No se pudo enviar la solicitud";
      showError("Error", errorMsg);
    }
  };

  // Obtener ubicación actual del usuario
const handleUseCurrentLocation = () => {
  if (!navigator.geolocation) {
    showError("Geolocalización no soportada", "Tu navegador no soporta geolocalización.");
    return;
  }

  setIsFetchingLocation(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const response = await API.get(`/geocode/reverse`, {
          params: { lat: latitude, lon: longitude }
        });

        const data = response.data;
        const addr = data.address;

        setBudgetForm({
          ...budgetForm,
          address: data.display_name,
          locality: addr.town || addr.city || addr.suburb || "",
          province: addr.state || "Santa Fe",
          country: addr.country || "Argentina",
        });
        setSuggestions([]);
        success("Ubicación detectada", "Se usó tu ubicación actual.");
      } catch (err) {
        console.error("Error en reverse geocoding:", err);
        showError("Error", "No se pudo obtener tu dirección. ¿Estás bien conectado?");
      } finally {
        setIsFetchingLocation(false);
      }
    },
    (error) => {
      setIsFetchingLocation(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          showError("Permiso denegado", "Por favor, permite el acceso a tu ubicación.");
          break;
        case error.POSITION_UNAVAILABLE:
          showError("Ubicación no disponible", "No se pudo obtener tu ubicación.");
          break;
        case error.TIMEOUT:
          showError("Tiempo agotado", "La solicitud de ubicación expiró.");
          break;
        default:
          showError("Error desconocido", "No se pudo obtener tu ubicación.");
          break;
      }
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
};

  // Autocompletado con Nominatim (OpenStreetMap)
const handleLocationChange = async (e) => {
  const value = e.target.value;
  setBudgetForm({ ...budgetForm, address: value });
  setSuggestions([]);

  if (value.length < 3) return;

  try {
    const response = await API.get(`/geocode/search`, {
      params: { q: value, country: "AR" }
    });

    const filtered = response.data.map(item => ({
      display_name: item.display_name,
      address: item.address || {},
    }));

    setSuggestions(filtered);
  } catch (err) {
    console.error("Error buscando dirección:", err);
    showError("Error", "No se pudo buscar la dirección. Revisa tu conexión.");
  }
};

  // Seleccionar sugerencia
  const selectSuggestion = (suggestion) => {
    const addr = suggestion.address;
    setBudgetForm({
      ...budgetForm,
      address: suggestion.display_name,
      locality: addr.town || addr.city || addr.village || addr.suburb || "",
      province: addr.state || "Santa Fe",
      country: addr.country || "Argentina",
    });
    setSuggestions([]);
  };

  if (loading) {
    return (
      <div className="worker-profile-page">
        <Breadcrumb items={[{ label: "Inicio", path: "/" }, { label: "Perfil", active: true }]} />
        <div className="welcome-card">
          <h1>Cargando perfil...</h1>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="worker-profile-page">
        <Breadcrumb items={[{ label: "Inicio", path: "/" }, { label: "Perfil", active: true }]} />
        <div className="welcome-card">
          <h1>Perfil no encontrado</h1>
          <p>El trabajador que buscas no existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-profile-page">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Inicio", path: "/" },
        { label: "Trabajadores", path: "/workers" },
        { label: worker.name, active: true }
      ]} />

      {/* Encabezado */}
      <div className="profile-header">
        <img
          src={worker.photo || "/assets/default-avatar.png"}
          alt={worker.name}
          className="profile-photo-large"
          onError={(e) => e.target.src = "/assets/default-avatar.png"}
        />
        <div className="profile-info">
          <h1>{worker.name}</h1>

          {/* Profesiones */}
          <div className="profile-professions">
            {worker.services && worker.services.length > 0 ? (
              worker.services.map((s, i) => (
                <p key={i}>
                  <i className="fas fa-briefcase"></i>{" "}
                  {s.profession}{" "}
                  {s.hourlyRate && (
                    <span className="hourly-rate">(${s.hourlyRate}/hora)</span>
                  )}
                </p>
              ))
            ) : (
              <p><i className="fas fa-briefcase"></i> Oficios no especificados</p>
            )}
          </div>

          <p>
            <i className="fas fa-map-marker-alt"></i>{" "}
            {worker.location?.locality || worker.location?.city || "Ubicación no especificada"}
          </p>
          <div className="profile-rating">
            <StarRating rating={worker.rating} size="1.3rem" />
            <span>({worker.totalJobs} trabajos completados)</span>
          </div>
        </div>

        {!isWorker && (
          <div className="profile-actions">
            <button className="btn-contact" onClick={() => setContactModalOpen(true)}>
              <i className="fas fa-comment-dots"></i> Contactar
            </button>
            <button className="btn-budget" onClick={() => setBudgetModalOpen(true)}>
              <i className="fas fa-file-invoice-dollar"></i> Solicitar presupuesto
            </button>
            <button className="btn-hire" onClick={handleHire}>
              <i className="fas fa-handshake"></i> Contratar
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="profile-content">
        <section className="profile-bio">
          <h3>Sobre mí</h3>
          <p>{worker.bio || "Este trabajador aún no ha escrito una biografía."}</p>
        </section>

        {/* Servicios detallados */}
        {worker.services && worker.services.length > 0 && (
          <section className="profile-services">
            <h3>Mis servicios</h3>
            {worker.services.map((service, index) => (
              <div key={index} className="service-item">
                <h4>{service.profession}</h4>
                {service.hourlyRate && (
                  <p className="hourly-rate">
                    <i className="fas fa-tag"></i> ${service.hourlyRate} / hora
                  </p>
                )}
                {service.bio && <p>{service.bio}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Reseñas */}
        <section className="profile-reviews">
          <h3>Reseñas ({worker.reviews?.length || 0})</h3>
          {worker.reviews && worker.reviews.length > 0 ? (
            worker.reviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <strong>{review.user?.name || "Usuario"}</strong>
                  <StarRating rating={review.rating} />
                </div>
                <p className="review-comment">{review.comment}</p>
                {review.reply && (
                  <div className="review-reply">
                    <strong>Respuesta:</strong> {review.reply.text}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Aún no hay reseñas para este trabajador.</p>
          )}

        </section>
      </div>

      {/* Modal: Contactar */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={`Contactar a ${worker.name}`}
        size="md"
      >
        <form onSubmit={handleContact}>
          <div className="form-group">
            <label>Mensaje *</label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              rows="4"
              required
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="submit">Enviar</button>
            <button type="button" onClick={() => setContactModalOpen(false)}>Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Solicitar presupuesto */}
      <Modal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title={`Solicitar presupuesto a ${worker.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmitBudget}>
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label>Profesión del trabajo *</label>
                <select
                  value={budgetForm.profession}
                  onChange={(e) => setBudgetForm({ ...budgetForm, profession: e.target.value })}
                  required
                >
                  {worker.services?.length > 0 ? (
                    worker.services.map((s, i) => (
                      <option key={i} value={s.profession}>{s.profession}</option>
                    ))
                  ) : (
                    <option value="">Selecciona un oficio</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha tentativa de inicio (opcional)</label>
                <input
                  type="date"
                  value={budgetForm.startDate}
                  onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>¿Es urgente?</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                    <input
                      type="radio"
                      name="urgent"
                      value="no"
                      checked={budgetForm.urgent === "no" || !budgetForm.urgent}
                      onChange={() => setBudgetForm({ ...budgetForm, urgent: "no" })}
                    />
                    No
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                    <input
                      type="radio"
                      name="urgent"
                      value="si"
                      checked={budgetForm.urgent === "si"}
                      onChange={() => setBudgetForm({ ...budgetForm, urgent: "si" })}
                    />
                    Sí
                  </label>
                </div>
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label>Descripción del trabajo *</label>
                <textarea
                  value={budgetForm.description}
                  onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                  placeholder="Describe el trabajo que necesitas..."
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Ubicación del trabajo *</label>
                <input
                  type="text"
                  value={budgetForm.address}
                  onChange={handleLocationChange}
                  placeholder="Ej: Av. San Martín 1234, San Lorenzo"
                  className="location-input"
                  required
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isFetchingLocation}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                    padding: "0.5rem 0.8rem",
                    background: "#4a9d9c",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    width: "fit-content"
                  }}
                >
                  <i className={`fas ${isFetchingLocation ? "fa-spinner fa-spin" : "fa-map-marker-alt"}`}></i>
                  {isFetchingLocation ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
                </button>
                {suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map((suggestion, i) => (
                      <li
                        key={i}
                        onClick={() => selectSuggestion(suggestion)}
                        style={{
                          padding: "0.5rem",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          fontSize: "0.9rem",
                        }}
                      >
                        {suggestion.display_name}
                      </li>
                    ))}
                  </ul>
                )}
                <small style={{ color: "#6c757d", fontSize: "0.8rem" }}>
                  Selecciona una opción de la lista o usa tu ubicación actual.
                </small>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit">Enviar solicitud</button>
            <button type="button" onClick={() => setBudgetModalOpen(false)}>Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkerProfilePage;
