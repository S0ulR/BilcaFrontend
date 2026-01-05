// src/components/dashboard/MyHires.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthProvider";
import API from "../../../services/api";
import { ToastContext } from "../../../context/ToastContext";
import Breadcrumb from "../../ui/Breadcrumb";
import DataTable from "../../ui/DataTable";
import useIsMobile from "../../../hooks/useIsMobile";
import "./MyHires.css";

const MyHires = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useContext(ToastContext);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHires = async () => {
      setLoading(true);
      try {
        const res = await API.get("/hires");
        const allHires = Array.isArray(res.data)
          ? res.data
          : res.data.hires || [];

        const userHires = allHires.filter(
          (h) =>
            h.client && h.client._id && h.client._id.trim() === user._id.trim()
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

  // ✅ NUEVO: Cliente confirma finalización del trabajo
  const handleConfirmCompletion = async (hireId) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas confirmar la finalización de este trabajo?"
      )
    ) {
      return;
    }

    try {
      const res = await API.post(`/hires/${hireId}/confirm-completion`);
      const hire = res.data.hire;

      success(
        "Trabajo finalizado",
        "Has confirmado la finalización del trabajo."
      );

      setHires((prev) =>
        prev.map((h) =>
          h._id === hireId
            ? {
                ...h,
                clientCompleted: true,
                status: hire.status,
                completedAt: hire.completedAt,
              }
            : h
        )
      );
    } catch (err) {
      showError(
        "Error",
        err.response?.data?.msg || "No se pudo confirmar la finalización"
      );
    }
  };

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
          <p>
            La gestión de contrataciones está disponible en la vista de
            escritorio.
          </p>
        </div>
      </div>
    );
  }

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
      accessor: "service",
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
      key: "createdAt",
      header: "Solicitud",
      accessor: "createdAt",
      sortable: true,
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "acceptedAt",
      header: "Aceptación",
      accessor: "updatedAt",
      sortable: true,
      render: (row) =>
        row.status === "aceptado"
          ? new Date(row.updatedAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
            })
          : "-",
    },
    {
      key: "completedAt",
      header: "Finalización",
      accessor: "completedAt",
      sortable: true,
      render: (row) =>
        row.completedAt
          ? new Date(row.completedAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
            })
          : "-",
    },
    {
      key: "budget",
      header: "Costo",
      accessor: "budget",
      sortable: true,
      render: (row) => `$${row.budget?.toFixed(2) || "No especificado"}`,
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
      ),
    },
  ];

  // ✅ ACTUALIZADO: Acciones según el estado del trabajo
  const tableActions = [
    {
      key: "view",
      label: "Ver perfil del trabajador",
      icon: "fas fa-user",
      className: "btn-view",
      onClick: (hire) => handleViewProfile(hire.worker._id),
    },
    {
      key: "confirm",
      label: "Confirmar finalización",
      icon: "fas fa-check-circle",
      className: "btn-confirm",
      onClick: (hire) => handleConfirmCompletion(hire._id),
      visible: (row) =>
        row.status === "aceptado" &&
        row.workerCompleted &&
        !row.clientCompleted,
    },
    {
      key: "view",
      label: "Trabajo completado",
      icon: "fas fa-check",
      className: "btn-completed",
      onClick: (hire) => handleViewProfile(hire.worker._id),
      visible: (row) => row.status === "completado",
    },
  ];

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
      <DataTable
        data={hires}
        columns={tableColumns}
        actions={tableActions}
        initialSort={{ key: "createdAt", direction: "desc" }}
        itemsPerPage={5}
        enableSearch={true}
        searchPlaceholder="Buscar por trabajador, servicio, estado..."
        emptyStateText="No has contratado a nadie aún. Busca un trabajador y envía una solicitud para comenzar."
        className="my-hires-table"
      />
    </div>
  );
};

export default MyHires;
