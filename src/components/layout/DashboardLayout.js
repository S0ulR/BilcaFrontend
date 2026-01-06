// src/components/layout/DashboardLayout.js
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";

// Componentes
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "../dashboard/Sidebar";

// Páginas — ✅ Organizadas por funcionalidad
import DashboardHome from "../dashboard/DashboardHome";
import SearchWorker from "../dashboard/SearchWorker";
import HiresDashboardPage from "../dashboard/HiresDashboardPage";

// Contrataciones
import WorkerHires from "../dashboard/hires/WorkerHires";
import MyHires from "../dashboard/hires/MyHires";

// Presupuestos
import BudgetRequestsReceived from "../dashboard/budget/BudgetRequestsReceived";
import BudgetRequestsSent from "../dashboard/budget/BudgetRequestsSent";
import BudgetSent from "../dashboard/budget/BudgetSent"; // ✅ Mover a budget/
import BudgetForm from "../dashboard/budget/BudgetForm";

// Documentos
import Documents from "../dashboard/Documents";
import ContractForm from "../dashboard/documents/ContractForm";
import InvoiceForm from "../dashboard/documents/InvoiceForm";

// Otros
import Messages from "../dashboard/Messages";
import OfferService from "../dashboard/OfferService";
import WorkerDashboard from "../dashboard/WorkerDashboard";
import AllReviewsPage from "../dashboard/AllReviewsPage";
import AllNotificationsPage from "../dashboard/AllNotificationsPage";
import ProfilePage from "../dashboard/ProfileForm";
import SettingsPage from "../dashboard/SettingsPage";

// Admin y suscripción
import AdminDashboard from "../admin/AdminDashboard";
import SubscriptionPlans from "../subscription/SubscriptionPlans";
import SubscriptionSuccess from "../subscription/SubscriptionSuccess";

// Componente de protección por rol
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const DashboardLayout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const openMobileMenu = () => {
    setMobileMenuOpen(true);
    document.body.style.overflow = "hidden";
  };
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Navbar user={user} onLogout={onLogout} toggleSidebar={openMobileMenu} />
      <div className="dashboard-body">
        <aside
          className={`sidebar ${sidebarOpen ? "expanded" : "collapsed"} ${
            mobileMenuOpen ? "mobile-open" : ""
          }`}
        >
          <Sidebar
            user={user}
            onLogout={onLogout}
            isOpen={sidebarOpen}
            toggle={toggleSidebar}
          />
        </aside>

        {mobileMenuOpen && (
          <div
            className="sidebar-overlay"
            onClick={closeMobileMenu}
            aria-hidden="true"
          ></div>
        )}

        <main
          className={`dashboard-main ${
            mobileMenuOpen ? "mobile-menu-open" : ""
          }`}
        >
          <div className="dashboard-content">
            <Routes>
              <Route index element={<DashboardHome user={user} />} />
              <Route path="search" element={<SearchWorker />} />

              {/* Presupuestos */}
              <Route
                path="budget-requests/received"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <BudgetRequestsReceived />
                  </ProtectedRoute>
                }
              />
              <Route
                path="budget-requests/sent"
                element={<BudgetRequestsSent />}
              />
              <Route
                path="budget-sent"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <BudgetSent />
                  </ProtectedRoute>
                }
              />
              <Route path="documents/budget" element={<BudgetForm />} />

              {/* Contrataciones */}
              <Route path="hires/*" element={<HiresDashboardPage />} />
              <Route
                path="hires/worker"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <WorkerHires />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hires/user"
                element={
                  <ProtectedRoute allowedRoles={["user", "worker"]}>
                    <MyHires />
                  </ProtectedRoute>
                }
              />

              {/* Documentos */}
              <Route path="documents" element={<Documents />} />
              <Route path="documents/contract" element={<ContractForm />} />
              <Route path="documents/invoice" element={<InvoiceForm />} />

              {/* Otros */}
              <Route path="messages" element={<Messages />} />
              <Route path="offer" element={<OfferService />} />
              <Route
                path="reviews"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <AllReviewsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="notifications" element={<AllNotificationsPage />} />
              <Route path="profile" element={<ProfilePage user={user} />} />
              <Route path="settings" element={<SettingsPage user={user} />} />
              <Route
                path="worker"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <WorkerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Suscripción y Admin */}
              <Route
                path="subscription"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <SubscriptionPlans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="subscription/success"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <SubscriptionSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={["superadmin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
