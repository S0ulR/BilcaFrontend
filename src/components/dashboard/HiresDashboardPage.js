// src/components/dashboard/HiresDashboardPage.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../context/AuthProvider";
import { useNotifications } from "../../context/NotificationContext";
import Breadcrumb from "../ui/Breadcrumb";
import "./HiresDashboardPage.css";

const HiresDashboardPage = () => {
  const [counts, setCounts] = useState({
    // Como prestador (worker)
    receivedBudgetRequests: 0, // Presupuestos recibidos (pendientes)
    sentBudgets: 0, // Presupuestos enviados (respondidos)
    receivedContracts: 0, // Contratos recibidos (pendientes)
    sentInvoices: 0, // Facturas enviadas

    // Como solicitante (user/worker)
    sentBudgetRequests: 0, // Presupuestos enviados (pendientes)
    receivedBudgets: 0, // Presupuestos recibidos (respondidos)
    sentContracts: 0, // Contratos enviados (pendientes/rechazados)
    acceptedContracts: 0, // Contratos aceptados
    completedJobs: 0, // Trabajos completados
  });

  const { unreadByType } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // === PRESUPUESTOS ===
        // Presupuestos recibidos (solo worker)
        let receivedBudgetRequests = 0;
        if (user?.role === "worker") {
          const receivedBudgetsRes = await API.get("/budget-requests/received");
          const receivedBudgets = Array.isArray(receivedBudgetsRes.data)
            ? receivedBudgetsRes.data
            : [];
          receivedBudgetRequests = receivedBudgets.filter(
            (r) => r.status === "pendiente"
          ).length;
        }

        // Presupuestos enviados
        const sentBudgetsRes = await API.get("/budget-requests/sent");
        const sentBudgets = Array.isArray(sentBudgetsRes.data)
          ? sentBudgetsRes.data
          : [];
        const sentBudgetRequests = sentBudgets.filter(
          (r) => r.status === "pendiente"
        ).length;
        const receivedBudgets = sentBudgets.filter(
          (r) => r.status === "respondido"
        ).length;
        const sentBudgetsTotal = sentBudgets.filter(
          (r) => r.status === "respondido"
        ).length;

        // === CONTRATOS ===
        const hiresRes = await API.get("/hires");
        const hires = Array.isArray(hiresRes.data)
          ? hiresRes.data
          : hiresRes.data.hires || [];

        // Como prestador (worker): contratos recibidos
        let receivedContracts = 0;
        let sentInvoices = 0;
        if (user?.role === "worker") {
          receivedContracts = hires.filter(
            (h) => h.worker?._id === user.id && h.status === "pendiente"
          ).length;
          sentInvoices = 0; // Pendiente de implementar
        }

        // Como solicitante: contratos enviados, aceptados, completados
        const sentContracts = hires.filter(
          (h) => h.client?._id === user.id && h.status === "pendiente"
        ).length;
        const acceptedContracts = hires.filter(
          (h) => h.client?._id === user.id && h.status === "aceptado"
        ).length;
        const completedJobs = hires.filter(
          (h) => h.client?._id === user.id && h.status === "completado"
        ).length;

        setCounts({
          // Worker
          receivedBudgetRequests,
          sentBudgets: sentBudgetsTotal,
          receivedContracts,
          sentInvoices,

          // User/Worker
          sentBudgetRequests,
          receivedBudgets,
          sentContracts,
          acceptedContracts,
          completedJobs,
        });
      } catch (err) {
        console.error("Error al cargar contadores:", err);
      }
    };

    if (user) fetchCounts();
  }, [user]);

  return (
    <div className="hires-dashboard">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Gestión de Servicios", active: true },
        ]}
      />

      <div className="welcome-card">
        <h1>Gestión Integral de Servicios</h1>
        <p>
          Administra tus solicitudes, presupuestos, contratos y facturas en un
          solo lugar.
        </p>
      </div>

      {/* === Sección: Como Prestador de Servicios (Worker) === */}
      {user?.role === "worker" && (
        <>
          <section className="dashboard-section worker-section">
            <h3 className="section-title">
              <i className="fas fa-tools"></i> Como Prestador de Servicios
            </h3>
            <div className="cards-grid">
              <Link to="/dashboard/budget-requests/received" className="card">
                <div className="card-icon">
                  <i className="fas fa-file-invoice-dollar"></i>
                </div>
                <h3>Presupuestos Solicitados</h3>
                <p>Presupuestos pendientes que te han enviado.</p>
                {unreadByType.budgetRequestsReceived > 0 && (
                  <span className="badge">
                    {unreadByType.budgetRequestsReceived}
                  </span>
                )}
              </Link>
              <Link to="/dashboard/budget-sent" className="card">
                <div className="card-icon">
                  <i className="fas fa-paper-plane"></i>
                </div>
                <h3>Presupuestos Enviados</h3>
                <p>Presupuestos que has respondido a clientes.</p>
                {unreadByType.budgetResponses > 0 && (
                  <span className="badge updated">
                    {unreadByType.budgetResponses}
                  </span>
                )}
              </Link>
              <Link to="/dashboard/hires/worker" className="card">
                <div className="card-icon">
                  <i className="fas fa-file-contract"></i>
                </div>
                <h3>Contratos Recibidos</h3>
                <p>Contratos pendientes para aceptar o rechazar.</p>
                {unreadByType.contractsReceived > 0 && (
                  <span className="badge">
                    {unreadByType.contractsReceived}
                  </span>
                )}
              </Link>
              <Link to="/dashboard/invoices/sent" className="card">
                <div className="card-icon">
                  <i className="fas fa-file-invoice"></i>
                </div>
                <h3>Facturas Enviadas</h3>
                <p>Gestiona tus facturas y pagos pendientes.</p>
                {unreadByType.invoicesSent > 0 && (
                  <span className="badge updated">
                    {unreadByType.invoicesSent}
                  </span>
                )}
              </Link>
            </div>
          </section>

          <div className="divider">
            <span>Interacción con Clientes</span>
          </div>
        </>
      )}

      {/* === Sección: Como Solicitante de Servicios (User/Worker) === */}
      <section className="dashboard-section user-section">
        <h3 className="section-title">
          <i className="fas fa-user-tie"></i> Como Solicitante de Servicios
        </h3>
        <div className="cards-grid">
          <Link to="/dashboard/budget-requests/sent" className="card">
            <div className="card-icon">
              <i className="fas fa-paper-plane"></i>
            </div>
            <h3>Presupuestos Enviados</h3>
            <p>Tus solicitudes de presupuesto pendientes.</p>
            {unreadByType.budgetRequestsReceived > 0 && (
              <span className="badge">
                {unreadByType.budgetRequestsReceived}
              </span>
            )}
          </Link>
          <Link to="/dashboard/budget-responses" className="card">
            <div className="card-icon">
              <i className="fas fa-reply"></i>
            </div>
            <h3>Presupuestos Recibidos</h3>
            <p>Respuestas a tus solicitudes de presupuesto.</p>
            {unreadByType.budgetResponses > 0 && (
              <span className="badge updated">
                {unreadByType.budgetResponses}
              </span>
            )}
          </Link>
          <Link to="/dashboard/hires/user" className="card">
            <div className="card-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <h3>Mis Contrataciones</h3>
            <p>Contratos enviados y en proceso.</p>
            {unreadByType.hiresReceived > 0 && (
              <span className="badge">{unreadByType.hiresReceived}</span>
            )}
          </Link>
          <Link to="/dashboard/contracts/accepted" className="card">
            <div className="card-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>Contratos Aceptados</h3>
            <p>Contratos confirmados y en ejecución.</p>
            {unreadByType.contractsAccepted > 0 && (
              <span className="badge updated">
                {unreadByType.contractsAccepted}
              </span>
            )}
          </Link>
          <Link to="/dashboard/jobs/completed" className="card">
            <div className="card-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <h3>Trabajos Completados</h3>
            <p>Historial de servicios finalizados.</p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HiresDashboardPage;
