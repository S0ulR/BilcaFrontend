// src/components/dashboard/OfferService.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import API from "../../services/api";
import "./OfferService.css";

const OfferService = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    profession: "",
    bio: "",
    hourlyRate: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Corregido: ruta sin /api (tu API.js lo maneja)
      await API.put("/users/services", {
        services: [
          {
            profession: formData.profession,
            bio: formData.bio,
            hourlyRate: formData.hourlyRate,
          },
        ],
      });
      alert("Perfil actualizado como trabajador");
    } catch (err) {
      alert("Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Ofrecer tu servicio</h2>
      <form onSubmit={handleSubmit}>
        <select
          value={formData.profession}
          onChange={(e) =>
            setFormData({ ...formData, profession: e.target.value })
          }
          required
        >
          <option value="">Selecciona tu oficio</option>
          <option value="plomero">Plomero</option>
          <option value="electricista">Electricista</option>
          <option value="niñero">Niñero</option>
          <option value="albañil">Albañil</option>
          <option value="jardinero">Jardinero</option>
        </select>

        <textarea
          placeholder="Cuéntanos sobre ti (opcional)"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows="4"
        />

        <input
          type="number"
          placeholder="Tarifa por hora (opcional)"
          value={formData.hourlyRate}
          onChange={(e) =>
            setFormData({ ...formData, hourlyRate: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Dirección"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Publicar perfil"}
        </button>
      </form>
    </div>
  );
};

export default OfferService;
