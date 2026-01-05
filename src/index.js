// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AuthProvider } from "./context/AuthProvider";
import InactivityModal from "./components/ui/InactivityModal";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <NotificationProvider>
          <AuthProvider>
            <App />
            <InactivityModal />
          </AuthProvider>
        </NotificationProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
