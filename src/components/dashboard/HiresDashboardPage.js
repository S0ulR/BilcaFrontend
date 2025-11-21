// src/components/dashboard/HiresDashboardPage.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../context/AuthProvider"; // Nuevo
import Breadcrumb from "../ui/Breadcrumb";
import "./HiresDashboardPage.css";

const HiresDashboardPage = () => {
  const [counts, setCounts] = useState({
    pendingHires: 0,
    updatedHires: 0,
    pendingBudgetRequests: 0,
    sentBudgetsUpdated: 0,
  });

  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Contrataciones
        const hiresRes = await API.get("/hires");
        const hires = Array.isArray(hiresRes.data) ? hiresRes.data : hiresRes.data.hires || [];

        const asWorker = user?.role === "worker";
        const asClient = user?.role === "user";

        const pendingHires = asWorker
          ? hires.filter((h) => h.worker?._id === user.id && h.status === "pendiente")
          : [];

        const updatedHires = asClient
          ? hires.filter((h) => h.client?._id === user.id && h.status !== "pendiente")
          : [];

        // Presupuestos recibidos
        const budgetRequestsRes = await API.get("/budget-requests/received");
        const budgetRequests = Array.isArray(budgetRequestsRes.data)
          ? budgetRequestsRes.data
          : [];
        const pendingBudgetRequests = budgetRequests.filter((r) => r.status === "pendiente");

        // Presupuestos enviados
        const sentBudgetsRes = await API.get("/budget-requests/sent");
        const sentBudgets = Array.isArray(sentBudgetsRes.data) ? sentBudgetsRes.data : [];
        const sentBudgetsUpdated = sentBudgets.filter((r) => r.status === "respondido");

        setCounts({
          pendingHires: pendingHires.length,
          updatedHires: updatedHires.length,
          pendingBudgetRequests: pendingBudgetRequests.length,
          sentBudgetsUpdated: sentBudgetsUpdated.length,
        });
      } catch (err) {
        console.error("Error al cargar contadores:", err);
      }
    };

    if (user) fetchCounts();
  }, [user]);

  return (
    <div className="hires-dashboard">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Contrataciones", active: true },
        ]}
      />

      {/* Encabezado */}
      <div className="welcome-card">
        <h1>Gestiona tus servicios y solicitudes</h1>
        <p>
          Acepta contrataciones, responde presupuestos y sigue el estado de tus trabajos.
        </p>
      </div>

      {/* Sección: Como Prestador */}
      {user?.role === "worker" && (
        <section className="dashboard-section worker-section">
          <h3 className="section-title">
            <i className="fas fa-tools"></i> Como Prestador de Servicios
          </h3>
          <div className="cards-grid">
            <Link to="/dashboard/hires/worker" className="card worker-card">
              <div className="card-icon">
                <i className="fas fa-concierge-bell"></i>
              </div>
              <h3>Mis Servicios</h3>
              <p>
                Gestiona las solicitudes de contratación que recibiste. Acepta, rechaza o inicia nuevos proyectos.
              </p>
              {counts.pendingHires > 0 && (
                <span className="badge">{counts.pendingHires}</span>
              )}
            </Link>

            <Link to="/dashboard/budget-requests/received" className="card budget-received-card">
              <div className="card-icon">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <h3>Presupuestos Solicitados</h3>
              <p>
                Revisa las solicitudes de presupuesto que te han enviado. Responde con una oferta detallada.
              </p>
              {counts.pendingBudgetRequests > 0 && (
                <span className="badge">{counts.pendingBudgetRequests}</span>
              )}
            </Link>
          </div>
        </section>
      )}

      {/* Separador entre roles */}
      {user?.role === "worker" && (
        <div className="divider">
          <span>Servicios y Solicitudes</span>
        </div>
      )}

      {/* Sección: Como Usuario */}
      <section className="dashboard-section user-section">
        <h3 className="section-title">
          <i className="fas fa-user-tie"></i> Como Solicitante de Servicios
        </h3>
        <div className="cards-grid">
          <Link to="/dashboard/hires/user" className="card user-card">
            <div className="card-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <h3>Mis Solicitudes</h3>
            <p>
              Revisa el estado de tus contrataciones: pendientes, aceptadas o completadas.
            </p>
            {counts.updatedHires > 0 && (
              <span className="badge updated">{counts.updatedHires}</span>
            )}
          </Link>

          <Link to="/dashboard/budget-requests/sent" className="card budget-sent-card">
            <div className="card-icon">
              <i className="fas fa-paper-plane"></i>
            </div>
            <h3>Presupuestos Enviados</h3>
            <p>
              Revisa el estado de tus solicitudes de presupuesto. Espera respuesta o sigue tus solicitudes enviadas.
            </p>
            {counts.sentBudgetsUpdated > 0 && (
              <span className="badge updated">{counts.sentBudgetsUpdated}</span>
            )}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HiresDashboardPage;
