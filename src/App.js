import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "./components/layout/PublicLayout"; 
import DashboardLayout from "./components/layout/DashboardLayout"; 

// Páginas públicas
import Home from "./pages/Home";
import WorkerList from "./pages/WorkerList";
import WorkerProfilePage from "./pages/WorkerProfilePage";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import ForgotPassword from "./components/auth/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./components/auth/ResetPassword";
import Contacto from "./pages/Contact";
import Privcidad from "./pages/Privacy";
import Terminos from "./pages/Terms";
import Sobre from "./pages/AboutUs";

// Admin
import AdminPanel from "./components/admin/AdminPanel";

// Auth guard
import PrivateRoute from "./components/auth/PrivateRoute";
import { useAuth } from "./context/AuthProvider";

import "./App.css";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Cargando...</div>;
  }

  return (
    <Routes>
      {/* === RUTAS PÚBLICAS === */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/workers" element={<WorkerList />} />
        <Route path="/worker/:id" element={<WorkerProfilePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/about" element={<Sobre />} />
        <Route path="/contact" element={<Contacto />} />
        <Route path="/terms" element={<Terminos />} />
        <Route path="/privacy" element={<Privcidad />} />
      </Route>

      {/* === RUTAS PROTEGIDAS (DASHBOARD) === */}
      <Route
        path="dashboard/*"
        element={
          <PrivateRoute>
            <DashboardLayout user={user} />
          </PrivateRoute>
        }
      />

      {/* === ADMIN === */}
      <Route
        path="/admin"
        element={
          user?.role === "admin" ? (
            <AdminPanel />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* === 404 === */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
