import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchWorker.css';

const SearchWorker = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    profession: '',
    location: '',
    minRating: ''
  });

  const professions = ['plomero', 'electricista', 'niñero', 'albañil', 'jardinero', 'carpintero', 'pintor', 'limpieza'];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.profession) params.append('oficio', filters.profession);
    if (filters.location) params.append('ubicacion', filters.location);
    if (filters.minRating) params.append('rating', filters.minRating);

    navigate(`/workers?${params.toString()}`);
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="search-worker-page">

      <div className="search-header">
        <h1>Encuentra al profesional ideal</h1>
        <p>Busca por oficio, ubicación o valoración mínima.</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <label htmlFor="profession">Oficio</label>
          <select
            name="profession"
            value={filters.profession}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un oficio</option>
            {professions.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Ubicación</label>
          <input
            type="text"
            name="location"
            placeholder="Ej: Bogotá, Ciudad de México"
            value={filters.location}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="minRating">Valoración mínima</label>
          <select
            name="minRating"
            value={filters.minRating}
            onChange={handleChange}
          >
            <option value="">Cualquiera</option>
            <option value="4">4 estrellas y más</option>
            <option value="3">3 estrellas y más</option>
            <option value="2">2 estrellas y más</option>
            <option value="1">1 estrella y más</option>
          </select>
        </div>

        <button type="submit" className="btn-search">
          <i className="fas fa-search"></i> Buscar
        </button>
      </form>

      <div className="search-tips">
        <h3>Consejos</h3>
        <ul>
          <li>Selecciona un oficio para comenzar la búsqueda.</li>
          <li>Agrega tu ubicación para encontrar trabajadores cercanos.</li>
          <li>Filtra por valoración para mayor confianza.</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchWorker;
