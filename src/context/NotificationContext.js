// frontend/context/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import API from "../services/api";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ Cambiado a sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userId = user?.id || null;

  // Usamos ref para mantener la referencia del intervalo
  const intervalRef = useRef(null);

  const loadNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
      const count = res.data.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("No se pudieron cargar notificaciones", err);
      if ([401, 403].includes(err.response?.status)) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('sessionId');
        window.location.href = '/login';
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (ids = null) => {
    if (!ids && unreadCount === 0) return;
    if (ids && ids.length === 0) return;

    try {
      if (ids) {
        // Marcar notificaciones específicas como leídas
        await API.post("/notifications/read", { ids });
        setNotifications((prev) =>
          prev.map((n) => (ids.includes(n._id) ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => 
          prev - ids.filter(id => notifications.find(n => n._id === id && !n.read)).length
        );
      } else {
        // Marcar todas como leídas
        await API.post("/notifications/read");
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("No se pudieron marcar como leídas", err);
    }
  };

  const deleteNotifications = async (ids) => {
    try {
      await API.delete("/notifications", { data: { ids } });
      setNotifications((prev) => prev.filter((n) => !ids.includes(n._id)));
      setUnreadCount(prev => 
        prev - ids.filter(id => notifications.find(n => n._id === id && !n.read)).length
      );
    } catch (err) {
      console.error("Error al eliminar notificaciones", err);
      throw err;
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await API.delete("/notifications/all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error al eliminar todas", err);
      throw err;
    }
  };

  // Efecto con limpieza segura
  useEffect(() => {
    // Si hay un intervalo activo, limpiarlo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const init = async () => {
      await loadNotifications();
      
      if (userId) {
        intervalRef.current = setInterval(async () => {
          try {
            await loadNotifications();
          } catch (err) {
            if ([401, 403].includes(err.response?.status)) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('user');
              sessionStorage.removeItem('sessionId');
              window.location.href = '/login';
            }
          }
        }, 30000); // Cada 30 segundos
      }
    };

    init();

    // Limpieza al desmontar o cambiar userId
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId]); // ✅ Dependencia estable: solo el ID

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        deleteNotifications,
        deleteAllNotifications,
        refresh: loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
