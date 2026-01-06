// src/components/dashboard/BudgetRequestsReceived.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import { ToastContext } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthProvider";
import Breadcrumb from "../../ui/Breadcrumb";
import RequestCard from "../../ui/RequestCard";
import DataTable from "../../ui/DataTable";
import useIsMobile from "../../../hooks/useIsMobile";
import { generateBudgetPDF } from "../../../utils/generateBudgetPDF";
import Modal from "../../ui/Modal";
import "./BudgetRequestsReceived.css";

const BudgetRequestsReceived = () => {
  const { success, error: showError } = useContext(ToastContext);
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestToReject, setRequestToReject] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [requestToView, setRequestToView] = useState(null);

  const [generatedPDFs, setGeneratedPDFs] = useState(new Set());

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await API.get("/budget-requests/received");
        // ✅ Solo pendientes y rechazadas (como querés)
        const filteredRequests = (
          Array.isArray(res.data) ? res.data : []
        ).filter(
          (req) => req.status === "pendiente" || req.status === "rechazado"
        );
        setRequests(filteredRequests);
      } catch (err) {
        console.error("Error al cargar solicitudes:", err);
        showError("No se pudieron cargar las solicitudes");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [showError]);

  const markAsGenerated = (requestId) => {
    setGeneratedPDFs((prev) => {
      const updated = new Set(prev);
      updated.add(requestId);
      try {
        sessionStorage.setItem(
          "budgetPDFsGenerated",
          JSON.stringify([...updated])
        );
      } catch (e) {
        console.warn("No se pudo guardar en sessionStorage");
      }
      return updated;
    });
  };

  const handleRespond = (request) => {
    navigate("/dashboard/documents/budget", {
      state: {
        requestId: request._id,
        clientId: request.client._id,
        clientName: request.client.name,
        clientEmail: request.client.email,
        service: request.profession,
        description: request.description,
        urgent: request.urgent,
      },
    });
  };

  const handleReject = async () => {
    if (!requestToReject) return;

    try {
      await API.post(`/budget-requests/${requestToReject._id}/reject`, {
        reason: rejectReason.trim(),
      });

      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestToReject._id
            ? { ...req, status: "rechazado" }
            : req
        )
      );

      success("Solicitud rechazada", "El cliente ha sido notificado.");
      setRejectModalOpen(false);
      setRejectReason("");
      setRequestToReject(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "No se pudo rechazar la solicitud";
      showError("Error", errorMsg);
    }
  };

  const handleGeneratePDF = (request) => {
    const hasGenerated = generatedPDFs.has(request._id);

    if (hasGenerated) {
      alert(
        `Ya descargaste este presupuesto. Puedes volver a descargarlo si lo necesitas.`
      );
      return;
    }

    const data = {
      date: new Date().toLocaleDateString("es-AR"),
      validUntil: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("es-AR"),
      client: {
        name: request.client.name,
        email: request.client.email,
      },
      worker: {
        name: user?.name || "Profesional",
        profession: request.profession,
      },
      service: request.profession,
      description: request.description,
      totalAmount: "Consultar",
      items: [
        {
          description: request.profession,
          quantity: 1,
          rate: "A coordinar",
          amount: "Consultar",
        },
      ],
    };

    try {
      generateBudgetPDF(data);
      success("PDF generado", "El presupuesto se ha descargado.");
      markAsGenerated(request._id);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      showError("No se pudo generar el PDF.");
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
      key: "urgent",
      header: "Urgente",
      accessor: "urgent",
      sortable: true,
      render: (row) => (
        <span className={`urgent-badge ${row.urgent}`}>
          {row.urgent === "si" ? "Sí" : "No"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Ubicación",
      accessor: "locality",
      render: (row) => {
        const locality = row.locality || row.address?.locality || "";
        const province = row.province || row.address?.province || "";

        if (locality || province) {
          return `${locality}${province ? `, ${province}` : ""}`;
        }
        return "Ubicación no especificada";
      },
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
      render: (row) => {
        const status = row.status || "pendiente";
        let displayText = "Pendiente";

        if (status === "respondido") {
          displayText = "Respondido";
        } else if (status === "rechazado") {
          displayText = "Rechazado";
        }

        return <span className={`status-badge ${status}`}>{displayText}</span>;
      },
    },
  ];

  // Solo "Ver solicitud" y "Rechazar" en escritorio
  const tableActions = [
    {
      key: "view",
      label: "Ver solicitud",
      icon: "fas fa-eye",
      className: "btn-view",
      onClick: (req) => {
        setRequestToView(req);
        setViewModalOpen(true);
      },
    },
    {
      key: "reject",
      label: "Rechazar solicitud",
      icon: "fas fa-times-circle",
      className: "btn-reject",
      onClick: (req) => {
        setRequestToReject(req);
        setRejectReason("");
        setRejectModalOpen(true);
      },
      visible: (row) => row.status === "pendiente",
    },
  ];

  if (loading) {
    return (
      <div className="budget-requests-page received">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Presupuestos", path: "/dashboard/hires" },
            { label: "Recibidas", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-file-invoice-dollar"></i>
          Solicitudes de Presupuesto Recibidas
        </h2>
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="budget-requests-page received">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Presupuestos", path: "/dashboard/hires" },
            { label: "Recibidas", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-file-invoice-dollar"></i>
          Solicitudes de Presupuesto Recibidas
        </h2>

        <div className="requests-cards-list">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              onViewRequest={(request) => {
                setRequestToView(request);
                setViewModalOpen(true);
              }}
              onRejectRequest={(request) => {
                setRequestToReject(request);
                setRejectReason("");
                setRejectModalOpen(true);
              }}
            />
          ))}
        </div>
        {/* Modal: Rechazar solicitud */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title={`Rechazar presupuesto del usuario: ${
            requestToReject?.client?.name || "..."
          }`}
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleReject();
            }}
          >
            <div className="form-group">
              <label>Motivo del rechazo *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué rechazas esta solicitud..."
                rows="4"
                required
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="submit" disabled={!rejectReason.trim()}>
                Enviar
              </button>
              <button type="button" onClick={() => setRejectModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Ver Solicitud */}
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Solicitud de presupuesto de ${
            requestToView?.client?.name || "..."
          }`}
          size="lg"
        >
          {requestToView && (
            <div className="view-request-details">
              <div className="request-section">
                <h4>Cliente</h4>
                <p>
                  <strong>Nombre:</strong> {requestToView.client.name}
                </p>
                <p>
                  <strong>Email:</strong> {requestToView.client.email}
                </p>
                {requestToView.client.photo && (
                  <img
                    src={requestToView.client.photo}
                    alt={requestToView.client.name}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginTop: "0.5rem",
                    }}
                  />
                )}
              </div>

              <div className="request-section">
                <h4>Detalles del trabajo</h4>
                <p>
                  <strong>Servicio:</strong> {requestToView.profession}
                </p>
                <p>
                  <strong>Descripción:</strong> {requestToView.description}
                </p>
                <p>
                  <strong>Urgente:</strong>{" "}
                  {requestToView.urgent === "si" ? "Sí" : "No"}
                </p>
                {requestToView.startDate && (
                  <p>
                    <strong>Fecha de inicio:</strong>{" "}
                    {new Date(requestToView.startDate).toLocaleDateString(
                      "es-AR"
                    )}
                  </p>
                )}
              </div>

              <div className="request-section">
                <h4>Ubicación</h4>
                <p>
                  <strong>Dirección:</strong> {requestToView.address}
                </p>
                <p>
                  <strong>Localidad:</strong>{" "}
                  {requestToView.locality || "No especificada"}
                </p>
                <p>
                  <strong>Provincia:</strong>{" "}
                  {requestToView.province || "No especificada"}
                </p>
                <p>
                  <strong>País:</strong> {requestToView.country}
                </p>
              </div>

              <div className="request-section">
                <h4>Información general</h4>
                <p>
                  <strong>Estado:</strong>{" "}
                  {requestToView.status === "pendiente"
                    ? "Pendiente"
                    : requestToView.status === "respondido"
                    ? "Respondido"
                    : "Rechazado"}
                </p>
                <p>
                  <strong>Fecha de solicitud:</strong>{" "}
                  {new Date(requestToView.createdAt).toLocaleDateString(
                    "es-AR"
                  )}
                </p>
              </div>

              <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
                {requestToView.status === "pendiente" && (
                  <>
                    <button
                      className="btn-respond"
                      onClick={() => {
                        setViewModalOpen(false);
                        handleRespond(requestToView);
                      }}
                    >
                      <i className="fas fa-reply"></i> Contestar
                    </button>

                    <button
                      className={
                        generatedPDFs.has(requestToView._id)
                          ? "btn-view"
                          : "btn-pdf"
                      }
                      onClick={() => {
                        setViewModalOpen(false);
                        handleGeneratePDF(requestToView);
                      }}
                    >
                      <i
                        className={`fas ${
                          generatedPDFs.has(requestToView._id)
                            ? "fa-file-alt"
                            : "fa-file-pdf"
                        }`}
                      ></i>
                      {generatedPDFs.has(requestToView._id)
                        ? " Ver PDF"
                        : " Descargar PDF"}
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => {
                        setViewModalOpen(false);
                        setRequestToReject(requestToView);
                        setRejectReason("");
                        setRejectModalOpen(true);
                      }}
                    >
                      <i className="fas fa-times-circle"></i> Rechazar
                    </button>
                  </>
                )}

                <button
                  className="btn-secondary"
                  onClick={() => setViewModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="budget-requests-page received">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Presupuestos", path: "/dashboard/hires" },
          { label: "Recibidas", active: true },
        ]}
      />

      <h2 className="page-title">
        <i className="fas fa-file-invoice-dollar"></i>
        Solicitudes de Presupuesto Recibidas
      </h2>

      <DataTable
        data={requests}
        columns={tableColumns}
        actions={tableActions}
        initialSort={{ key: "createdAt", direction: "desc" }}
        itemsPerPage={6}
        enableSearch={true}
        searchPlaceholder="Buscar por cliente, servicio, estado..."
        emptyStateText="Actualmente no tienes solicitudes de presupuesto pendientes."
        className="budget-requests-table"
      />

      {/* Modal: Rechazar solicitud */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={`Rechazar presupuesto del usuario: ${
          requestToReject?.client?.name || "..."
        }`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleReject();
          }}
        >
          <div className="form-group">
            <label>Motivo del rechazo *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explica por qué rechazas esta solicitud..."
              rows="4"
              required
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="submit" disabled={!rejectReason.trim()}>
              Enviar
            </button>
            <button type="button" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ver Solicitud */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Solicitud de presupuesto de ${
          requestToView?.client?.name || "..."
        }`}
        size="lg"
      >
        {requestToView && (
          <div className="view-request-details">
            <div className="request-section">
              <h4>Cliente</h4>
              <p>
                <strong>Nombre:</strong> {requestToView.client.name}
              </p>
              <p>
                <strong>Email:</strong> {requestToView.client.email}
              </p>
              {requestToView.client.photo && (
                <img
                  src={requestToView.client.photo}
                  alt={requestToView.client.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginTop: "0.5rem",
                  }}
                />
              )}
            </div>

            <div className="request-section">
              <h4>Detalles del trabajo</h4>
              <p>
                <strong>Servicio:</strong> {requestToView.profession}
              </p>
              <p>
                <strong>Descripción:</strong> {requestToView.description}
              </p>
              <p>
                <strong>Urgente:</strong>{" "}
                {requestToView.urgent === "si" ? "Sí" : "No"}
              </p>
              {requestToView.startDate && (
                <p>
                  <strong>Fecha de inicio:</strong>{" "}
                  {new Date(requestToView.startDate).toLocaleDateString(
                    "es-AR"
                  )}
                </p>
              )}
            </div>

            <div className="request-section">
              <h4>Ubicación</h4>
              <p>
                <strong>Dirección:</strong> {requestToView.address}
              </p>
              <p>
                <strong>Localidad:</strong>{" "}
                {requestToView.locality || "No especificada"}
              </p>
              <p>
                <strong>Provincia:</strong>{" "}
                {requestToView.province || "No especificada"}
              </p>
              <p>
                <strong>País:</strong> {requestToView.country}
              </p>
            </div>

            <div className="request-section">
              <h4>Información general</h4>
              <p>
                <strong>Estado:</strong>{" "}
                {requestToView.status === "pendiente"
                  ? "Pendiente"
                  : requestToView.status === "respondido"
                  ? "Respondido"
                  : "Rechazado"}
              </p>
              <p>
                <strong>Fecha de solicitud:</strong>{" "}
                {new Date(requestToView.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>

            <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
              {requestToView.status === "pendiente" && (
                <>
                  <button
                    className="btn-respond"
                    onClick={() => {
                      setViewModalOpen(false);
                      handleRespond(requestToView);
                    }}
                  >
                    <i className="fas fa-reply"></i> Contestar
                  </button>

                  <button
                    className={
                      generatedPDFs.has(requestToView._id)
                        ? "btn-view"
                        : "btn-pdf"
                    }
                    onClick={() => {
                      setViewModalOpen(false);
                      handleGeneratePDF(requestToView);
                    }}
                  >
                    <i
                      className={`fas ${
                        generatedPDFs.has(requestToView._id)
                          ? "fa-file-alt"
                          : "fa-file-pdf"
                      }`}
                    ></i>
                    {generatedPDFs.has(requestToView._id)
                      ? " Ver PDF"
                      : " Descargar PDF"}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => {
                      setViewModalOpen(false);
                      setRequestToReject(requestToView);
                      setRejectReason("");
                      setRejectModalOpen(true);
                    }}
                  >
                    <i className="fas fa-times-circle"></i> Rechazar
                  </button>
                </>
              )}

              <button
                className="btn-secondary"
                onClick={() => setViewModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BudgetRequestsReceived;
