// frontend/context/NotificationContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import API from "../services/api";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// ✅ Mapeo de tipos de notificación a secciones del dashboard
const NOTIFICATION_TYPE_MAP = {
  budget_request: "budgetRequestsReceived",
  budget_response: "budgetResponses",
  contract_pending: "contractsReceived",
  contract_accepted: "contractsAccepted",
  invoice_sent: "invoicesSent",
  hire: "hiresReceived",
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByType, setUnreadByType] = useState({});
  const [loading, setLoading] = useState(true);

  const getUserFromSession = () => {
    try {
      const userStr = sessionStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("Error al parsear usuario de sessionStorage:", e);
      return null;
    }
  };

  const user = getUserFromSession();
  const userId = user?.id || null;
  const intervalRef = useRef(null);

  const calculateUnreadByType = (notifs) => {
    const countMap = {};
    notifs
      .filter((n) => !n.read)
      .forEach((n) => {
        const dashboardType = NOTIFICATION_TYPE_MAP[n.type];
        if (dashboardType) {
          countMap[dashboardType] = (countMap[dashboardType] || 0) + 1;
        }
      });
    return countMap;
  };

  const loadNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/notifications");
      const notifs = res.data || [];
      setNotifications(notifs);

      const totalUnread = notifs.filter((n) => !n.read).length;
      setUnreadCount(totalUnread);

      const byType = calculateUnreadByType(notifs);
      setUnreadByType(byType);
    } catch (err) {
      console.error("No se pudieron cargar notificaciones", err);
      if ([401, 403].includes(err.response?.status)) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("sessionId");
        window.location.href = "/login";
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
        await API.post("/notifications/read", { ids });
        setNotifications((prev) =>
          prev.map((n) => (ids.includes(n._id) ? { ...n, read: true } : n))
        );
      } else {
        await API.post("/notifications/read");
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }

      loadNotifications();
    } catch (err) {
      console.error("No se pudieron marcar como leídas", err);
    }
  };

  const deleteNotifications = async (ids) => {
    try {
      await API.delete("/notifications", { data: { ids } });
      setNotifications((prev) => prev.filter((n) => !ids.includes(n._id)));
      loadNotifications();
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
      setUnreadByType({});
    } catch (err) {
      console.error("Error al eliminar todas", err);
      throw err;
    }
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const init = async () => {
      await loadNotifications();
      if (userId) {
        intervalRef.current = setInterval(loadNotifications, 30000);
      }
    };

    init();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadByType,
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
