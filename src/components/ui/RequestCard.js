// src/components/ui/RequestCard.js
import React, { useState } from "react";
import { ToastContext } from "../../context/ToastContext";
import { useContext } from "react";
import "./RequestCard.css";

const RequestCard = ({ request, onViewRequest, onRejectRequest }) => {
  const { error } = useContext(ToastContext);
  const [expanded, setExpanded] = useState(false);
  const isReceived = !!request.client;
  const user = isReceived ? request.client : request.worker;
  const isPending = request.status === "pendiente";

  return (
    <div className={`request-card ${expanded ? "expanded" : ""}`}>
      <div className="user-header" onClick={() => setExpanded(!expanded)}>
        <img
          src={user?.photo || "/assets/default-avatar.png"}
          alt={user?.name}
          className="user-photo-small"
          onError={(e) => (e.target.src = "/assets/default-avatar.png")}
        />
        <div className="user-info">
          <strong className="user-name">
            {isReceived ? "Cliente:" : "Trabajador:"}{" "}
          </strong>
          <span className="user-name">{user?.name}</span>
          <div className="user-role">
            <strong className="user-name">Necesita: </strong>
            <span className="profession">{request.profession}</span>
          </div>
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        <i
          className={`fas fa-chevron-${expanded ? "up" : "down"} toggle-icon`}
        ></i>
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
          <strong>Estado:</strong>{" "}
          <span className={`status-badge ${request.status}`}>
            {isPending
              ? "Pendiente"
              : request.status === "respondido"
              ? "Respondido"
              : "Rechazado"}
          </span>
        </p>

        <div className="card-actions">
          {isPending && (
            <>
              {/* Botón "Ver solicitud" */}
              <button
                className="btn-card-action btn-view"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRequest?.(request);
                }}
              >
                <i className="fas fa-eye"></i> Ver solicitud
              </button>

              {/* Botón "Rechazar" */}
              <button
                className="btn-card-action btn-reject"
                onClick={(e) => {
                  e.stopPropagation();
                  onRejectRequest?.(request);
                }}
              >
                <i className="fas fa-times-circle"></i> Rechazar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
