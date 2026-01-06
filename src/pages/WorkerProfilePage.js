// src/pages/WorkerProfilePage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import API from "../services/api";
import StarRating from "../components/ui/StarRating";
import Modal from "../components/ui/Modal";
import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";
import Breadcrumb from "../components/ui/Breadcrumb";
import { handleHttpError } from "../utils/httpErrorHandler";
import { useGeocoder } from "../hooks/useGeocoder";
import "./WorkerProfilePage.css";

const COUNTRIES = [
  { code: "AR", name: "Argentina 🇦🇷" },
  { code: "UY", name: "Uruguay 🇺🇾" },
  { code: "PY", name: "Paraguay 🇵🇾" },
  { code: "BR", name: "Brasil 🇧🇷" },
  { code: "CL", name: "Chile 🇨🇱" },
  { code: "BO", name: "Bolivia 🇧🇴" },
];

const WorkerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const { success, error: showError } = useContext(ToastContext);

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const [authWarning, setAuthWarning] = useState(false);

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
    countryCode: "AR",
    urgent: "no",
  });

  const [budgetSuccess, setBudgetSuccess] = useState(false);

  const { suggestions, search, clear } = useGeocoder(
    budgetForm.countryCode || "AR"
  );

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const isAuth = !!user;
  const isWorker = user && user._id === id;

  // ==========================
  // Helpers (match + formato)
  // ==========================
  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const getLocalityFromAddr = (addr = {}) =>
    addr.city ||
    addr.town ||
    addr.village ||
    addr.suburb ||
    addr.hamlet ||
    addr.neighbourhood ||
    "";

  const getRoadFromAddr = (addr = {}) => addr.road || addr.pedestrian || "";

  const scoreSuggestion = (suggestion, query) => {
    const q = normalize(query);
    const dn = normalize(suggestion.display_name);
    const addr = suggestion.address || {};
    const loc = normalize(getLocalityFromAddr(addr));
    const road = normalize(getRoadFromAddr(addr));

    let score = 0;

    // match fuerte sobre localidad
    if (loc && loc.startsWith(q)) score += 120;
    else if (loc && loc.includes(q)) score += 80;

    // match sobre calle
    if (road && road.startsWith(q)) score += 70;
    else if (road && road.includes(q)) score += 40;

    // match sobre display_name
    if (dn.startsWith(q)) score += 30;
    else if (dn.includes(q)) score += 15;

    // pequeños bonus por datos útiles
    if (addr.state) score += 5;
    if (addr.country) score += 2;

    return score;
  };

  const isUsefulSuggestion = (suggestion, query) => {
    const q = normalize(query);
    if (!q) return false;

    const dn = normalize(suggestion.display_name);
    const addr = suggestion.address || {};
    const loc = normalize(getLocalityFromAddr(addr));
    const road = normalize(getRoadFromAddr(addr));

    const containsStrong =
      (loc && loc.includes(q)) ||
      (road && road.includes(q)) ||
      (dn && dn.includes(q));

    if (!containsStrong) return false;

    // evitar basura típica
    if (dn.includes("sin nombre")) return false;

    return true;
  };

  // Inicializar formularios con datos del trabajador
  useEffect(() => {
    if (worker?.location) {
      const fullAddress = [
        worker.location.address || "",
        worker.location.locality || "",
        worker.location.province || "",
        worker.location.country || "Argentina",
      ]
        .filter(Boolean)
        .join(", ");

      // Solo actualizar el estado si el valor es diferente
      setBudgetForm((prev) => {
        const newAddress = fullAddress;
        const newCountry = worker.location.country || "Argentina";

        if (prev.address !== newAddress || prev.country !== newCountry) {
          return { ...prev, address: newAddress, country: newCountry };
        }
        return prev;
      });
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
      const defaultService =
        services.length > 0 ? services[0].profession : "Servicio";

      setHireForm((prev) => ({
        ...prev,
        service: prev.service || `Contratación de ${defaultService}`,
      }));

      const fullAddress = [
        data.location?.address,
        data.location?.locality,
        data.location?.province,
        data.location?.country,
      ]
        .filter(Boolean)
        .join(", ");

      setBudgetForm((prev) => ({
        ...prev,
        profession: prev.profession || defaultService,
        address: fullAddress || "",
        country: data.location?.country || "Argentina",
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

  // Mostrar toast de éxito fuera del modal (Vercel-safe)
  useEffect(() => {
    if (budgetSuccess) {
      success("Solicitud enviada", "El trabajador recibirá tu solicitud");
      setBudgetSuccess(false);
    }
  }, [budgetSuccess, success]);

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
          </a>
          .
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
          </a>
          .
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
        service:
          worker.services?.length > 0
            ? `Contratación de ${worker.services[0].profession}`
            : "Nuevo trabajo",
        description: "",
        budget: "",
      });
      navigate("/dashboard/hires/user");
    } catch (err) {
      showError("Error", err.response?.data?.msg || "No se pudo enviar");
    }
  };

  const handleSubmitBudget = async (e) => {
    e.preventDefault();

    if (!budgetForm.province?.trim()) {
      return showError(
        "Provincia requerida",
        "Por favor, selecciona una dirección de la lista o usa tu ubicación actual."
      );
    }

    if (!budgetForm.locality?.trim()) {
      return showError(
        "Localidad requerida",
        "Por favor, selecciona una dirección de la lista o usa tu ubicación actual."
      );
    }
    if (!isAuth) {
      showError(
        "Acceso requerido",
        <span>
          Para poder enviar un presupuesto debes{" "}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login", { state: { from: location } });
            }}
            style={{ color: "#4a9d9c", fontWeight: "bold" }}
          >
            ingresar a tu cuenta
          </a>
          .
        </span>
      );
      return;
    }

    try {
      // ⬅️ feedback inmediato
      setBudgetModalOpen(false);
      success("Enviando solicitud…", "Estamos procesando tu pedido");

      await API.post("/budget-requests/create", {
        worker: id,
        ...budgetForm,
      });

      success("Solicitud enviada", "El trabajador recibirá tu solicitud");

      // Cerrar modal
      setBudgetModalOpen(false);

      // Marcar éxito (el toast se dispara en useEffect)
      // setBudgetSuccess(true);

      // Resetear formulario
      setBudgetForm({
        profession:
          worker.services?.length > 0 ? worker.services[0].profession : "",
        startDate: "",
        description: "",
        address: "",
        locality: "",
        province: "",
        country: "Argentina",
        countryCode: "AR",
        urgent: "no",
      });
      clear();
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "No se pudo enviar la solicitud";
      showError("Error", errorMsg);
    }
  };

  // Obtener ubicación actual del usuario
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError(
        "Geolocalización no soportada",
        "Tu navegador no soporta geolocalización."
      );
      return;
    }

    setIsFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (latitude == null || longitude == null) {
          showError("Error", "No se pudo obtener tu ubicación.");
          setIsFetchingLocation(false);
          return;
        }

        try {
          const response = await API.get("/geocode/reverse", {
            params: { lat: latitude, lon: longitude },
          });

          const data = response.data || {};
          const addr = data.address || {};

          const locality = addr.town || addr.city || addr.village || "";

          const province = addr.state || "";
          const country = addr.country || "Argentina";

          const finalAddress =
            data.display_name ||
            [locality, province, country].filter(Boolean).join(", ");

          if (!finalAddress) {
            showError("Error", "No se pudo obtener tu dirección.");
            setIsFetchingLocation(false);
            return;
          }

          setBudgetForm((prev) => ({
            ...prev,
            address: finalAddress,
            locality,
            province,
            country,
          }));

          clear();

          if (!province || !locality) {
            showError(
              "Ubicación parcial",
              "Se detectó la ubicación, pero no se pudo completar provincia o localidad. Probá escribir tu ciudad."
            );
          } else {
            success("Ubicación detectada", "Se usó tu ubicación actual.");
          }
        } catch (err) {
          console.error("Error en reverse geocoding:", err);
          showError(
            "Error",
            "No se pudo obtener tu dirección. ¿Estás bien conectado?"
          );
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            showError("Permiso denegado", "Permite el acceso a tu ubicación.");
            break;
          case error.POSITION_UNAVAILABLE:
            showError(
              "Ubicación no disponible",
              "No se pudo obtener tu ubicación."
            );
            break;
          case error.TIMEOUT:
            showError("Tiempo agotado", "La solicitud expiró.");
            break;
          default:
            showError("Error desconocido", "No se pudo obtener tu ubicación.");
            break;
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;

    setBudgetForm((prev) => ({
      ...prev,
      address: value,
      locality: "",
      province: "",
    }));

    search(value);
  };

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const countryName =
      COUNTRIES.find((c) => c.code === countryCode)?.name.split(" ")[0] ||
      "Argentina";

    setBudgetForm((prev) => ({
      ...prev,
      country: countryName,
      countryCode: countryCode,
      address: "",
      locality: "",
      province: "",
    }));
    clear();
  };

  // SELECCIÓN DE SUGERENCIA MEJORADA
  const selectSuggestion = (suggestion) => {
    const addr = suggestion.address || {};

    // Extraer datos básicos
    const locality =
      addr.town ||
      addr.city ||
      addr.village ||
      addr.suburb ||
      addr.hamlet ||
      addr.neighbourhood ||
      "";

    const province = addr.state || ""; // Puede estar vacío

    // Si no hay provincia, intentar inferirla del display_name
    let inferredProvince = province;
    if (!inferredProvince && suggestion.display_name) {
      // Ejemplo: "San Lorenzo, Santa Fe, Argentina"
      // Dividimos por comas y tomamos el segundo elemento (índice 1)
      const parts = suggestion.display_name.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        // El segundo elemento podría ser la provincia
        inferredProvince = parts[1];
      }
    }

    // Aseguramos que no sea vacío
    const finalProvince = inferredProvince || "Sin provincia";

    const addressData = {
      address: suggestion.display_name,
      locality: locality || "Sin localidad", // Asegurar que no sea vacío
      province: finalProvince, // Usar la inferida o "Sin provincia"
      country: addr.country || budgetForm.country || "Argentina",
    };

    setBudgetForm((prev) => ({
      ...prev,
      ...addressData,
    }));
    clear();
  };

  if (loading) {
    return (
      <div className="worker-profile-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/" },
            { label: "Perfil", active: true },
          ]}
        />
        <div className="welcome-card">
          <h1>Cargando perfil...</h1>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="worker-profile-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/" },
            { label: "Perfil", active: true },
          ]}
        />
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
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/" },
          { label: "Trabajadores", path: "/workers" },
          { label: worker.name, active: true },
        ]}
      />

      {/* Encabezado */}
      <div className="profile-header">
        <img
          src={worker.photo || "/assets/default-avatar.png"}
          alt={worker.name}
          className="profile-photo-large"
          onError={(e) => (e.target.src = "/assets/default-avatar.png")}
        />
        <div className="profile-info">
          <h1>{worker.name}</h1>

          {/* Profesiones */}
          <div className="profile-professions">
            {worker.services && worker.services.length > 0 ? (
              worker.services.map((s, i) => (
                <p key={i}>
                  <i className="fas fa-briefcase"></i> {s.profession}{" "}
                  {s.hourlyRate && (
                    <span className="hourly-rate">(${s.hourlyRate}/hora)</span>
                  )}
                </p>
              ))
            ) : (
              <p>
                <i className="fas fa-briefcase"></i> Oficios no especificados
              </p>
            )}
          </div>

          <p>
            <i className="fas fa-map-marker-alt"></i>{" "}
            {worker.location?.locality ||
              worker.location?.city ||
              "Ubicación no especificada"}
          </p>
          <div className="profile-rating">
            <StarRating rating={worker.rating} size="1.3rem" />
            <span>({worker.totalJobs} trabajos completados)</span>
          </div>
        </div>

        {!isWorker && (
          <div className="profile-actions">
            <button
              className="btn-contact"
              onClick={() => setContactModalOpen(true)}
            >
              <i className="fas fa-comment-dots"></i> Contactar
            </button>
            <button
              className="btn-budget"
              onClick={() => setBudgetModalOpen(true)}
            >
              <i className="fas fa-file-invoice-dollar"></i> Solicitar
              presupuesto
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="profile-content">
        <section className="profile-bio">
          <h3>Sobre mí</h3>
          <p>
            {worker.bio || "Este trabajador aún no ha escrito una biografía."}
          </p>
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
          {!isAuth && (
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <i
                className="fas fa-exclamation-triangle"
                style={{ color: "#d39e00" }}
              ></i>
              <div>
                <strong>Acceso requerido</strong>
                <br />{" "}
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login", { state: { from: location } });
                  }}
                  style={{ color: "#FFA726", fontWeight: "bold" }}
                >
                  Inicia sesión
                </a>{" "}
                para contactar al trabajador.
              </div>
            </div>
          )}

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
            <button
              type="submit"
              disabled={!isAuth}
              style={!isAuth ? { opacity: 0.6, cursor: "not-allowed" } : {}}
            >
              {isAuth ? "Enviar" : "Iniciar sesión para enviar"}
            </button>
            <button type="button" onClick={() => setContactModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Solicitar presupuesto */}
      <Modal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title={`Solicitud de presupuesto para ${worker.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmitBudget}>
          {!isAuth && (
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <i
                className="fas fa-exclamation-triangle"
                style={{ color: "#d39e00" }}
              ></i>
              <div>
                <strong>Acceso requerido</strong>
                <br />{" "}
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login", { state: { from: location } });
                  }}
                  style={{ color: "#4a9d9c", fontWeight: "bold" }}
                >
                  Ingresa a tu cuenta
                </a>{" "}
                para enviar una solicitud de presupuesto.
              </div>
            </div>
          )}
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label>Profesión del trabajo *</label>
                <select
                  value={budgetForm.profession}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      profession: e.target.value,
                    })
                  }
                  required
                >
                  {worker.services?.length > 0 ? (
                    worker.services.map((s, i) => (
                      <option key={i} value={s.profession}>
                        {s.profession}
                      </option>
                    ))
                  ) : (
                    <option value="">Selecciona un oficio</option>
                  )}
                </select>
                <small style={{ color: "#6c757d", fontSize: "0.8rem" }}>
                  Selecciona la profesión que deseas contratar.
                </small>
              </div>

              <div className="form-group">
                <label>Fecha tentativa de inicio (opcional)</label>
                <input
                  type="date"
                  value={budgetForm.startDate}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      startDate: e.target.value,
                    })
                  }
                />
                <small style={{ color: "#6c757d", fontSize: "0.8rem" }}>
                  Si tienes fecha para iniciar el trabajo infórmala, para que el
                  trabajador vea su disponibilidad.
                </small>
              </div>

              <div className="form-group">
                <label>¿Es urgente?</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      margin: 0,
                    }}
                  >
                    <input
                      type="radio"
                      name="urgent"
                      value="no"
                      checked={budgetForm.urgent === "no" || !budgetForm.urgent}
                      onChange={() =>
                        setBudgetForm({ ...budgetForm, urgent: "no" })
                      }
                    />
                    No
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      margin: 0,
                    }}
                  >
                    <input
                      type="radio"
                      name="urgent"
                      value="si"
                      checked={budgetForm.urgent === "si"}
                      onChange={() =>
                        setBudgetForm({ ...budgetForm, urgent: "si" })
                      }
                    />
                    Sí
                  </label>
                </div>
                <small style={{ color: "#6c757d", fontSize: "0.8rem" }}>
                  Indica si necesitas el servicio con urgencia.
                </small>
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label>Descripción del trabajo *</label>
                <textarea
                  value={budgetForm.description}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe el trabajo que necesitas..."
                  rows="3"
                  required
                />
                <small style={{ color: "#6c757d", fontSize: "0.8rem" }}>
                  Se breve y específico en lo que necesitas.
                </small>
              </div>

              <div className="form-group">
                <label>País *</label>
                <select
                  value={budgetForm.countryCode || "AR"}
                  onChange={handleCountryChange}
                  className="country-select"
                  required
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ubicación del trabajo *</label>

                <div className="location-autocomplete">
                  <input
                    type="text"
                    value={budgetForm.address}
                    onChange={handleLocationChange}
                    placeholder="Ej: San Lorenzo, Santa Fe o Av. Córdoba 1234"
                    className={`location-input ${
                      suggestions.length > 0 ? "open" : ""
                    }`}
                    required
                  />

                  {suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((suggestion, i) => {
                        return (
                          <li
                            key={i}
                            onClick={() => selectSuggestion(suggestion)}
                            className="suggestion-item"
                          >
                            <div className="suggestion-title">
                              {suggestion.display_name}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

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
                    width: "fit-content",
                  }}
                >
                  <i
                    className={`fas ${
                      isFetchingLocation
                        ? "fa-spinner fa-spin"
                        : "fa-map-marker-alt"
                    }`}
                  ></i>
                  {isFetchingLocation
                    ? "Obteniendo ubicación..."
                    : "Usar mi ubicación actual"}
                </button>

                <small style={{ color: "#6c757d", fontSize: "0.8rem" }}>
                  ⚠️{" "}
                  <strong>Para mayor seguridad sólo ingresa tu ciudad. </strong>
                  Luego selecciona una opción de la lista para que se completen
                  automáticamente la provincia y localidad.
                </small>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              disabled={!isAuth}
              style={!isAuth ? { opacity: 0.6, cursor: "not-allowed" } : {}}
            >
              {isAuth ? "Enviar solicitud" : "Iniciar sesión para enviar"}
            </button>

            <button type="button" onClick={() => setBudgetModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkerProfilePage;
