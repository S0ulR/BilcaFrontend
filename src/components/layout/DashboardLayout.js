// src/components/layout/DashboardLayout.js
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Componentes
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "../dashboard/Sidebar";

// Páginas
import DashboardHome from "../dashboard/DashboardHome";
import SearchWorker from "../dashboard/SearchWorker";
import HiresDashboardPage from "../dashboard/HiresDashboardPage";
import WorkerHires from "../dashboard/WorkerHires";
import MyHires from "../dashboard/MyHires";
import Messages from "../dashboard/Messages";
import OfferService from "../dashboard/OfferService";
import Documents from "../dashboard/Documents";
import BudgetForm from "../dashboard/BudgetForm";
import ContractForm from "../dashboard/ContractForm";
import InvoiceForm from "../dashboard/InvoiceForm";
import WorkerDashboard from "../dashboard/WorkerDashboard";
import AllReviewsPage from "../dashboard/AllReviewsPage";
import AllNotificationsPage from "../dashboard/AllNotificationsPage";
import ProfilePage from "../dashboard/ProfileForm";
import SettingsPage from "../dashboard/SettingsPage";
import BudgetRequestsReceived from "../dashboard/BudgetRequestsReceived";
import BudgetRequestsSent from "../dashboard/BudgetRequestsSent";

const DashboardLayout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
    // Bloquear scroll del body
    document.body.style.overflow = "hidden";
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Navbar
        user={user}
        onLogout={onLogout}
        toggleSidebar={openMobileMenu}
      />

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside
          className={`sidebar ${sidebarOpen ? "expanded" : "collapsed"} ${
            mobileMenuOpen ? "mobile-open" : ""
          }`}
          onMouseEnter={() => {
            if (window.innerWidth >= 768) {
              setSidebarOpen(true);
            }
          }}
          onMouseLeave={() => {
            if (window.innerWidth >= 768 && !sidebarOpen) {
            }
          }}
        >
          <Sidebar
            user={user}
            onLogout={onLogout}
            isOpen={sidebarOpen}
            toggle={toggleSidebar}
          />
        </aside>

        {/* Overlay en móvil */}
        {mobileMenuOpen && (
          <div
            className="sidebar-overlay"
            onClick={closeMobileMenu}
            aria-hidden="true"
          ></div>
        )}

        {/* Contenido principal */}
        <main className={`dashboard-main ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
          <div className="dashboard-content">
            <Routes>
              <Route index element={<DashboardHome user={user} />} />
              <Route path="search" element={<SearchWorker />} />
              <Route path="hires/*" element={<HiresDashboardPage />} />
              <Route path="hires/worker" element={<WorkerHires />} />
              <Route path="hires/user" element={<MyHires />} />
              <Route path="budget-requests/received" element={<BudgetRequestsReceived />} />
              <Route path="budget-requests/sent" element={<BudgetRequestsSent />} />
              <Route path="messages" element={<Messages />} />
              <Route path="offer" element={<OfferService />} />
              <Route path="reviews" element={<AllReviewsPage />} />
              <Route path="documents" element={<Documents />} />
              <Route path="documents/budget" element={<BudgetForm />} />
              <Route path="documents/contract" element={<ContractForm />} />
              <Route path="documents/invoice" element={<InvoiceForm />} />
              <Route path="notifications" element={<AllNotificationsPage />} />
              <Route path="profile" element={<ProfilePage user={user} />} />
              <Route path="settings" element={<SettingsPage user={user} />} />
              {user?.role === "worker" && (
                <Route path="worker" element={<WorkerDashboard />} />
              )}
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
