// src/components/dashboard/MyHires.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider"; // Nuevo
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import Breadcrumb from "../ui/Breadcrumb";
import DataTable from "../ui/DataTable"; // Importamos el componente DataTable
import useIsMobile from "../../hooks/useIsMobile";
import "./MyHires.css";

const MyHires = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useContext(ToastContext);
  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación
  const isMobile = useIsMobile();

  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHires = async () => {
      setLoading(true);
      try {
        const res = await API.get("/hires");
        const allHires = Array.isArray(res.data) ? res.data : res.data.hires || [];

        const userHires = allHires.filter(
          (h) => h.client && h.client._id && h.client._id.trim() === user._id.trim()
        );

        setHires(userHires);
      } catch (err) {
        console.error("Error al cargar contrataciones:", err);
        showError("No se pudieron cargar tus contrataciones.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchHires();
  }, [showError, user]);

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: "Pendiente",
      aceptado: "Aceptado",
      rechazado: "Rechazado",
      completado: "Completado",
    };
    return labels[status] || status;
  };

  const handleViewProfile = (workerId) => {
    navigate(`/worker/${workerId}`);
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

  if (loading) {
    return (
      <div className="my-hires-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Mis contrataciones", path: "/dashboard/hires" },
            { label: "Como Usuario", active: true },
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
      <div className="my-hires-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Mis contrataciones", path: "/dashboard/hires" },
            { label: "Como Usuario", active: true },
          ]}
        />
        <h2 className="page-title">
          <i className="fas fa-briefcase"></i>
          Mis Contrataciones como Usuario
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
      key: "acceptedAt",
      header: "Aceptación",
      accessor: "updatedAt", // Asumiendo que la fecha de aceptación es updatedAt
      sortable: true,
      render: (row) => (
        row.status === "aceptado"
          ? new Date(row.updatedAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
            })
          : "-"
      )
    },
    {
      key: "budget",
      header: "Costo",
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
      key: "view",
      label: "Ver perfil del trabajador",
      icon: "fas fa-user", // Icono genérico para ver perfil
      className: "btn-view", // Clase para diferenciar
      onClick: (hire) => handleViewProfile(hire.worker._id)
    },
    // No hay acción de eliminar
  ];
  // --- FIN MODIFICACIÓN ---

  // Vista desktop: usar DataTable
  return (
    <div className="my-hires-page">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Mis contrataciones", path: "/dashboard/hires" },
          { label: "Como Usuario", active: true },
        ]}
      />
      {/* Título */}
      <h2 className="page-title">
        <i className="fas fa-briefcase"></i>
        Mis Contrataciones como Usuario
      </h2>
      {/* DataTable */}
      <DataTable
        data={hires}
        columns={tableColumns}
        actions={tableActions}
        initialSort={{ key: "createdAt", direction: "desc" }}
        itemsPerPage={5} // Mantenemos el mismo número de elementos por página
        enableSearch={true} // Habilitar búsqueda si es necesario
        searchPlaceholder="Buscar por trabajador, servicio, estado..."
        emptyStateText="No has contratado a nadie aún. Busca un trabajador y envía una solicitud para comenzar."
        className="my-hires-table"
      />
    </div>
  );
};

export default MyHires;
