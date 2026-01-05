// src/components/dashboard/InvoicesSent.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthProvider";
import Breadcrumb from "../ui/Breadcrumb";
import DataTable from "../ui/DataTable";
import "./InvoicesSent.css";

const InvoicesSent = () => {
  const { success, error: showError } = useContext(ToastContext);
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await API.get("/invoices/sent");
        setInvoices(Array.isArray(res.data.invoices) ? res.data.invoices : []);
      } catch (err) {
        console.error("Error al cargar facturas:", err);
        showError("No se pudieron cargar las facturas");
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "worker") {
      fetchInvoices();
    }
  }, [showError, user]);

  const handleSendInvoice = async (invoice) => {
    try {
      await API.post("/invoices/send", { invoiceId: invoice._id });
      success("Factura enviada", "La factura fue enviada por email.");

      // Actualizar estado localmente
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === invoice._id
            ? { ...inv, status: "sent", sentAt: new Date() }
            : inv
        )
      );
    } catch (err) {
      showError("Error", "No se pudo enviar la factura.");
    }
  };

  const tableColumns = [
    {
      key: "client",
      header: "Cliente",
      accessor: "client.name",
      render: (row) => (
        <div className="user-cell">
          <img
            src={row.client?.photo || "/assets/default-avatar.png"}
            alt={row.client?.name}
            className="user-photo"
            onError={(e) => (e.target.src = "/assets/default-avatar.png")}
          />
          <span className="client-name">{row.client?.name}</span>
        </div>
      ),
    },
    {
      key: "job",
      header: "Trabajo",
      accessor: "hire.service",
      render: (row) => row.hire?.service || "Servicio no especificado",
    },
    {
      key: "invoiceNumber",
      header: "N° Factura",
      accessor: "invoiceNumber",
    },
    {
      key: "amount",
      header: "Monto",
      accessor: "totalAmount",
      render: (row) => `$${parseFloat(row.totalAmount).toFixed(2)}`,
    },
    {
      key: "dueDate",
      header: "Vencimiento",
      accessor: "dueDate",
      render: (row) =>
        new Date(row.dueDate).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
        }),
    },
    {
      key: "status",
      header: "Estado",
      accessor: "status",
      render: (row) => {
        const statusMap = {
          draft: "Borrador",
          sent: "Enviada",
          viewed: "Vista",
          paid: "Pagada",
          overdue: "Vencida",
          cancelled: "Cancelada",
        };
        const statusClass = {
          draft: "draft",
          sent: "sent",
          viewed: "viewed",
          paid: "paid",
          overdue: "overdue",
          cancelled: "cancelled",
        };
        return (
          <span
            className={`status-badge ${statusClass[row.status] || "draft"}`}
          >
            {statusMap[row.status] || "Desconocido"}
          </span>
        );
      },
    },
  ];

  const tableActions = [
    {
      key: "send",
      label: "Enviar factura",
      icon: "fas fa-paper-plane",
      className: "btn-send",
      onClick: handleSendInvoice,
      visible: (row) => row.status === "draft",
    },
    {
      key: "view",
      label: "Ver factura",
      icon: "fas fa-eye",
      className: "btn-view",
      onClick: (row) => {
        // Redirigir a PDF o vista detallada
        alert("Vista de factura en desarrollo");
      },
      visible: (row) => row.status !== "draft",
    },
  ];

  if (loading) {
    return (
      <div className="invoices-sent-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Documentos", path: "/dashboard/documents" },
            { label: "Facturas", active: true },
          ]}
        />
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando facturas...</p>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="invoices-sent-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Documentos", path: "/dashboard/documents" },
            { label: "Facturas", active: true },
          ]}
        />
        <div className="empty-state">
          <i className="fas fa-file-invoice"></i>
          <h3>No has creado facturas aún</h3>
          <p>
            Crea facturas para tus trabajos completados y envíalas a tus
            clientes.
          </p>
          <button
            className="btn-create"
            onClick={() => navigate("/dashboard/documents/invoice/new")}
          >
            Crear Factura
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoices-sent-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Documentos", path: "/dashboard/documents" },
          { label: "Facturas", active: true },
        ]}
      />
      <h2 className="page-title">
        <i className="fas fa-file-invoice"></i>
        Facturas Enviadas
      </h2>

      <DataTable
        data={invoices}
        columns={tableColumns}
        actions={tableActions}
        initialSort={{ key: "createdAt", direction: "desc" }}
        itemsPerPage={6}
        enableSearch={true}
        searchPlaceholder="Buscar por cliente o trabajo..."
        emptyStateText="No hay facturas"
        className="invoices-sent-table"
      />
    </div>
  );
};

export default InvoicesSent;
