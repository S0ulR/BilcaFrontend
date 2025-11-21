// src/components/ui/Toast.js
import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ toasts, removeToast }) => {
  useEffect(() => {
    const timers = toasts.map(toast => {
      // Auto-descartar solo si NO es tipo 'confirm' y autoDismiss !== false
      if (toast.type !== 'confirm' && toast.autoDismiss !== false) {
        return setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || 3000);
      }
      return null;
    });

    return () => {
      timers.forEach(timer => timer && clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          <div className="toast-icon">
            {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
            {toast.type === 'error' && <i className="fas fa-times-circle"></i>}
            {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
            {toast.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
            {toast.type === 'confirm' && <i className="fas fa-question-circle"></i>}
          </div>

          <div className="toast-content">
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </div>

          {/* Botones para confirmación */}
          {toast.type === 'confirm' ? (
            <div className="toast-actions">
              <button
                className="toast-btn toast-btn-secondary"
                onClick={() => removeToast(toast.id)}
              >
                {toast.cancelText || "Cancelar"}
              </button>
              <button
                className="toast-btn toast-btn-primary"
                onClick={() => {
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
              onClick={() => removeToast(toast.id)}
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