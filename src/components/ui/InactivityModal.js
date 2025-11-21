import React, { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import { useAuth } from "../../context/AuthProvider";

const InactivityModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 segundos para extender la sesión
  const [isActive, setIsActive] = useState(true);
  const { user, logout } = useAuth();
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Reiniciar temporizador de inactividad
  const resetInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsActive(true);
    setIsOpen(false);
    setTimeLeft(60);

    if (countdownRef.current) clearInterval(countdownRef.current);

    // Temporizador de inactividad (24hs)
    timerRef.current = setTimeout(() => {
      setIsActive(false);
      setIsOpen(true);
      startCountdown();
    }, 24 * 60 * 60 * 1000); // 24 horas
  };

  // Iniciar cuenta regresiva
  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          handleLogout(); // Cerrar sesión por inactividad
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Extender sesión
  const extendSession = () => {
    setIsOpen(false);
    setTimeLeft(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetInactivityTimer();
  };

  // Cerrar sesión
  const handleLogout = () => {
    setIsOpen(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    logout();
  };

  // Escuchar eventos de inactividad
  useEffect(() => {
    if (user) {
      const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "keydown"];
      events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
      resetInactivityTimer(); // Iniciar al cargar

      return () => {
        events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [user]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleLogout}
      title="Sesión por expirar"
      size="md"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div style={{ textAlign: "center" }}>
        <p>
          Por seguridad, tu sesión se cerrará en <strong>{timeLeft}</strong> segundos debido a inactividad.
        </p>
        <p>¿Deseas continuar con la sesión?</p>

        <div className="modal-actions">
          <button onClick={extendSession} className="btn-primary">
            Extender sesión
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Cerrar sesión
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InactivityModal;
