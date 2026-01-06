// src/components/dashboard/AllNotificationsPage.js
import React, { useContext, useState, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { ToastContext } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthProvider";
import Breadcrumb from "../ui/Breadcrumb";
import "./AllNotificationsPage.css";

const AllNotificationsPage = () => {
  const {
    notifications,
    markAsRead,
    deleteNotifications,
    deleteAllNotifications,
    loading: loadingNotifications,
    unreadCount,
  } = useNotifications();
  const { success, error, showConfirm } = useContext(ToastContext);
  const { user } = useAuth();

  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [removing, setRemoving] = useState(new Set());

  // ✅ Eliminado currentPage y paginación local
  // ✅ Usar notificaciones ya paginadas del contexto

  const groupByDate = (notifs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return notifs.reduce(
      (groups, n) => {
        const date = new Date(n.createdAt);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
          groups.today.push(n);
        } else if (date.getTime() === yesterday.getTime()) {
          groups.yesterday.push(n);
        } else if (date > weekAgo) {
          groups.thisWeek.push(n);
        } else {
          groups.older.push(n);
        }

        return groups;
      },
      { today: [], yesterday: [], thisWeek: [], older: [] }
    );
  };

  const grouped = groupByDate(notifications);
  const allItems = [
    ...grouped.today,
    ...grouped.yesterday,
    ...grouped.thisWeek,
    ...grouped.older,
  ];

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    if (selectAll || selected.size > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map((n) => n._id)));
    }
    setSelectAll(!selectAll);
  };

  const markSelectedAsRead = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    try {
      await markAsRead(ids);
      success("Notificaciones", "Marcadas como leídas");
      setSelected(new Set());
      setSelectAll(false);
    } catch (err) {
      error("Notificaciones", "Error al marcar como leídas");
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAsRead();
      success("Notificaciones", "Todas marcadas como leídas");
      setSelected(new Set());
      setSelectAll(false);
    } catch (err) {
      error("Notificaciones", "Error al marcar todas como leídas");
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    showConfirm(
      "Eliminar notificaciones",
      `¿Eliminar ${ids.length} notificación(es)?`,
      async () => {
        ids.forEach((id) => setRemoving((prev) => new Set([...prev, id])));

        try {
          await deleteNotifications(ids);
          success("Notificaciones", "Eliminadas correctamente");
          setSelected(new Set());
          setSelectAll(false);

          setTimeout(() => {
            ids.forEach((id) =>
              setRemoving((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              })
            );
          }, 300);
        } catch (err) {
          error("Notificaciones", "Error al eliminar");
        }
      }
    );
  };

  const deleteAll = async () => {
    showConfirm(
      "Eliminar todas",
      "¿Eliminar todas las notificaciones? Esta acción no se puede deshacer.",
      async () => {
        try {
          await deleteAllNotifications();
          success("Notificaciones", "Todas eliminadas");
          setSelected(new Set());
          setSelectAll(false);
        } catch (err) {
          error("Notificaciones", "Error al eliminar todas");
        }
      }
    );
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

  if (loadingNotifications) {
    return (
      <div className="notifications-page">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Notificaciones", active: true },
          ]}
        />
        <div className="welcome-card">
          <h1>Cargando notificaciones...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Notificaciones", active: true },
        ]}
      />

      <div className="welcome-card">
        <h1>Notificaciones</h1>
        <p>
          Tienes <strong>{notifications.length}</strong> notificación
          {notifications.length !== 1 ? "es" : ""}.{" "}
          {selected.size > 0 && `Seleccionaste ${selected.size}.`}
        </p>
      </div>

      <div className="page-actions">
        {selected.size > 0 ? (
          <>
            <button onClick={markSelectedAsRead} className="btn-action read">
              Marcar como leído
            </button>
            <button onClick={deleteSelected} className="btn-action delete">
              Eliminar seleccionadas
            </button>
          </>
        ) : (
          <>
            <button onClick={markAllAsRead} className="btn-mark-all">
              Marcar todo como leído
            </button>
            {notifications.length > 0 && (
              <button onClick={deleteAll} className="btn-action delete-small">
                Eliminar todas
              </button>
            )}
          </>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="select-all-row">
          <label>
            <input
              type="checkbox"
              checked={
                selectAll ||
                (selected.size > 0 && selected.size === notifications.length)
              }
              onChange={toggleSelectAll}
            />
            <span>Seleccionar todo</span>
          </label>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-bell-slash"></i>
          <p>No tienes notificaciones.</p>
        </div>
      ) : (
        <>
          {grouped.today.length > 0 && (
            <div className="notification-group">
              <h5 className="group-header">Hoy</h5>
              {grouped.today.map((n) => {
                const link = getLink(n);
                const isSelected = selected.has(n._id);
                const isRemoving = removing.has(n._id);
                return (
                  <a
                    key={n._id}
                    href={link}
                    className={`notification-card ${
                      n.read ? "read" : "unread"
                    } ${isSelected ? "selected" : ""} ${
                      isRemoving ? "removing" : ""
                    }`}
                  >
                    <div
                      className="notification-checkbox"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(n._id);
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly />
                    </div>
                    <div className="notification-content">
                      <p>{n.message}</p>
                      <small>
                        {new Date(n.createdAt).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    {!n.read && <div className="dot"></div>}
                    <div
                      className="delete-icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showConfirm(
                          "Eliminar notificación",
                          "¿Eliminar esta notificación?",
                          async () => {
                            setRemoving((prev) => new Set([...prev, n._id]));
                            try {
                              await deleteNotifications([n._id]);
                            } catch (err) {
                              error("Error", "No se pudo eliminar");
                            }
                          }
                        );
                      }}
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {grouped.yesterday.length > 0 && (
            <div className="notification-group">
              <h5 className="group-header">Ayer</h5>
              {grouped.yesterday.map((n) => {
                const link = getLink(n);
                const isSelected = selected.has(n._id);
                const isRemoving = removing.has(n._id);
                return (
                  <a
                    key={n._id}
                    href={link}
                    className={`notification-card ${
                      n.read ? "read" : "unread"
                    } ${isSelected ? "selected" : ""} ${
                      isRemoving ? "removing" : ""
                    }`}
                  >
                    <div
                      className="notification-checkbox"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(n._id);
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly />
                    </div>
                    <div className="notification-content">
                      <p>{n.message}</p>
                      <small>
                        {new Date(n.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </small>
                    </div>
                    {!n.read && <div className="dot"></div>}
                    <div
                      className="delete-icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showConfirm(
                          "Eliminar notificación",
                          "¿Eliminar esta notificación?",
                          async () => {
                            setRemoving((prev) => new Set([...prev, n._id]));
                            try {
                              await deleteNotifications([n._id]);
                            } catch (err) {
                              error("Error", "No se pudo eliminar");
                            }
                          }
                        );
                      }}
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {grouped.thisWeek.length > 0 && (
            <div className="notification-group">
              <h5 className="group-header">Esta semana</h5>
              {grouped.thisWeek.map((n) => {
                const link = getLink(n);
                const isSelected = selected.has(n._id);
                const isRemoving = removing.has(n._id);
                return (
                  <a
                    key={n._id}
                    href={link}
                    className={`notification-card ${
                      n.read ? "read" : "unread"
                    } ${isSelected ? "selected" : ""} ${
                      isRemoving ? "removing" : ""
                    }`}
                  >
                    <div
                      className="notification-checkbox"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(n._id);
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly />
                    </div>
                    <div className="notification-content">
                      <p>{n.message}</p>
                      <small>
                        {new Date(n.createdAt).toLocaleDateString("es-ES", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                      </small>
                    </div>
                    {!n.read && <div className="dot"></div>}
                    <div
                      className="delete-icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showConfirm(
                          "Eliminar notificación",
                          "¿Eliminar esta notificación?",
                          async () => {
                            setRemoving((prev) => new Set([...prev, n._id]));
                            try {
                              await deleteNotifications([n._id]);
                            } catch (err) {
                              error("Error", "No se pudo eliminar");
                            }
                          }
                        );
                      }}
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {grouped.older.length > 0 && (
            <div className="notification-group">
              <h5 className="group-header">Más antiguas</h5>
              {grouped.older.map((n) => {
                const link = getLink(n);
                const isSelected = selected.has(n._id);
                const isRemoving = removing.has(n._id);
                return (
                  <a
                    key={n._id}
                    href={link}
                    className={`notification-card ${
                      n.read ? "read" : "unread"
                    } ${isSelected ? "selected" : ""} ${
                      isRemoving ? "removing" : ""
                    }`}
                  >
                    <div
                      className="notification-checkbox"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(n._id);
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly />
                    </div>
                    <div className="notification-content">
                      <p>{n.message}</p>
                      <small>
                        {new Date(n.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </small>
                    </div>
                    {!n.read && <div className="dot"></div>}
                    <div
                      className="delete-icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showConfirm(
                          "Eliminar notificación",
                          "¿Eliminar esta notificación?",
                          async () => {
                            setRemoving((prev) => new Set([...prev, n._id]));
                            try {
                              await deleteNotifications([n._id]);
                            } catch (err) {
                              error("Error", "No se pudo eliminar");
                            }
                          }
                        );
                      }}
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllNotificationsPage;
