// src/components/ui/SmallLoader.js
import React from "react";
import "./SmallLoader.css";

const SmallLoader = ({ message = "Cargando..." }) => {
  return (
    <div className="small-loader">
      <div className="small-loader-spinner"></div>
      <p className="small-loader-text">{message}</p>
    </div>
  );
};

export default SmallLoader;
