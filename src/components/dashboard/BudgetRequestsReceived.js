// src/components/dashboard/BudgetRequestsReceived.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthProvider"; // Nuevo
import Breadcrumb from "../ui/Breadcrumb";
import RequestCard from "../ui/RequestCard";
import DataTable from "../ui/DataTable"; // Importamos el componente DataTable
import useIsMobile from "../../hooks/useIsMobile";
import { generateBudgetPDF } from "../../utils/generateBudgetPDF";
import "./BudgetRequestsReceived.css";

const BudgetRequestsReceived = () => {
  const { success, error: showError } = useContext(ToastContext);
  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ✅ Estado local para rastrear PDFs generados
  const [generatedPDFs, setGeneratedPDFs] = useState(new Set());

  // ✅ Cargar del sessionStorage al iniciar
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("budgetPDFsGenerated");
      if (saved) {
        const ids = new Set(JSON.parse(saved));
        setGeneratedPDFs(ids);
      }
    } catch (err) {
      console.error("Error al cargar PDFs generados:", err);
    }
  }, []);

  // ✅ Guardar en sessionStorage cuando se genere uno nuevo
  const markAsGenerated = (requestId) => {
    setGeneratedPDFs((prev) => {
      const updated = new Set(prev);
      updated.add(requestId);
      try {
        sessionStorage.setItem("budgetPDFsGenerated", JSON.stringify([...updated]));
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
        const res = await API.get("/budget-requests/received");
        setRequests(Array.isArray(res.data) ? res.data : []);
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

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta solicitud?")) return;

    try {
      await API.delete(`/budget-requests/${id}`);
      setRequests((prev) => prev.filter((req) => req._id !== id));
      success("Solicitud eliminada correctamente");

      // Si había un PDF generado, limpiar
      setGeneratedPDFs((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        sessionStorage.setItem("budgetPDFsGenerated", JSON.stringify([...updated]));
        return updated;
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "No se pudo eliminar la solicitud";
      showError(errorMsg);
    }
  };

  // ✅ Generar o ver PDF
  const handleGeneratePDF = (request) => {
    const hasGenerated = generatedPDFs.has(request._id);

    if (hasGenerated) {
      // 📄 Ya fue generado → Simular "ver"
      alert(`Ya descargaste este presupuesto. Puedes volver a descargarlo si lo necesitas.`);
      // Aquí podrías abrir una vista previa si tuvieras almacenamiento en backend
      return;
    }

    // 📥 Primera vez → Generar PDF
    const data = {
      date: new Date().toLocaleDateString("es-AR"),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("es-AR"),
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
      markAsGenerated(request._id); // Marcar como generado
    } catch (err) {
      console.error("Error al generar PDF:", err);
      showError("No se pudo generar el PDF.");
    }
  };

  // Definir columnas para DataTable (adaptadas al estilo de BudgetRequestsSent)
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
      )
    },
    {
      key: "profession",
      header: "Servicio",
      accessor: "profession",
      sortable: true
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
      )
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
      )
    },
    {
      key: "createdAt",
      header: "Fecha",
      accessor: "createdAt",
      sortable: true,
      render: (row) => (
        new Date(row.createdAt).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
        })
      )
    },
    {
      key: "status",
      header: "Estado",
      accessor: "status",
      sortable: true,
      render: (row) => {
        // Verificar que el estado exista y sea válido
        const status = row.status || "pendiente";
        let displayText = "Pendiente";

        if (status === "respondido") {
          displayText = "Respondido";
        } else if (status === "rechazado") {
          displayText = "Rechazado";
        }

        return (
          <span className={`status-badge ${status}`}>
            {displayText}
          </span>
        );
      }
    }
  ];

  // Definir acciones para DataTable (adaptadas al estilo de BudgetRequestsSent)
  const tableActions = [
    {
      key: "respond",
      label: "Responder solicitud", // Etiqueta para el tooltip si se usa
      icon: "fas fa-reply",
      className: "btn-respond", // Clase consistente
      onClick: handleRespond,
      // Solo mostrar si el estado es pendiente
      visible: (row) => row.status === "pendiente"
    },
    {
      key: "pdf",
      label: "Descargar PDF", // Etiqueta genérica
      icon: (row) => generatedPDFs.has(row._id) ? "fas fa-file-alt" : "fas fa-file-pdf", // Ícono dinámico
      className: (row) => generatedPDFs.has(row._id) ? "btn-view" : "btn-pdf", // Clase dinámica
      onClick: (req) => handleGeneratePDF(req)
    },
    {
      key: "delete",
      label: "Eliminar solicitud",
      icon: "fas fa-trash-alt",
      className: "btn-delete", // Clase consistente
      onClick: (req) => handleDelete(req._id)
    }
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
    // Vista móvil: usar cards como antes, pero adaptadas
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
              onRespond={handleRespond}
              onDelete={handleDelete}
              onGeneratePDF={() => handleGeneratePDF(req)}
              hasGeneratedPDF={generatedPDFs.has(req._id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Vista desktop: usar DataTable
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
        initialSort={{ key: "createdAt", direction: "desc" }} // Orden inicial por fecha descendente
        itemsPerPage={itemsPerPage}
        enableSearch={true} // Habilitar búsqueda si es necesario
        searchPlaceholder="Buscar por cliente, servicio, estado..."
        emptyStateText="Actualmente no tienes solicitudes de presupuesto pendientes."
        className="budget-requests-table"
      />
    </div>
  );
};

export default BudgetRequestsReceived;
