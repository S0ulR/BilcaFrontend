// frontend/services/api.js
import axios from "axios";

let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: false,
  timeout: 8000,
});

API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
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

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // ✅ Solo redirigir en rutas protegidas
      const isProtectedRoute = ![
        "/",
        "/login",
        "/register",
        "/workers",
        "/worker/",
      ].some((path) => currentPath.startsWith(path));

      if (isProtectedRoute) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("sessionId");

        if (logoutCallback) {
          logoutCallback();
        } else {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
