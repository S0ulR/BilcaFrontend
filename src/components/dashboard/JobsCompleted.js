// src/components/dashboard/JobsCompleted.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthProvider";
import Breadcrumb from "../ui/Breadcrumb";
import DataTable from "../ui/DataTable";
import "./JobsCompleted.css";

const JobsCompleted = () => {
  const { success, error: showError } = useContext(ToastContext);
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        // ✅ Usa el endpoint /hires/completed que debes crear en el backend
        const res = await API.get("/hires/completed");
        // El endpoint devuelve { hires: [], pagination: {} }
        setJobs(Array.isArray(res.data.hires) ? res.data.hires : []);
      } catch (err) {
        console.error("Error al cargar trabajos completados:", err);
        showError("No se pudieron cargar los trabajos completados");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchJobs();
    }
  }, [showError, user]);

  const tableColumns = [
    {
      key: "worker",
      header: "Trabajador",
      accessor: "worker.name",
      render: (row) => (
        <div className="user-cell">
          <img
            src={row.worker?.photo || "/assets/default-avatar.png"}
            alt={row.worker?.name}
            className="user-photo"
            onError={(e) => (e.target.src = "/assets/default-avatar.png")}
          />
          <span className="worker-name">{row.worker?.name}</span>
        </div>
      ),
    },
    {
      key: "service",
      header: "Servicio",
      accessor: "service",
    },
    {
      key: "description",
      header: "Descripción",
      accessor: "description",
      render: (row) => (
        <div className="desc" title={row.description}>
          {row.description?.length > 80
            ? `${row.description.substring(0, 80)}...`
            : row.description || "Sin descripción"}
        </div>
      ),
    },
    {
      key: "completedAt",
      header: "Fecha de finalización",
      accessor: "completedAt",
      render: (row) =>
        row.completedAt
          ? new Date(row.completedAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "No especificada",
    },
    {
      key: "rating",
      header: "Calificación",
      accessor: "review.rating",
      render: (row) => (
        <span className="rating-cell">
          {row.review?.rating ? `${row.review.rating}/5` : "Sin calificar"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="jobs-completed-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Trabajos", path: "/dashboard/hires" },
            { label: "Completados", active: true },
          ]}
        />
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando trabajos completados...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="jobs-completed-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Trabajos", path: "/dashboard/hires" },
            { label: "Completados", active: true },
          ]}
        />
        <div className="empty-state">
          <i className="fas fa-trophy"></i>
          <h3>No hay trabajos completados aún</h3>
          <p>Una vez que finalices un servicio, aparecerá aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-completed-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Trabajos", path: "/dashboard/hires" },
          { label: "Completados", active: true },
        ]}
      />
      <h2 className="page-title">
        <i className="fas fa-trophy"></i>
        Trabajos Completados
      </h2>

      <DataTable
        data={jobs}
        columns={tableColumns}
        initialSort={{ key: "completedAt", direction: "desc" }}
        itemsPerPage={6}
        enableSearch={false}
        emptyStateText="No hay trabajos completados"
        className="jobs-completed-table"
      />
    </div>
  );
};

export default JobsCompleted;
