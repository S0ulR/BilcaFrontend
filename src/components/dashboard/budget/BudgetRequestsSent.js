// src/components/dashboard/BudgetRequestsSent.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import { ToastContext } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthProvider";
import Breadcrumb from "../../ui/Breadcrumb";
import RequestCard from "../../ui/RequestCard";
import Modal from "../../ui/Modal";
import DataTable from "../../ui/DataTable";
import useIsMobile from "../../../hooks/useIsMobile";
import { generateBudgetPDF } from "../../../utils/generateBudgetPDF";
import "./BudgetRequestsSent.css";

const BudgetRequestsSent = () => {
  const { showError, success } = useContext(ToastContext);
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseModal, setResponseModal] = useState(null);
  const [chatModal, setChatModal] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [generatedPDFs, setGeneratedPDFs] = useState(new Set());
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Cargar PDFs generados
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("budgetPDFsGenerated_sent");
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
          "budgetPDFsGenerated_sent",
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
        const res = await API.get("/budget-requests/sent");
        // Filtrar: solo respondidas
        const filteredRequests = (
          Array.isArray(res.data) ? res.data : []
        ).filter((req) => req.status === "respondido");
        setRequests(filteredRequests);
      } catch (err) {
        console.error("Error al cargar solicitudes enviadas:", err);
        showError("No se pudieron cargar tus solicitudes de presupuesto");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [showError]);

  const handleAcceptBudget = (req) => {
    const profession = req.profession || req.worker.profession || "Servicio";

    // Navegar al formulario de contrato con los datos
    navigate("/dashboard/documents/contract", {
      state: {
        budgetRequestId: req._id,
        workerId: req.worker._id,
        workerName: req.worker.name,
        service: profession,
        description: req.description || "",
        budget: req.response.budget,
        estimatedTime: req.response.estimatedTime,
        startDate: req.response.startDate,
        endDate: req.response.endDate,
        hourlyRate: req.response.hourlyRate,
      },
    });

    setRequests((prevRequests) =>
      prevRequests.filter((r) => r._id !== req._id)
    );

    // Eliminar del sessionStorage si se usó allí
    setGeneratedPDFs((prev) => {
      const updated = new Set(prev);
      updated.delete(req._id);
      try {
        sessionStorage.setItem(
          "budgetPDFsGenerated_sent",
          JSON.stringify([...updated])
        );
      } catch (e) {
        console.warn("No se pudo actualizar sessionStorage");
      }
      return updated;
    });
  };

  // handleViewResponse para abrir el modal
  const handleViewResponse = (req) => {
    if (req.response) {
      setResponseModal(req);
    }
  };

  const handleOpenChatModal = (req) => {
    setChatModal(req);
    setChatMessage(
      `Hola ${req.worker.name}, gracias por tu presupuesto de $${req.response.budget}. ¿Podrías darme más detalles?`
    );
  };

  const handleStartChat = async () => {
    if (!chatMessage.trim()) {
      showError(
        "Mensaje vacío",
        "Escribe un mensaje para comenzar la conversación."
      );
      return;
    }

    try {
      await API.post("/messages/start", {
        recipient: chatModal.worker._id,
        content: chatMessage,
      });
      success("Conversación iniciada", "Ya puedes chatear con el trabajador.");
      setChatModal(null);
      setResponseModal(null);
      navigate("/dashboard/messages");
    } catch (err) {
      showError("Error", "No se pudo iniciar la conversación.");
    }
  };

  // --- ELIMINADA: handleDelete ---
  /*
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta solicitud?")) return;

    try {
      await API.delete(`/budget-requests/${id}`);
      setRequests((prev) => prev.filter((req) => req._id !== id));
      success("Solicitud eliminada correctamente");

      setGeneratedPDFs((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        sessionStorage.setItem("budgetPDFsGenerated_sent", JSON.stringify([...updated]));
        return updated;
      });
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "No se pudo eliminar la solicitud";
      showError(errorMsg);
    }
  };
  */
  // --- FIN ELIMINACIÓN ---

  const handleGeneratePDF = (req) => {
    const hasGenerated = generatedPDFs.has(req._id);

    if (hasGenerated) {
      setResponseModal({
        _id: req._id,
        title: "PDF ya descargado",
        message:
          "Ya descargaste este presupuesto. ¿Deseas volver a descargarlo?",
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
        name: user?.name || "Cliente",
        email: user?.email || "N/A",
      },
      worker: {
        name: req.worker.name,
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

  const tableColumns = [
    {
      key: "worker",
      header: "Trabajador",
      accessor: "worker.name",
      sortable: true,
      render: (row) => (
        <div className="user-cell">
          <img
            src={row.worker.photo || "/assets/default-avatar.png"}
            alt={row.worker.name}
            className="user-photo"
            onError={(e) => (e.target.src = "/assets/default-avatar.png")}
          />
          <span className="worker-name">{row.worker.name}</span>
        </div>
      ),
    },
    {
      key: "service",
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
          {" "}
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
      key: "date",
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
      <div className="budget-requests-page sent">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Presupuestos", path: "/dashboard/hires" },
            { label: "Enviadas", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-paper-plane"></i>
          Mis Solicitudes de Presupuesto
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
      <div className="budget-requests-page sent">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Presupuestos", path: "/dashboard/hires" },
            { label: "Enviadas", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-paper-plane"></i>
          Mis Solicitudes de Presupuesto
        </h2>

        <div className="search-bar-container">
          <div className="search-bar">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por trabajador, servicio, estado..."
              value={""}
              onChange={() => {}}
              aria-label="Buscar solicitudes"
            />
            {"" && (
              <button
                className="clear-search"
                onClick={() => {}}
                aria-label="Limpiar búsqueda"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        <div className="requests-cards-list">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              onViewResponse={handleViewResponse}
              onGeneratePDF={() => handleGeneratePDF(req)}
              hasGeneratedPDF={generatedPDFs.has(req._id)}
            />
          ))}
        </div>

        {/* Modales */}
        {responseModal && (
          <Modal
            isOpen={true}
            onClose={() => setResponseModal(null)}
            title={responseModal.title || "Presupuesto recibido"}
            size="lg"
            closeOnEscape
            closeOnOverlayClick
          >
            <div className="budget-response-content">
              {responseModal.showDownloadButton ? (
                <>
                  <p>{responseModal.message}</p>
                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => setResponseModal(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-accept"
                      onClick={() => {
                        // Generar PDF nuevamente
                        if (responseModal.request) {
                          handleGeneratePDF(responseModal.request);
                          setResponseModal(null);
                        }
                      }}
                    >
                      ✅ Descargar nuevamente
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
                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => setResponseModal(null)}
                    >
                      Cerrar
                    </button>
                    <button
                      className="btn-chat"
                      onClick={() => handleOpenChatModal(responseModal)}
                    >
                      📩 Solicitar chat
                    </button>
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptBudget(responseModal)}
                    >
                      ✅ Aceptar presupuesto
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}

        {chatModal && (
          <Modal
            isOpen={true}
            onClose={() => setChatModal(null)}
            title={`Chatear con ${chatModal.worker.name}`}
            size="md"
            closeOnEscape
            closeOnOverlayClick
          >
            <div className="chat-start-form">
              <div className="form-group">
                <label>Mensaje inicial</label>
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setChatModal(null)}>
                  Cancelar
                </button>
                <button className="btn-send" onClick={handleStartChat}>
                  Iniciar conversación
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Vista desktop: usar DataTable
  return (
    <div className="budget-requests-page sent">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Presupuestos", path: "/dashboard/hires" },
          { label: "Enviadas", active: true },
        ]}
      />
      <h2 className="page-title">
        <i className="fas fa-paper-plane"></i>
        Mis Solicitudes de Presupuesto
      </h2>

      <DataTable
        data={requests}
        columns={tableColumns}
        actions={tableActions}
        initialSort={{ key: "date", direction: "desc" }}
        itemsPerPage={6}
        enableSearch={true}
        searchPlaceholder="Buscar por trabajador, servicio, estado..."
        emptyStateText="No has enviado solicitudes"
        className="budget-requests-table"
      />

      {/* Modales */}
      {responseModal && (
        <Modal
          isOpen={true}
          onClose={() => setResponseModal(null)}
          title={responseModal.title || "Presupuesto recibido"}
          size="lg"
          closeOnEscape
          closeOnOverlayClick
        >
          <div className="budget-response-content">
            {responseModal.showDownloadButton ? (
              <>
                <p>{responseModal.message}</p>
                <div className="modal-actions">
                  <button type="button" onClick={() => setResponseModal(null)}>
                    Cancelar
                  </button>
                  <button
                    className="btn-accept"
                    onClick={() => {
                      // Generar PDF nuevamente
                      if (responseModal.request) {
                        handleGeneratePDF(responseModal.request);
                        setResponseModal(null);
                      }
                    }}
                  >
                    ✅ Descargar nuevamente
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
                <div className="modal-actions">
                  <button type="button" onClick={() => setResponseModal(null)}>
                    Cerrar
                  </button>
                  <button
                    className="btn-chat"
                    onClick={() => handleOpenChatModal(responseModal)}
                  >
                    📩 Solicitar chat
                  </button>
                  <button
                    className="btn-accept"
                    onClick={() => handleAcceptBudget(responseModal)}
                  >
                    ✅ Aceptar presupuesto
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {chatModal && (
        <Modal
          isOpen={true}
          onClose={() => setChatModal(null)}
          title={`Chatear con ${chatModal.worker.name}`}
          size="md"
          closeOnEscape
          closeOnOverlayClick
        >
          <div className="chat-start-form">
            <div className="form-group">
              <label>Mensaje inicial</label>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows="4"
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setChatModal(null)}>
                Cancelar
              </button>
              <button className="btn-send" onClick={handleStartChat}>
                Iniciar conversación
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BudgetRequestsSent;
