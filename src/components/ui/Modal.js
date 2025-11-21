// src/components/ui/Modal.js
import React, { useEffect, useRef } from "react";
import "./Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md", // 'sm', 'md', 'lg'
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef();
  const dialogRef = useRef();

  // Soporte para tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen && closeOnEscape) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Enfocar automáticamente el modal al abrir
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isOpen ? "open" : ""}`}
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        className={`modal modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex="-1" // Necesario para foco con .focus()
      >
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          {showCloseButton && (
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>

        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
