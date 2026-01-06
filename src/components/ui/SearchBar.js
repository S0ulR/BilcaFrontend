// components/ui/SearchBar.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./SearchBar.css";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionType, setSuggestionType] = useState("workers"); // 'workers' o 'professions'
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Detectar si la búsqueda parece una profesión
  const isProfessionQuery = (q) => {
    const cleaned = q.trim().toLowerCase();
    // Si la query tiene menos de 15 caracteres y no tiene espacios, es probablemente una profesión
    return cleaned.length > 1 && cleaned.length < 15 && !cleaned.includes(" ");
  };

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        if (isProfessionQuery(query)) {
          // ✅ Buscar profesiones
          const res = await API.get(`/workers/professions`, {
            params: { q: query },
          });
          setSuggestions(
            res.data.map((prof) => ({ type: "profession", name: prof }))
          );
          setSuggestionType("professions");
        } else {
          // ✅ Buscar trabajadores
          const res = await API.get(`/workers`, {
            params: { search: query },
          });
          const workers = res.data.slice(0, 5);
          setSuggestions(
            workers.map((worker) => ({ type: "worker", ...worker }))
          );
          setSuggestionType("workers");
        }
      } catch (err) {
        console.error("Error al buscar sugerencias:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "profession") {
      // ✅ Redirigir a búsqueda por profesión
      navigate(`/workers?profession=${encodeURIComponent(suggestion.name)}`);
    } else {
      // ✅ Redirigir al perfil del trabajador
      setQuery(suggestion.name);
      navigate(`/worker/${suggestion._id}`);
    }
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // ✅ Detectar si es una profesión conocida
      const cleaned = query.trim().toLowerCase();
      const matchedProfession = VALID_PROFESSIONS.find(
        (prof) => prof.toLowerCase() === cleaned
      );

      if (matchedProfession) {
        navigate(
          `/workers?profession=${encodeURIComponent(matchedProfession)}`
        );
      } else {
        navigate(`/workers?search=${encodeURIComponent(query)}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        placeholder="¿Qué oficio buscas?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 1 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      <button type="submit">
        <i className="fas fa-search"></i>
      </button>

      {showSuggestions &&
        (loading ? (
          <ul className="suggestions-list">
            <li>Cargando...</li>
          </ul>
        ) : suggestions.length > 0 ? (
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li
                key={
                  suggestion.type === "profession"
                    ? suggestion.name
                    : suggestion._id || index
                }
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.type === "profession" ? (
                  <div className="suggestion-content">
                    <i className="fas fa-briefcase suggestion-icon"></i>
                    <div className="suggestion-info">
                      <strong>
                        {suggestion.name.charAt(0).toUpperCase() +
                          suggestion.name.slice(1)}
                      </strong>
                      <small>Profesión</small>
                    </div>
                  </div>
                ) : (
                  <div className="suggestion-content">
                    <img
                      src={suggestion.photo || "/assets/default-avatar.png"}
                      alt={suggestion.name}
                      className="suggestion-photo"
                      onError={(e) =>
                        (e.target.src = "/assets/default-avatar.png")
                      }
                    />
                    <div className="suggestion-info">
                      <strong>{suggestion.name}</strong>
                      <p>
                        {suggestion.services
                          ?.map((s) => s.profession)
                          .join(", ") || "Sin profesión"}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          query.length >= 2 && (
            <ul className="suggestions-list">
              <li>No se encontraron resultados.</li>
            </ul>
          )
        ))}
    </form>
  );
};

// ✅ Definir profesiones válidas para el frontend
const VALID_PROFESSIONS = [
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

export default SearchBar;
