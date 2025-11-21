// components/ui/SearchBar.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./SearchBar.css";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Cargar sugerencias desde backend cuando el input cambia
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/workers`, {
          params: { search: query }
        });
        const workers = res.data.slice(0, 5);
        setSuggestions(workers);
      } catch (err) {
        console.error("Error al buscar sugerencias:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSuggestionClick = (worker) => {
    setQuery(worker.name);
    setShowSuggestions(false);
    navigate(`/worker/${worker._id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/workers?search=${encodeURIComponent(query)}`);
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

      {showSuggestions && (loading ? (
        <ul className="suggestions-list">
          <li>Cargando...</li>
        </ul>
      ) : suggestions.length > 0 ? (
        <ul className="suggestions-list">
          {suggestions.map((worker) => (
            <li
              key={worker._id}
              onClick={() => handleSuggestionClick(worker)}
            >
              <div className="suggestion-content">
                <img
                  src={worker.photo || '/assets/default-avatar.png'}
                  alt={worker.name}
                  className="suggestion-photo"
                  onError={(e) => e.target.src = '/assets/default-avatar.png'}
                />
                <div className="suggestion-info">
                  <strong>{worker.name}</strong>
                  <p>{worker.professions?.join(", ") || "Sin profesión"}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : query.length >= 2 && (
        <ul className="suggestions-list">
          <li>No se encontraron trabajadores.</li>
        </ul>
      ))}
    </form>
  );
};

export default SearchBar;