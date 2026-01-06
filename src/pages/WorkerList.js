// src/pages/WorkerList.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import WorkerCard from "../components/workers/WorkerCard";
import { getCurrentPosition } from "../utils/geolocation";
import LoadingScreen from "../components/ui/LoadingScreen";
import "./WorkerList.css";

const WorkerList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    profession: "",
    location: "",
    radius: "",
    minRating: "",
    maxHourlyRate: "",
    sortBy: "rating",
  });

  const searchParams = new URLSearchParams(location.search);
  const oficio = searchParams.get("oficio");

  const professions = [
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
  ];

  useEffect(() => {
    if (oficio && !filters.profession) {
      const normalized = oficio.toLowerCase();
      if (professions.includes(normalized)) {
        const capitalized =
          normalized.charAt(0).toUpperCase() + normalized.slice(1);
        setFilters((prev) => ({ ...prev, profession: capitalized }));
      }
    }
  }, [oficio, filters.profession, professions]);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      setError("");

      try {
        let lat = null,
          lng = null;
        try {
          const pos = await getCurrentPosition();
          lat = pos.lat;
          lng = pos.lng;
        } catch (err) {
          console.log("Ubicación no disponible");
        }

        const params = {};
        if (filters.profession) {
          params.profession = filters.profession.toLowerCase();
        }
        if (filters.location) {
          params.search = filters.location;
        }
        if (lat && lng) {
          params.lat = lat;
          params.lng = lng;
        }

        const res = await API.get("/workers", { params });

        // Normalizar workers para compatibilidad con WorkerCard
        const normalizedWorkers = res.data.map((worker) => {
          const activeServices = Array.isArray(worker.services)
            ? worker.services.filter((s) => s.isActive !== false)
            : [];

          return {
            ...worker,
            services: activeServices,
          };
        });

        setWorkers(normalizedWorkers);
      } catch (err) {
        setError(
          err.response?.data?.msg || "No se pudieron cargar los trabajadores."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [filters.profession, filters.location]);

  const filteredWorkers = workers
    .filter((w) => {
      if (filters.profession) {
        const hasService = w.services?.some(
          (s) => s.profession.toLowerCase() === filters.profession.toLowerCase()
        );
        if (!hasService) return false;
      }

      if (filters.radius && w.distance) {
        if (w.distance > parseInt(filters.radius)) return false;
      }

      if (filters.minRating && w.rating < parseFloat(filters.minRating)) {
        return false;
      }

      if (
        filters.maxHourlyRate &&
        w.services?.some(
          (s) => s.hourlyRate > parseFloat(filters.maxHourlyRate)
        )
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "rating") return b.rating - a.rating;
      if (filters.sortBy === "proximity" && a.distance && b.distance) {
        return a.distance - b.distance;
      }
      if (filters.sortBy === "price") {
        const aRate = a.services?.[0]?.hourlyRate || 0;
        const bRate = b.services?.[0]?.hourlyRate || 0;
        return aRate - bRate;
      }
      return 0;
    });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkers = filteredWorkers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, workers]);

const handleFilterChange = (e) => {
  const { name, value } = e.target;
  const newFilters = { ...filters, [name]: value };
  setFilters(newFilters);

  // Actualizar URL con TODOS los filtros
  const searchParams = new URLSearchParams();
  if (newFilters.profession) {
    searchParams.set('oficio', newFilters.profession.toLowerCase());
  }
  if (newFilters.location) {
    searchParams.set('ubicacion', newFilters.location);
  }
  if (newFilters.minRating) {
    searchParams.set('rating', newFilters.minRating);
  }
  
  navigate(`/workers?${searchParams.toString()}`, { replace: true });
};

  const getLoadingMessage = () => {
    if (!filters.profession) return "Cargando todos los trabajadores...";
    return `Buscando trabajadores para "${filters.profession}"...`;
  };

  return (
    <div className="worker-list-page">
      <div className="worker-list-header">
        <h1>Trabajadores: {filters.profession || "TODOS"}</h1>

        <div className="advanced-filters">
          <div className="filter-group">
            <label htmlFor="profession">Profesión</label>
            <select
              id="profession"
              name="profession"
              value={filters.profession}
              onChange={handleFilterChange}
              aria-label="Filtrar por profesión"
            >
              <option value="">Todas las profesiones</option>
              {professions.map((p) => (
                <option key={p} value={p.charAt(0).toUpperCase() + p.slice(1)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="location">Ubicación</label>
            <input
              id="location"
              name="location"
              placeholder="Buscar por ubicación"
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="minRating">Rating mínimo</label>
            <select
              id="minRating"
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
            >
              <option value="">Todos los ratings</option>
              <option value="5">⭐⭐⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐+</option>
              <option value="3">⭐⭐⭐+</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="maxHourlyRate">Precio máximo</label>
            <select
              id="maxHourlyRate"
              name="maxHourlyRate"
              value={filters.maxHourlyRate}
              onChange={handleFilterChange}
            >
              <option value="">Todos los precios</option>
              <option value="20">$0 - $20</option>
              <option value="40">$0 - $40</option>
              <option value="60">$0 - $60</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortBy">Ordenar por</label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="">Ordenar por</option>
              <option value="rating">Mejor valorados</option>
              <option value="proximity">Más cercanos</option>
              <option value="price">Más económicos</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingScreen message={getLoadingMessage()} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : filteredWorkers.length === 0 ? (
        <p className="no-results">
          No se encontraron trabajadores con esos filtros.
        </p>
      ) : (
        <>
          <div className="worker-grid">
            {paginatedWorkers.map((worker) => (
              <WorkerCard
                key={worker._id}
                worker={worker}
                onClick={() => navigate(`/worker/${worker._id}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Anterior
              </button>

              <select
                value={currentPage}
                onChange={(e) => goToPage(Number(e.target.value))}
                className="pagination-select"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Página {i + 1}
                  </option>
                ))}
              </select>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkerList;
