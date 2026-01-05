// src/components/layout/Navbar.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthProvider";
import SearchBar from "../ui/SearchBar";
import Modal from "../ui/Modal";
import { ToastContext } from "../../context/ToastContext";
import "./Navbar.css";

const Navbar = ({ isDashboard = false, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { success } = useContext(ToastContext);
  const { notifications, unreadCount, markAsRead, loading } =
    useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const bellRef = useRef(null);
  const userMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      if (
        !isDashboard &&
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDashboard, isMobileMenuOpen]);

  const toggleNotifications = (e) => {
    e.preventDefault();
    if (unreadCount > 0 && !showNotifications) {
      markAsRead();
    }
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const toggleUserMenu = (e) => {
    e.preventDefault();
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const handleNotificationClick = (e, link) => {
    e.preventDefault();
    setShowNotifications(false);
    navigate(link);
  };

  const getLink = (n) => {
    switch (n.onModel) {
      case "Review":
        return `/worker/${n.relatedId}`;
      case "Message":
        return `/dashboard/messages`;
      case "Hire":
        return `/dashboard/hires`;
      default:
        return "/dashboard/notifications";
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    const userName = user?.name?.split(" ")[0] || "usuario";
    logout();
    success("Hasta pronto", `Hasta pronto, ${userName} 👋`, 3000);
    setShowLogoutModal(false);
    setShowUserMenu(false);
    if (!isDashboard) setIsMobileMenuOpen(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleHamburgerClick = () => {
    if (isDashboard && toggleSidebar) {
      toggleSidebar();
    } else {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
  };

  const getMobileMenuItems = () => {
    const items = [
      { path: "/", label: "Inicio", icon: "fa-home" },
      {
        path: "/dashboard/search",
        label: "Buscar trabajador",
        icon: "fa-search",
      },
      {
        path: "/dashboard/hires",
        label: "Mis contrataciones",
        icon: "fa-handshake",
      },
      { path: "/dashboard/messages", label: "Mensajes", icon: "fa-envelope" },
      {
        path: "/dashboard/documents",
        label: "Contratos",
        icon: "fa-file-invoice",
      },
      ...(user?.role === "worker"
        ? [
            {
              path: "/dashboard/worker",
              label: "Dashboard",
              icon: "fa-chart-line",
            },
            { path: "/dashboard/reviews", label: "Reseñas", icon: "fa-star" },
            {
              path: "/dashboard/subscription",
              label: "Suscripción",
              icon: "fa-crown",
            },
          ]
        : []),
      {
        path: "/dashboard/notifications",
        label: "Notificaciones",
        icon: "fa-bell",
      },
      { path: "/dashboard/profile", label: "Perfil", icon: "fa-user" },
      { path: "/dashboard/settings", label: "Configuración", icon: "fa-cog" },
    ];

    if (user?.role === "superadmin") {
      items.push({
        path: "/dashboard/admin",
        label: "Panel de Administración",
        icon: "fa-cogs",
      });
    }

    return items;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.jpeg" alt="Bilca" className="logo-img" />
          </Link>

          <div className="nav-search">{!isDashboard && <SearchBar />}</div>

          <div className="nav-auth">
            {user ? (
              <>
                <button
                  ref={bellRef}
                  className="notification-btn"
                  onClick={toggleNotifications}
                  aria-label={`Tienes ${unreadCount} notificaciones no leídas`}
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="badge">{unreadCount}</span>
                  )}
                </button>

                <div
                  ref={notificationsRef}
                  className={`dropdown-menu notifications-dropdown ${
                    showNotifications ? "show" : ""
                  }`}
                >
                  <div className="dropdown-header">
                    <h4>Notificaciones</h4>
                  </div>
                  <div className="dropdown-body">
                    {loading ? (
                      <p className="loading">Cargando...</p>
                    ) : recentNotifications.length === 0 ? (
                      <p className="empty">No tienes notificaciones</p>
                    ) : (
                      recentNotifications.map((n) => (
                        <a
                          key={n._id}
                          href={getLink(n)}
                          className={`notification-item ${
                            n.read ? "read" : "unread"
                          } ${n.read ? "" : "bold"}`}
                          onClick={(e) =>
                            handleNotificationClick(e, getLink(n))
                          }
                        >
                          <p>{n.message}</p>
                          <small>
                            {new Date(n.createdAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </a>
                      ))
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <Link
                      to="/dashboard/notifications"
                      className="view-all"
                      onClick={() => setShowNotifications(false)}
                    >
                      Ver todas
                    </Link>
                  </div>
                </div>

                <div
                  ref={userMenuButtonRef}
                  className="user-menu-trigger"
                  onClick={toggleUserMenu}
                >
                  <img
                    src={user.photo || "/assets/default-avatar.png"}
                    alt="Perfil"
                    className="nav-user-photo"
                  />
                  <span className="nav-user-name">Hola, {user.name}</span>
                  <i className="fas fa-chevron-down"></i>
                </div>

                <div
                  ref={userMenuRef}
                  className={`dropdown-menu user-dropdown ${
                    showUserMenu ? "show" : ""
                  }`}
                >
                  <div className="dropdown-body">
                    <Link
                      to="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-tachometer-alt"></i> Panel de control
                    </Link>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-user"></i> Perfil
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-cog"></i> Configuración
                    </Link>
                    <Link
                      to="/dashboard/messages"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-envelope"></i> Mensajes
                    </Link>

                    {/* ✅ NUEVO: Enlace a Suscripción para trabajadores */}
                    {user.role === "worker" && (
                      <Link
                        to="/dashboard/subscription"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <i className="fas fa-crown"></i> Suscripción
                      </Link>
                    )}

                    {/* Panel de administración para superadmin */}
                    {user.role === "superadmin" && (
                      <Link
                        to="/dashboard/admin"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <i className="fas fa-cogs"></i> Panel de Administración
                      </Link>
                    )}

                    <button onClick={openLogoutModal}>
                      <i className="fas fa-sign-out-alt"></i> Salir
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-outline">
                  Registrarse
                </Link>
                <Link to="/login" className="btn btn-primary">
                  Iniciar sesión
                </Link>
              </>
            )}

            <button
              className="hamburger"
              onClick={handleHamburgerClick}
              aria-label="Menú"
            >
              <i
                className={`fas ${
                  isDashboard
                    ? "fa-bars"
                    : isMobileMenuOpen
                    ? "fa-times"
                    : "fa-bars"
                }`}
              ></i>
            </button>
          </div>
        </div>

        {/* Menú móvil solo en páginas NO dashboard */}
        {!isDashboard && isMobileMenuOpen && (
          <div className="mobile-menu-overlay">
            <div ref={mobileMenuRef} className="mobile-menu">
              <div className="mobile-menu-header">
                <h3>Menú</h3>
                <button onClick={closeMobileMenu} className="close-btn">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <nav className="mobile-nav">
                {user ? (
                  <>
                    {getMobileMenuItems().map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className="mobile-nav-link"
                      >
                        <i className={`fas ${item.icon}`}></i> {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        openLogoutModal();
                      }}
                    >
                      <i className="fas fa-sign-out-alt"></i> Salir
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/register" onClick={closeMobileMenu}>
                      <i className="fas fa-id-card"></i> Registrarse
                    </Link>
                    <Link to="/login" onClick={closeMobileMenu}>
                      <i className="fas fa-sign-in-alt"></i> Iniciar sesión
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}
      </nav>

      <Modal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        title="Cerrar sesión"
        size="sm"
        closeOnEscape
        closeOnOverlayClick
      >
        <p style={{ margin: "1rem 0", lineHeight: "1.6" }}>
          ¿Estás seguro de que deseas cerrar tu sesión?
          <strong
            style={{ display: "block", marginTop: "0.5rem", color: "#d32f2f" }}
          >
            Perderás el acceso temporal al panel de control.
          </strong>
        </p>
        <div
          className="modal-actions"
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
            marginTop: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={cancelLogout}
            style={{
              background: "#6c757d",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmLogout}
            style={{
              background: "#dc3545",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Sí, cerrar sesión
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
