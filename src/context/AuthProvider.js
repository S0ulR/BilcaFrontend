// src/context/AuthProvider.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [sessionId, setSessionId] = useState(null); 
  const [inactivityTimeout, setInactivityTimeout] = useState(null);
  const navigate = useNavigate();

  // Reiniciar temporizador de inactividad
  const resetInactivityTimer = () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    const timer = setTimeout(() => {
      alert("Sesión cerrada por inactividad. Por seguridad, por favor vuelve a iniciar sesión.");
      handleLogout();
    }, 24 * 60 * 60 * 1000); // 24 horas
    setInactivityTimeout(timer);
  };

  // Escuchar eventos de inactividad
  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "keydown"];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer(); // Iniciar el temporizador al cargar

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
    };
  }, [inactivityTimeout]);

  // Verificar sesión guardada
  useEffect(() => {
    const checkSession = async () => {
      const token = sessionStorage.getItem("token");
      const userStr = sessionStorage.getItem("user");
      const sid = sessionStorage.getItem("sessionId"); 

      if (token && userStr && sid) {
        try {
          const res = await API.get("/auth/validate-token", {
            headers: { Authorization: `Bearer ${token}`, "x-session-id": sid },
          });

          if (res.status === 401) throw new Error("Sesión inválida");

          const parsedUser = JSON.parse(userStr);
          setUser(parsedUser);
          setToken(token);
          setSessionId(sid); 
        } catch (err) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("sessionId"); 
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = (userData, token, sessionId) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("sessionId", sessionId);
    setUser(userData);
    setToken(token);
    setSessionId(sessionId); 
  };

  const handleLogout = () => {
    // Hacer logout en backend
    if (token) {
      API.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}`, "x-session-id": sessionId }
      }).catch(err => console.error("Error al cerrar sesión en backend:", err));
    }

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionId");
    setUser(null);
    setToken(null);
    setSessionId(null); 
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    navigate("/", { replace: true });
  };

  const logout = () => {
    handleLogout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sessionId }}> 
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};
