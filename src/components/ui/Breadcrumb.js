// components/ui/Breadcrumb.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Breadcrumb.css";

const Breadcrumb = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav className="breadcrumb" aria-label="migas de pan">
      <button
        className="breadcrumb-back"
        onClick={() => navigate(-1)}
        aria-label="Volver"
      >
        <i className="fas fa-arrow-left"></i>
      </button>
      <ul>
        {items.map((item, index) => (
          <li key={index} className={item.active ? "active" : ""}>
            {item.active ? (
              <span>{item.label}</span>
            ) : (
              <button onClick={() => navigate(item.path)}>{item.label}</button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
