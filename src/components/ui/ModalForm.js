// src/components/ui/ModalForm.js
import React from "react";
import "./ModalForm.css";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const modalClassName = `modal ${sizes[size]}`;

  return (
    <div className="modal-overlay open">
      <div className={modalClassName}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-form">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
