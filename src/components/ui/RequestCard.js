// src/components/ui/RequestCard.js
import React, { useState } from "react";
import { ToastContext } from "../../context/ToastContext";
import { useContext } from "react";
import API from "../../services/api";
import "./RequestCard.css";

const RequestCard = ({ request, onRespond, onViewResponse, onDelete, onGeneratePDF, hasGeneratedPDF }) => {
  const { success, error } = useContext(ToastContext);
  const [expanded, setExpanded] = useState(false);
  const isReceived = request.client; // Verifica si es una solicitud recibida (cliente -> trabajador)
  const user = isReceived ? request.client : request.worker;
  const isPending = request.status === "pendiente";
  const isResponded = request.status === "respondido";

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de eliminar esta solicitud?")) return;

    try {
      await API.delete(`/budget-requests/${request._id}`);
      onDelete(request._id);
      success("Solicitud eliminada");
    } catch (err) {
      error("No se pudo eliminar la solicitud");
    }
  };

  const handleGeneratePDF = () => {
    if (onGeneratePDF) {
      onGeneratePDF(request);
    }
  };

  return (
    <div className={`request-card ${expanded ? "expanded" : ""}`}>
      <div className="user-header" onClick={() => setExpanded(!expanded)}>
        <img
          src={user.photo || "/assets/default-avatar.png"}
          alt={user.name}
          className="user-photo"
          onError={(e) => (e.target.src = "/assets/default-avatar.png")}
        />
        <div>
          <strong>{user.name}</strong>
          <div className="profession">{request.profession}</div>
        </div>
        <i className={`fas fa-chevron-${expanded ? "up" : "down"} toggle-icon`}></i>
      </div>

      <div className={`card-body ${expanded ? "expanded" : "collapsed"}`}>
        <p>
          <strong>Descripción:</strong> <span>{request.description}</span>
        </p>

        <p>
          <strong>Urgente:</strong>{" "}
          {request.urgent === "si" ? (
            <span className="urgent yes">Sí</span>
          ) : (
            <span className="urgent no">No</span>
          )}
        </p>

        <p>
          <strong>Fecha:</strong> {new Date(request.createdAt).toLocaleDateString()}
        </p>

        {request.response && expanded && (
          <>
            <p>
              <strong>Mensaje del presupuesto:</strong> {request.response.message}
            </p>
            <p>
              <strong>Presupuesto:</strong> ${request.response.budget?.toFixed(2)}
            </p>
            <p>
              <strong>Tiempo estimado:</strong> {request.response.estimatedTime}
            </p>
          </>
        )}

        <p>
          <strong>Estado:</strong>{" "}
          <span className={`status-badge ${request.status}`}>
            {isPending ? "Pendiente" : isResponded ? "Respondido" : "Rechazado"}
          </span>
        </p>

        <div className="card-actions">
          {isPending && (
            <button className="btn-card-action btn-primary" onClick={() => onRespond?.(request)}>
              <i className="fas fa-reply"></i> Responder
            </button>
          )}

          {isResponded && !isReceived && (
            <button className="btn-card-action btn-outline" onClick={() => onViewResponse?.(request)}>
              <i className="fas fa-eye"></i> Ver respuesta
            </button>
          )}

          {/* Botón de PDF - Solo para solicitudes recibidas (trabajador ve) */}
          {isReceived && (
            <button
              className={`btn-card-action ${hasGeneratedPDF ? "btn-view" : "btn-pdf"}`}
              onClick={handleGeneratePDF}
              aria-label={hasGeneratedPDF ? "Ver presupuesto en PDF" : "Generar presupuesto en PDF"}
            >
              <i className={`fas ${hasGeneratedPDF ? "fa-file-alt" : "fa-file-pdf"}`}></i>
              {hasGeneratedPDF ? "Ver PDF" : "PDF"}
            </button>
          )}

          <button className="btn-card-action btn-delete" onClick={handleDelete}>
            <i className="fas fa-trash-alt"></i> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
