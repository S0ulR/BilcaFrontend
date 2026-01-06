// src/components/dashboard/Documents.js
import React from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../ui/Breadcrumb";
import "./Documents.css";

const Documents = () => {
  return (
    <div className="documents-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Documentos", active: true },
        ]}
      />

      <div className="welcome-card">
        <h1>Genera documentos profesionales</h1>
        <p>
          Crea presupuestos, contratos y facturas con solo unos clics. Todo
          listo para compartir.
        </p>
      </div>

      <div className="documents-grid">
        <Link to="/dashboard/documents/budget" className="doc-card">
          <i className="fas fa-calculator"></i>
          <h3>Presupuesto</h3>
          <p>Estima el costo de un servicio antes de comenzar.</p>
        </Link>

        <Link to="/dashboard/documents/contract" className="doc-card">
          <i className="fas fa-file-contract"></i>
          <h3>Contrato</h3>
          <p>Formaliza el acuerdo con el cliente o trabajador.</p>
        </Link>

        <Link to="/dashboard/documents/invoice" className="doc-card">
          <i className="fas fa-receipt"></i>
          <h3>Factura</h3>
          <p>Emite una factura por servicios prestados.</p>
        </Link>
      </div>
    </div>
  );
};

export default Documents;
