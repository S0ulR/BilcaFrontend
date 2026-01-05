// src/components/dashboard/ContractForm.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateContractPDF } from "../../../utils/generateContractPDF";
import { ToastContext } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthProvider";
import API from "../../../services/api";
import Breadcrumb from "../../ui/Breadcrumb";
import "./ContractForm.css";

const ContractForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useContext(ToastContext);
  const { user } = useAuth();

  const initialFormData = {
    clientName: user?.name || "",
    clientEmail: user?.email || "",
    service: location.state?.service || "",
    description: location.state?.description || "",
    hourlyRate: location.state?.hourlyRate || "",
    totalAmount: location.state?.budget || "",
    startDate: location.state?.startDate || "",
    endDate: location.state?.endDate || "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [pendingContract, setPendingContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sendingContract, setSendingContract] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("pendingContract");
    if (saved) {
      try {
        const contract = JSON.parse(saved);
        setPendingContract(contract);
        setFormData((prev) => ({
          ...prev,
          clientName: contract.clientName || user?.name || "",
          clientEmail: contract.clientEmail || user?.email || "",
          service: contract.service || "",
          description: contract.description || "",
          totalAmount: contract.budget ? contract.budget.toString() : "",
        }));
      } catch (err) {
        console.error("Error al cargar contrato pendiente:", err);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePreview = () => {
    if (
      !formData.service ||
      !formData.totalAmount ||
      !formData.startDate ||
      !formData.endDate
    ) {
      return error(
        "Campos faltantes",
        "Completa todos los campos obligatorios."
      );
    }
    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount)) {
      return error(
        "Monto inválido",
        "El monto total debe ser un número válido."
      );
    }
    setShowPreview(true);
  };

  const handleSubmit = () => {
    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount)) {
      return error(
        "Monto inválido",
        "El monto total debe ser un número válido."
      );
    }
    const data = {
      date: new Date().toLocaleDateString(),
      client: { name: formData.clientName, email: formData.clientEmail },
      worker: { name: user?.name },
      service: formData.service,
      description: formData.description,
      hourlyRate: formData.hourlyRate || "N/A",
      totalAmount: totalAmount.toFixed(2),
      startDate: formData.startDate,
      endDate: formData.endDate,
    };
    try {
      generateContractPDF(data);
      success("Contrato generado", "El PDF se ha descargado correctamente.");
    } catch (err) {
      error("Error", "No se pudo generar el contrato.");
    }
  };

  const handleSendContractAndEmail = async () => {
    if (!formData.clientEmail) {
      return error("Falta email", "Agrega el email del cliente para enviarlo.");
    }
    if (!formData.service || !formData.totalAmount) {
      return error(
        "Datos incompletos",
        "Ingresa servicio y monto para continuar."
      );
    }

    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount)) {
      return error(
        "Monto inválido",
        "El monto total debe ser un número válido."
      );
    }

    setSendingContract(true);

    try {
      const hireData = {
        worker: location.state?.workerId,
        client: user._id.trim(),
        service: formData.service,
        description: formData.description,
        budget: totalAmount,
        status: "pendiente",
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      // ✅ CORREGIDO: usar /hires en lugar de /hires/create
      const hireResponse = await API.post("/hires", hireData);

      try {
        const { jsPDF } = await import("jspdf");
        await import("jspdf-autotable");
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Contrato de Servicio", 14, 22);
        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);
        doc.autoTable({
          startY: 40,
          head: [["Cliente", "Email"]],
          body: [[formData.clientName, formData.clientEmail]],
        });
        const y = doc.lastAutoTable.finalY + 10;
        doc.text(`Servicio: ${formData.service}`, 14, y);
        doc.text(`Monto total: $${totalAmount.toFixed(2)}`, 14, y + 10);

        const pdfArrayBuffer = doc.output("arraybuffer");
        const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
        const fileName = `contrato_${formData.clientName}_${
          formData.service
        }_${new Date().toISOString().slice(0, 10)}.pdf`;

        const formDataToSend = new FormData();
        formDataToSend.append("to", formData.clientEmail);
        formDataToSend.append("subject", `Contrato para ${formData.service}`);
        formDataToSend.append(
          "html",
          `<p>Hola ${
            formData.clientName
          },</p><p>Adjunto encontrarás el contrato solicitado por <strong>${
            formData.service
          }</strong>.</p><p><strong>Monto total: $${totalAmount.toFixed(
            2
          )}</strong></p>`
        );
        formDataToSend.append("attachment", pdfBlob, fileName);

        await API.post("/documents/send-email", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        success(
          "Contrato enviado",
          `La contratación fue creada y el contrato enviado a ${formData.clientEmail}.`
        );
      } catch (emailError) {
        console.error("Error al enviar email (no bloqueante):", emailError);
        success(
          "Contratación creada",
          "La contratación fue creada exitosamente. El envío del email falló, pero el trabajador recibirá la notificación en la app."
        );
      }

      sessionStorage.removeItem("pendingContract");
      navigate("/dashboard/hires/user");
    } catch (err) {
      console.error("Error al crear contratación:", err);
      error(
        "Error",
        err.response?.data?.msg || "No se pudo crear la contratación."
      );
    } finally {
      setSendingContract(false);
    }
  };

  const renderPreview = () => {
    const totalAmount = parseFloat(formData.totalAmount).toFixed(2);
    return (
      <div className="contract-preview">
        <h3>Vista previa del contrato</h3>
        <div className="preview-content">
          <div className="preview-header">
            <h4>Contrato para: {formData.service}</h4>
            <p>Fecha: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="preview-client">
            <p>
              <strong>Cliente:</strong> {formData.clientName}
            </p>
            <p>
              <strong>Email:</strong> {formData.clientEmail}
            </p>
          </div>
          <div className="preview-worker">
            <p>
              <strong>Trabajador:</strong> {user?.name}
            </p>
          </div>
          <div className="preview-details">
            <p>
              <strong>Servicio:</strong> {formData.service}
            </p>
            <p>
              <strong>Descripción:</strong> {formData.description || "N/A"}
            </p>
            <p>
              <strong>Tarifa por hora:</strong> ${formData.hourlyRate || "N/A"}
            </p>
            <p>
              <strong>Monto total:</strong> ${totalAmount}
            </p>
            <p>
              <strong>Duración:</strong> {formData.startDate} a{" "}
              {formData.endDate}
            </p>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" onClick={handleSubmit} className="btn-download">
            <i className="fas fa-file-contract"></i> Descargar PDF
          </button>
          <button
            type="button"
            onClick={handleSendContractAndEmail}
            className="btn-send"
            disabled={sendingContract}
          >
            {sendingContract ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enviando...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Enviar contrato al
                trabajador
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="btn-cancel"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  if (showPreview) {
    return (
      <div className="document-form">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Documentos", path: "/dashboard/documents" },
            { label: "Generar Contrato", active: true },
          ]}
        />
        {renderPreview()}
      </div>
    );
  }

  return (
    <div className="document-form">
      <Breadcrumb
        items={[
          { label: "Inicio", path: "/dashboard" },
          { label: "Documentos", path: "/dashboard/documents" },
          { label: "Generar Contrato", active: true },
        ]}
      />
      <div className="welcome-card">
        <h1>Generar Contrato de Servicio</h1>
        <p>
          Formaliza tu acuerdo con clientes o trabajadores con un contrato claro
          y profesional.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clientName">Nombre del cliente *</label>
            <input
              id="clientName"
              name="clientName"
              placeholder="Ej: Juan Pérez"
              value={formData.clientName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="clientEmail">Email del cliente *</label>
            <input
              id="clientEmail"
              name="clientEmail"
              type="email"
              placeholder="Ej: juan@email.com"
              value={formData.clientEmail}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="service">Servicio *</label>
          <input
            id="service"
            name="service"
            placeholder="Ej: Jardinería mensual"
            value={formData.service}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Descripción del servicio</label>
          <textarea
            id="description"
            name="description"
            placeholder="Detalles, alcance, responsabilidades..."
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hourlyRate">Tarifa por hora (opcional)</label>
            <input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 25.00"
              value={formData.hourlyRate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="totalAmount">Monto total *</label>
            <input
              id="totalAmount"
              name="totalAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 400.00"
              value={formData.totalAmount}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Fecha de inicio *</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Fecha de finalización *</label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" onClick={handlePreview} className="btn-preview">
            <i className="fas fa-eye"></i> Vista Previa
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
