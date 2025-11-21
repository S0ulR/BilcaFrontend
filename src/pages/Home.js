// src/components/Home.js
import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const jobCategories = [
  { name: "Electricista", icon: "fa-bolt", color: "#4A9D9C" },
  { name: "Niñero", icon: "fa-child", color: "#FFA726" },
  { name: "Pintor", icon: "fa-paint-roller", color: "#E91E63" },
  { name: "Plomero", icon: "fa-wrench", color: "#64B5F6" },
  { name: "Albañil", icon: "fa-hammer", color: "#8D6E63" },
  { name: "Jardinero", icon: "fa-leaf", color: "#4CAF50" },
  { name: "Carpintero", icon: "fa-tree", color: "#795548" },
  { name: "Limpieza", icon: "fa-broom", color: "#9E9E9E" },
  { name: "Gasista", icon: "fa-fire", color: "#FF7043" },
  { name: "Mudanzas", icon: "fa-truck-moving", color: "#90A4AE" },
  { name: "Cuidadores de adultos mayores", icon: "fa-user-nurse", color: "#AED581" },
  { name: "Paseador de perros", icon: "fa-dog", color: "#FFB74D" },
];

const Home = () => {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Encuentra al profesional que necesitas</h1>
          <p>
            Conectamos trabajadores informales con personas que necesitan ayuda.
            Rápido, seguro y cerca de ti.
          </p>
        </div>
      </section>

      {/* Categorías */}
      <section className="categories">
        <h2>¿Qué oficio buscas?</h2>
        <div className="category-grid">
          {jobCategories.map((job) => (
            <Link
              to={`/workers?oficio=${encodeURIComponent(job.name.toLowerCase())}`}
              key={job.name}
              className="category-card"
              style={{ "--card-color": job.color }}
            >
              <div className="icon-wrapper">
                <i className={`fas ${job.icon}`}></i>
              </div>
              <h3>{job.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
