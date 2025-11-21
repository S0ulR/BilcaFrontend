// src/context/ToastContext.js
import React, { createContext, useState } from 'react';
import Toast from '../components/ui/Toast';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message, options = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, ...options }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (title, message) => addToast('success', title, message);
  const error = (title, message) => addToast('error', title, message);
  const info = (title, message) => addToast('info', title, message);
  const warning = (title, message) => addToast('warning', title, message);

  /**
   * Muestra un toast de confirmación con botones
   * @param {string} title
   * @param {string} message
   * @param {Function} onConfirm - Callback al confirmar
   * @param {string} confirmText - Texto del botón de confirmación
   * @param {string} cancelText - Texto del botón de cancelar
   */
  const showConfirm = (title, message, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar") => {
    const id = Date.now() + Math.random();

    setToasts(prev => [
      ...prev,
      {
        id,
        type: 'confirm', // ← Tipo correcto
        title,
        message,
        autoDismiss: false, // No se cierra solo
        onConfirm // Pasamos la función al componente Toast
      }
    ]);
  };

  return (
    <ToastContext.Provider value={{ success, error, info, warning, showConfirm }}>
      {children}
      <Toast toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;