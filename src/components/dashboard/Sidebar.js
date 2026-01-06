// src/components/layout/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useNotifications } from "../../context/NotificationContext";
import "../layout/DashboardLayout.css";

const Sidebar = ({ onLogout, isOpen, toggle }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const menuItems = [
    {
      path: "/dashboard/search",
      icon: "fas fa-search",
      label: "Buscar trabajador",
    },
    {
      path: "/dashboard/hires",
      icon: "fas fa-handshake",
      label: "Mis contrataciones",
    },
    { path: "/dashboard/messages", icon: "fas fa-envelope", label: "Mensajes" },
    {
      path: "/dashboard/documents",
      icon: "fas fa-file-invoice",
      label: "Contratos",
    },
    ...(user?.role === "worker"
      ? [
          {
            path: "/dashboard/worker",
            icon: "fas fa-chart-line",
            label: "Dashboard",
          },
          { path: "/dashboard/reviews", icon: "fas fa-star", label: "Reseñas" },
          {
            path: "/dashboard/subscription",
            icon: "fas fa-crown",
            label: "Suscripción",
          },
        ]
      : []),
    {
      path: "/dashboard/notifications",
      icon: "fas fa-bell",
      label: "Notificaciones",
      badge: unreadCount,
    },
    { path: "/dashboard/profile", icon: "fas fa-user", label: "Perfil" },
    { path: "/dashboard/settings", icon: "fas fa-cog", label: "Configuración" },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      toggle();
    }
  };

  return (
    <>
      <div className="sidebar-header">
        <div className="logo">
          <img src="/logoFO.jpeg" alt="Bilca" className="logo-img" />
        </div>
        <button
          onClick={toggle}
          className="collapse-btn"
          aria-label="Toggle menu"
        >
          <i
            className={`fas ${isOpen ? "fa-chevron-left" : "fa-chevron-right"}`}
          ></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-item">
              <Link
                to={item.path}
                className="sidebar-link"
                onClick={handleLinkClick}
              >
                <i className={item.icon}></i>
                {isOpen && <span className="label">{item.label}</span>}
                {!isOpen && <span className="tooltip">{item.label}</span>}
                {item.badge > 0 && <span className="badge">{item.badge}</span>}
              </Link>
            </li>
          ))}
          <li className="sidebar-item">
            <button onClick={onLogout} className="sidebar-link" type="button">
              <i className="fas fa-sign-out-alt"></i>
              {isOpen && <span className="label">Salir</span>}
              {!isOpen && <span className="tooltip">Salir</span>}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
