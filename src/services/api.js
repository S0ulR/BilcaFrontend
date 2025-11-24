// frontend/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: false,
});

// Interceptor de solicitud
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token"); // Cambiado a sessionStorage
    const sessionId = sessionStorage.getItem("sessionId");

    if (token) {
      config.headers["x-auth-token"] = token;
    }
    if (sessionId) {
      config.headers["x-session-id"] = sessionId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado o sesión inválida
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("sessionId");
      window.location.href = "/login"; // Redirigir
    }
    return Promise.reject(error);
  }
);

export default API;
