// src/components/dashboard/WorkerHires.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider"; // Nuevo
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import Breadcrumb from "../ui/Breadcrumb";
import DataTable from "../ui/DataTable"; // Importamos el componente DataTable
import useIsMobile from "../../hooks/useIsMobile";
import "./WorkerHires.css";

const WorkerHires = () => {
  const { success, error: showError } = useContext(ToastContext);
  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHires = async () => {
      setLoading(true);
      try {
        const res = await API.get("/hires");
        const allHires = Array.isArray(res.data) ? res.data : res.data.hires || [];

        const workerHires = allHires.filter(
          (h) => h.worker && h.worker._id && h.worker._id.trim() === user._id.trim()
        );

        setHires(workerHires);
      } catch (err) {
        console.error("Error al cargar contrataciones:", err);
        showError("No se pudieron cargar tus contrataciones.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchHires();
  }, [showError, user]);

  const handleUpdateStatus = async (hireId, status) => {
    try {
      const res = await API.put(`/hires/${hireId}/status`, { status });
      const hire = res.data.hire;
      success(
        "Estado actualizado",
        `Contratación ${status === "aceptado" ? "aceptada" : "rechazado"}`
      );
      setHires((prev) =>
        prev.map((h) =>
          h._id === hireId
            ? { ...h, status: hire.status, acceptedAt: hire.updatedAt }
            : h
        )
      );
    } catch (err) {
      showError("Error", err.response?.data?.msg || "No se pudo actualizar el estado");
    }
  };

  // --- ELIMINADA: handleDelete ---
  /*
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta contratación?")) return;

    try {
      await API.delete(`/hires/${id}`);
      setHires((prev) => prev.filter((h) => h._id !== id));
      success("Contratación eliminada correctamente");
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "No se pudo eliminar la contratación";
      showError(errorMsg);
    }
  };
  */
  // --- FIN ELIMINACIÓN ---

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: "Pendiente",
      aceptado: "Aceptado",
      rechazado: "Rechazado",
      completado: "Completado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="worker-hires-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Mis contrataciones", path: "/dashboard/hires" },
            { label: "Como Trabajador", active: true },
          ]}
        />
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando contrataciones...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Vista móvil: Mostrar mensaje o cards personalizadas si es necesario
    // Por ahora, se puede dejar un mensaje indicando que la funcionalidad está en la vista desktop
    // o implementar una vista de tarjetas específica si se desea.
    // Por simplicidad, dejaremos el mensaje.
    return (
      <div className="worker-hires-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Mis contrataciones", path: "/dashboard/hires" },
            { label: "Como Trabajador", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-briefcase"></i>
          Mis Contrataciones como Trabajador
        </h2>
        <div className="mobile-notice">
          <i className="fas fa-info-circle"></i>
          <p>La gestión de contrataciones está disponible en la vista de escritorio.</p>
        </div>
      </div>
    );
  }

  // Definir columnas para DataTable
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
      key: "service",
      header: "Servicio",
      accessor: "service",
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
      key: "createdAt",
      header: "Solicitud",
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
      key: "budget",
      header: "Presupuesto",
      accessor: "budget",
      sortable: true,
      render: (row) => (
        `$${row.budget?.toFixed(2) || "No especificado"}`
      )
    },
    {
      key: "status",
      header: "Estado",
      accessor: "status",
      sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.status}`}>
          {getStatusLabel(row.status)}
        </span>
      )
    }
  ];

  // Definir acciones para DataTable
  // --- MODIFICADO: Eliminada la acción "delete" ---
  const tableActions = [
    {
      key: "accept",
      label: "Aceptar contratación",
      icon: "fas fa-check",
      className: "btn-accept", // Clase para diferenciar
      onClick: (hire) => handleUpdateStatus(hire._id, "aceptado"),
      visible: (row) => row.status === "pendiente" // Solo visible si está pendiente
    },
    {
      key: "reject",
      label: "Rechazar contratación",
      icon: "fas fa-times",
      className: "btn-reject", // Clase para diferenciar
      onClick: (hire) => handleUpdateStatus(hire._id, "rechazado"),
      visible: (row) => row.status === "pendiente" // Solo visible si está pendiente
    },
    // No hay acción de eliminar
  ];
  // --- FIN MODIFICACIÓN ---

  // Vista desktop: usar DataTable
  return (
    <div className="worker-hires-page">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Mis contrataciones", path: "/dashboard/hires" },
          { label: "Como Trabajador", active: true },
        ]}
      />
      {/* Título */}
      <h2 className="page-title">
        <i className="fas fa-briefcase"></i>
        Mis Contrataciones como Trabajador
      </h2>
      {/* DataTable */}
      <DataTable
        data={hires}
        columns={tableColumns}
        actions={tableActions}
        initialSort={{ key: "createdAt", direction: "desc" }}
        itemsPerPage={5} // Mantenemos el mismo número de elementos por página
        enableSearch={true} // Habilitar búsqueda si es necesario
        searchPlaceholder="Buscar por cliente, servicio, estado..."
        emptyStateText="No has sido contratado aún. Espera solicitudes o promociona tus servicios."
        className="worker-hires-table"
      />
    </div>
  );
};

export default WorkerHires;
