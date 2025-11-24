// src/components/ui/Toast.js
import React, { useEffect } from "react";
import "./Toast.css";

const Toast = ({ toasts, removeToast }) => {
  useEffect(() => {
    const timers = toasts.map((toast) => {
      // ✅ MODIFICACIÓN: Los toasts de tipo 'error' y 'confirm' NO se auto-descartan
      const shouldAutoDismiss =
        toast.autoDismiss !== false &&
        toast.type !== "confirm" &&
        toast.type !== "error"; // ← Esta es la línea clave

      if (shouldAutoDismiss) {
        return setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || 3000);
      }
      return null;
    });

    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          // ✅ Opcional: hacer que el toast sea "clickeable" en toda su área para cerrarlo
          onClick={() => {
            if (toast.type !== "confirm") {
              removeToast(toast.id);
            }
          }}
          style={{ cursor: toast.type !== "confirm" ? "pointer" : "default" }}
        >
          <div className="toast-icon">
            {toast.type === "success" && (
              <i className="fas fa-check-circle"></i>
            )}
            {toast.type === "error" && <i className="fas fa-times-circle"></i>}
            {toast.type === "info" && <i className="fas fa-info-circle"></i>}
            {toast.type === "warning" && (
              <i className="fas fa-exclamation-triangle"></i>
            )}
            {toast.type === "confirm" && (
              <i className="fas fa-question-circle"></i>
            )}
          </div>

          <div className="toast-content">
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </div>

          {/* Botones para confirmación */}
          {toast.type === "confirm" ? (
            <div className="toast-actions">
              <button
                className="toast-btn toast-btn-secondary"
                onClick={(e) => {
                  e.stopPropagation(); // Evitar que se cierre el toast
                  removeToast(toast.id);
                }}
              >
                {toast.cancelText || "Cancelar"}
              </button>
              <button
                className="toast-btn toast-btn-primary"
                onClick={(e) => {
                  e.stopPropagation(); // Evitar que se cierre el toast
                  if (toast.onConfirm) toast.onConfirm();
                  removeToast(toast.id);
                }}
              >
                {toast.confirmText || "Confirmar"}
              </button>
            </div>
          ) : (
            <button
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation(); // Evitar el doble cierre
                removeToast(toast.id);
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Toast;
