// src/components/dashboard/DashboardHome.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchWorker.css";

const SearchWorker = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    profession: "",
    location: "",
    minRating: "",
  });

  const professions = [
    { value: "plomero", label: "Plomero/a" },
    { value: "electricista", label: "Electricista" },
    { value: "niñero", label: "Niñero/a" },
    { value: "albañil", label: "Albañil" },
    { value: "jardinero", label: "Jardinero/a" },
    { value: "carpintero", label: "Carpintero/a" },
    { value: "pintor", label: "Pintor/a" },
    { value: "limpieza", label: "Limpieza" },
    { value: "paseador de perros", label: "Paseador de perros" },
    { value: "cuidadores de adultos", label: "Cuidador/a de adultos mayores" },
    { value: "mudanzas", label: "Mudanzas" },
    { value: "gasista", label: "Gasista" },
  ];

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (filters.profession) params.append("oficio", filters.profession);
    if (filters.location) params.append("ubicacion", filters.location);
    if (filters.minRating) params.append("rating", filters.minRating);

    navigate(`/workers?${params.toString()}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="search-worker-page">
      <div className="search-header">
        <h1>Encuentra al profesional ideal</h1>
        <p>Busca por oficio, ubicación o valoración mínima.</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <label htmlFor="profession">¿Qué servicio necesitas?</label>
          <select
            id="profession"
            name="profession"
            value={filters.profession}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un oficio</option>
            {professions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Ubicación</label>
          <input
            id="location"
            type="text"
            name="location"
            placeholder="Ej: Buenos Aires, Córdoba..."
            value={filters.location}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="minRating">Valoración mínima</label>
          <select
            id="minRating"
            name="minRating"
            value={filters.minRating}
            onChange={handleChange}
          >
            <option value="">Cualquiera</option>
            <option value="4">⭐⭐⭐⭐ y más</option>
            <option value="3">⭐⭐⭐ y más</option>
            <option value="2">⭐⭐ y más</option>
            <option value="1">⭐ y más</option>
          </select>
        </div>

        <button type="submit" className="btn-search">
          <i className="fas fa-search"></i> Buscar profesionales
        </button>
      </form>

      <div className="search-tips">
        <h3>💡 Consejos para una mejor búsqueda</h3>
        <ul>
          <li>
            <strong>Oficio:</strong> Selecciona el servicio específico que
            necesitas.
          </li>
          <li>
            <strong>Ubicación:</strong> Incluye ciudad o barrio para resultados
            cercanos.
          </li>
          <li>
            <strong>Valoración:</strong> Filtra por estrellas para mayor
            confianza.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SearchWorker;
