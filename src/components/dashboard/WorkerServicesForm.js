// frontend/components/dashboard/WorkerServicesForm.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import { useContext } from "react";
import "./WorkerServicesForm.css";

const WorkerServicesForm = ({ onUpdateUser }) => {
  const { success, error: showError } = useContext(ToastContext);
  const { user, login } = useAuth();
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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.services?.length) {
      setServices(user.services);
    } else {
      setServices([]);
    }
  }, [user]);

  const addService = () => {
    setServices([...services, { profession: "", hourlyRate: "", bio: "" }]);
  };

  const removeService = (index) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
  };

  const updateService = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Corregido: ruta sin /api duplicado
      const res = await API.put("/users/services", { services });
      const updatedUser = { ...user, ...res.data.user };
      if (onUpdateUser) onUpdateUser(updatedUser);
      login(
        updatedUser,
        sessionStorage.getItem("token"),
        sessionStorage.getItem("sessionId")
      );
      success("Servicios actualizados", "Ya puedes recibir solicitudes");
      setIsEditing(false);
    } catch (err) {
      showError(err.response?.data?.msg || "Error al guardar servicios");
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      setServices(user.services || []);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="worker-services-form">
      <h2>
        {user.role === "worker"
          ? "Gestionar mis servicios"
          : "Ofrecer mis servicios"}
      </h2>
      <p>
        {user.role === "worker"
          ? "Edita los servicios que ofreces."
          : "Conviértete en trabajador agregando tus servicios."}
      </p>

      {!isEditing ? (
        <div className="services-preview">
          {services.length === 0 ? (
            <p>No ofreces servicios aún.</p>
          ) : (
            services.map((s, i) => (
              <div key={i} className="service-item">
                <strong>{s.profession}</strong> - ${s.hourlyRate}/hora
                <p>{s.bio}</p>
              </div>
            ))
          )}
          <button onClick={toggleEdit} className="btn-edit">
            {user.role === "worker" ? "Editar servicios" : "Agregar servicios"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="services-form">
          <h3>Tus servicios</h3>
          {services.map((service, index) => (
            <div key={index} className="service-row">
              <select
                value={service.profession}
                onChange={(e) =>
                  updateService(index, "profession", e.target.value)
                }
                required
              >
                <option value="">Selecciona una profesión</option>
                {availableProfessions
                  .filter((p) => !services.some((s) => s.profession === p))
                  .map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                placeholder="Tarifa por hora (COP)"
                value={service.hourlyRate}
                onChange={(e) =>
                  updateService(index, "hourlyRate", e.target.value)
                }
                required
              />
              <textarea
                placeholder="Descripción del servicio"
                value={service.bio}
                onChange={(e) => updateService(index, "bio", e.target.value)}
                rows="2"
              />
              <button
                type="button"
                onClick={() => removeService(index)}
                className="btn-remove"
              >
                ×
              </button>
            </div>
          ))}

          <button type="button" onClick={addService} className="btn-add">
            + Agregar otro servicio
          </button>

          <div className="form-actions">
            <button type="button" onClick={toggleEdit} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Guardar servicios
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WorkerServicesForm;
