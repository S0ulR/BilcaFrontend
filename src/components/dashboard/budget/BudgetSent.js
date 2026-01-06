// src/components/dashboard/BudgetSent.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import { ToastContext } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthProvider";
import Breadcrumb from "../../ui/Breadcrumb";
import Modal from "../../ui/Modal";
import DataTable from "../../ui/DataTable";
import useIsMobile from "../../../hooks/useIsMobile";
import { generateBudgetPDF } from "../../../utils/generateBudgetPDF";
import "./BudgetSent.css";

const BudgetSent = () => {
  const { showError, success } = useContext(ToastContext);
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseModal, setResponseModal] = useState(null);
  const [generatedPDFs, setGeneratedPDFs] = useState(new Set());
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("budgetSentPDFsGenerated");
      if (saved) {
        const ids = new Set(JSON.parse(saved));
        setGeneratedPDFs(ids);
      }
    } catch (err) {
      console.error("Error al cargar PDFs generados:", err);
    }
  }, []);

  const markAsGenerated = (requestId) => {
    setGeneratedPDFs((prev) => {
      const updated = new Set(prev);
      updated.add(requestId);
      try {
        sessionStorage.setItem(
          "budgetSentPDFsGenerated",
          JSON.stringify([...updated])
        );
      } catch (e) {
        console.warn("No se pudo guardar en sessionStorage");
      }
      return updated;
    });
  };

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Endpoint que filtra solo presupuestos enviados por el worker
        const res = await API.get("/budget-requests/sent-by-worker");
        setRequests(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error al cargar presupuestos enviados:", err);
        showError("No se pudieron cargar tus presupuestos");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [showError]);

  const handleViewResponse = (req) => {
    if (req.response) {
      setResponseModal(req);
    }
  };

  const handleGeneratePDF = (req) => {
    const hasGenerated = generatedPDFs.has(req._id);

    if (hasGenerated) {
      setResponseModal({
        _id: req._id,
        title: "PDF ya descargado",
        message: "Ya descargaste este presupuesto.",
        showDownloadButton: true,
        request: req,
      });
      return;
    }

    const data = {
      date: new Date().toLocaleDateString("es-AR"),
      validUntil: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("es-AR"),
      client: {
        name: req.client.name,
        email: req.client.email,
      },
      worker: {
        name: user?.name || "Profesional",
        profession: req.profession,
      },
      service: req.profession,
      description: req.description,
      totalAmount: req.response?.budget?.toFixed(2) || "Consultar",
      items: [
        {
          description: req.profession,
          quantity: 1,
          rate: req.response?.budget?.toFixed(2) || "A coordinar",
          amount: req.response?.budget?.toFixed(2) || "Consultar",
        },
      ],
    };

    try {
      generateBudgetPDF(data);
      success("PDF generado", "El presupuesto se ha descargado.");
      markAsGenerated(req._id);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      showError("No se pudo generar el PDF.");
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "respondido":
        return "Respondido";
      case "aceptado":
        return "Aceptado";
      case "rechazado":
        return "Rechazado";
      default:
        return "Desconocido";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "respondido":
        return "respondido";
      case "aceptado":
        return "aceptado";
      case "rechazado":
        return "rechazado";
      default:
        return "pendiente";
    }
  };

  const tableColumns = [
    {
      key: "client",
      header: "Cliente",
      accessor: "client.name",
      sortable: true,
      render: (row) => (
        <div className="user-cell">
          <img
            src={row.client.photo || "/assets/default-avatar.png"}
            alt={row.client.name}
            className="user-photo"
            onError={(e) => (e.target.src = "/assets/default-avatar.png")}
          />
          <span className="client-name">{row.client.name}</span>
        </div>
      ),
    },
    {
      key: "profession",
      header: "Servicio",
      accessor: "profession",
      sortable: true,
    },
    {
      key: "description",
      header: "Descripción",
      accessor: "description",
      render: (row) => (
        <div className="desc" title={row.description}>
          {row.description.length > 80
            ? `${row.description.substring(0, 80)}...`
            : row.description}
        </div>
      ),
    },
    {
      key: "budget",
      header: "Presupuesto",
      accessor: "response.budget",
      render: (row) => `$${row.response?.budget?.toFixed(2) || "N/A"}`,
    },
    {
      key: "createdAt",
      header: "Fecha",
      accessor: "createdAt",
      sortable: true,
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "status",
      header: "Estado",
      accessor: "status",
      sortable: true,
      render: (row) => (
        <span className={`status-badge ${getStatusClass(row.status)}`}>
          {getStatusDisplay(row.status)}
        </span>
      ),
    },
  ];

  const tableActions = [
    {
      key: "view",
      label: "Ver respuesta",
      icon: "fas fa-eye",
      className: "btn-view",
      onClick: handleViewResponse,
    },
    {
      key: "pdf",
      label: "Descargar PDF",
      icon: (row) =>
        generatedPDFs.has(row._id) ? "fas fa-file-alt" : "fas fa-file-pdf",
      className: (row) => (generatedPDFs.has(row._id) ? "btn-view" : "btn-pdf"),
      onClick: (req) => handleGeneratePDF(req),
    },
  ];

  if (loading) {
    return (
      <div className="budget-sent-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Presupuestos", path: "/dashboard/hires" },
            { label: "Enviados", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-paper-plane"></i>
          Mis Presupuestos Enviados
        </h2>
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando presupuestos...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="budget-sent-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Presupuestos", path: "/dashboard/hires" },
            { label: "Enviados", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-paper-plane"></i>
          Mis Presupuestos Enviados
        </h2>

        <div className="requests-cards-list">
          {requests.map((req) => (
            <div key={req._id} className="request-card">
              <div className="card-header">
                <img
                  src={req.client.photo || "/assets/default-avatar.png"}
                  alt={req.client.name}
                  className="user-photo-small"
                />
                <div>
                  <strong>{req.client.name}</strong>
                  <p className="profession">{req.profession}</p>
                </div>
                <span className={`status-badge ${getStatusClass(req.status)}`}>
                  {getStatusDisplay(req.status)}
                </span>
              </div>
              <p className="desc">
                {req.description.length > 80
                  ? `${req.description.substring(0, 80)}...`
                  : req.description}
              </p>
              <p>
                <strong>Presupuesto:</strong> $
                {req.response?.budget?.toFixed(2) || "N/A"}
              </p>
              <div className="card-actions">
                <button
                  className="btn-card-action btn-view"
                  onClick={() => handleViewResponse(req)}
                >
                  <i className="fas fa-eye"></i> Ver
                </button>
                <button
                  className="btn-card-action btn-pdf"
                  onClick={() => handleGeneratePDF(req)}
                >
                  <i className="fas fa-file-pdf"></i> PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {responseModal && (
          <Modal
            isOpen={true}
            onClose={() => setResponseModal(null)}
            title="Detalles del presupuesto"
            size="lg"
          >
            <div className="budget-response-content">
              {responseModal.showDownloadButton ? (
                <>
                  <p>{responseModal.message}</p>
                  <div className="modal-actions">
                    <button onClick={() => setResponseModal(null)}>
                      Cerrar
                    </button>
                    <button
                      className="btn-accept"
                      onClick={() => {
                        if (responseModal.request) {
                          handleGeneratePDF(responseModal.request);
                          setResponseModal(null);
                        }
                      }}
                    >
                      ✅ Descargar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>Mensaje:</strong> {responseModal.response.message}
                  </p>
                  <p>
                    <strong>Presupuesto:</strong> $
                    {responseModal.response.budget?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Tiempo estimado:</strong>{" "}
                    {responseModal.response.estimatedTime}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    {getStatusDisplay(responseModal.status)}
                  </p>
                  <div className="modal-actions">
                    <button onClick={() => setResponseModal(null)}>
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="budget-sent-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Presupuestos", path: "/dashboard/hires" },
          { label: "Enviados", active: true },
        ]}
      />
      <h2 className="page-title">
        <i className="fas fa-paper-plane"></i>
        Mis Presupuestos Enviados
      </h2>

      <DataTable
        data={requests}
        columns={tableColumns}
        actions={tableActions}
        initialSort={{ key: "createdAt", direction: "desc" }}
        itemsPerPage={6}
        enableSearch={true}
        searchPlaceholder="Buscar por cliente, servicio..."
        emptyStateText="No has enviado presupuestos aún"
        className="budget-sent-table"
      />

      {responseModal && (
        <Modal
          isOpen={true}
          onClose={() => setResponseModal(null)}
          title="Detalles del presupuesto"
          size="lg"
        >
          <div className="budget-response-content">
            {responseModal.showDownloadButton ? (
              <>
                <p>{responseModal.message}</p>
                <div className="modal-actions">
                  <button onClick={() => setResponseModal(null)}>Cerrar</button>
                  <button
                    className="btn-accept"
                    onClick={() => {
                      if (responseModal.request) {
                        handleGeneratePDF(responseModal.request);
                        setResponseModal(null);
                      }
                    }}
                  >
                    ✅ Descargar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  <strong>Mensaje:</strong> {responseModal.response.message}
                </p>
                <p>
                  <strong>Presupuesto:</strong> $
                  {responseModal.response.budget?.toFixed(2)}
                </p>
                <p>
                  <strong>Tiempo estimado:</strong>{" "}
                  {responseModal.response.estimatedTime}
                </p>
                <p>
                  <strong>Estado:</strong>{" "}
                  {getStatusDisplay(responseModal.status)}
                </p>
                <div className="modal-actions">
                  <button onClick={() => setResponseModal(null)}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BudgetSent;
