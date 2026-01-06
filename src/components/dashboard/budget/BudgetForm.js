// src/components/dashboard/BudgetForm.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateBudgetPDF } from "../../../utils/generateBudgetPDF";
import { ToastContext } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthProvider";
import API from "../../../services/api";
import Breadcrumb from "../../ui/Breadcrumb";
import "./BudgetForm.css";

const BudgetForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useContext(ToastContext);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    service: "",
    description: "",
    hourlyRate: "",
    estimatedTime: "",
    totalBudget: "",
    validUntil: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (location.state) {
      const { clientName, clientEmail, service, description } = location.state;

      setFormData((prev) => ({
        ...prev,
        clientName: clientName || prev.clientName,
        clientEmail: clientEmail || prev.clientEmail,
        service: service || prev.service,
        description: description || prev.description,
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Nueva función de cálculo flexible
  const calculateTotalAmount = () => {
    const hasHourlyRate =
      formData.hourlyRate && !isNaN(parseFloat(formData.hourlyRate));
    const hasTotalBudget =
      formData.totalBudget && !isNaN(parseFloat(formData.totalBudget));

    if (hasTotalBudget) {
      // Si el usuario especificó un presupuesto total, úsalo
      return parseFloat(formData.totalBudget).toFixed(2);
    } else if (hasHourlyRate) {
      // Si no hay total, pero hay tarifa por hora, calcula
      return parseFloat(formData.hourlyRate).toFixed(2);
    } else {
      // Si no hay ninguno, devuelve "A coordinar"
      return "A coordinar";
    }
  };

  const handlePreview = () => {
    if (!formData.clientName || !formData.clientEmail || !formData.validUntil) {
      return error(
        "Campos requeridos",
        "Completa todos los campos obligatorios."
      );
    }

    // Validación flexible: al menos uno debe estar presente o ambos pueden estar vacíos
    const hasHourlyRate =
      formData.hourlyRate && !isNaN(parseFloat(formData.hourlyRate));
    const hasTotalBudget =
      formData.totalBudget && !isNaN(parseFloat(formData.totalBudget));

    if (!hasHourlyRate && !hasTotalBudget) {
      if (
        !window.confirm("No has especificado ningún monto. ¿Deseas continuar?")
      ) {
        return;
      }
      console.log("Presupuesto sin monto específico");
    }

    setShowPreview(true);
  };

  const handleSubmit = () => {
    const totalAmount = calculateTotalAmount();

    const data = {
      date: new Date().toLocaleDateString("es-AR"),
      validUntil: new Date(formData.validUntil).toLocaleDateString("es-AR"),
      client: { name: formData.clientName, email: formData.clientEmail },
      worker: {
        name: user?.name || "Profesional",
        profession: user?.services?.[0]?.profession || "Servicio",
      },
      service: formData.service,
      description: formData.description,
      hourlyRate: formData.hourlyRate || "N/A",
      totalBudget: formData.totalBudget || "N/A",
      estimatedTime: formData.estimatedTime || "A coordinar",
      totalAmount,
      items: [
        {
          description: formData.description,
          quantity: formData.estimatedTime || "1",
          rate: formData.hourlyRate || "A coordinar",
          amount: totalAmount,
        },
      ],
    };

    try {
      generateBudgetPDF(data);
      success("Presupuesto generado", "El PDF se ha descargado correctamente.");
    } catch (err) {
      console.error("Error al generar PDF:", err);
      error("Error", "No se pudo generar el presupuesto.");
    }
  };

  const handleSendByEmail = async () => {
    if (!location.state?.requestId) {
      return error(
        "Error",
        "No se puede enviar el presupuesto: falta el ID de la solicitud."
      );
    }
    if (!formData.clientEmail) {
      return error("Falta email", "Agrega el email del cliente para enviarlo.");
    }

    const totalAmount = calculateTotalAmount();

    setLoading(true);

    try {
      const data = {
        date: new Date().toLocaleDateString("es-AR"),
        validUntil: new Date(formData.validUntil).toLocaleDateString("es-AR"),
        client: { name: formData.clientName, email: formData.clientEmail },
        worker: {
          name: user?.name || "Profesional",
          profession: user?.services?.[0]?.profession || "Servicio",
        },
        service: formData.service,
        description: formData.description,
        hourlyRate: formData.hourlyRate || "N/A",
        totalBudget: formData.totalBudget || "N/A",
        estimatedTime: formData.estimatedTime || "A coordinar",
        totalAmount,
        items: [
          {
            description: formData.description,
            quantity: formData.estimatedTime || "1",
            rate: formData.hourlyRate || "A coordinar",
            amount: totalAmount,
          },
        ],
      };

      const responsePayload = {
        message: `Presupuesto enviado para "${formData.service}"`,
        budget: totalAmount === "A coordinar" ? 0 : parseFloat(totalAmount),
        estimatedTime: formData.estimatedTime || "A coordinar",
      };

      await API.post(
        `/budget-requests/respond/${location.state.requestId}`,
        responsePayload
      );

      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Presupuesto de Servicio", 14, 22);
      doc.setFontSize(12);
      doc.text(`Fecha: ${data.date}`, 14, 32);
      doc.text(`Válido hasta: ${data.validUntil}`, 14, 40);

      doc.setFontSize(14);
      doc.text("Cliente", 14, 50);
      doc.autoTable({
        startY: 55,
        head: [["Nombre", "Email"]],
        body: [[data.client.name, data.client.email]],
        theme: "grid",
        styles: { fontSize: 10 },
      });

      const finalY = doc.lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.text("Profesional", 14, finalY + 10);
      doc.autoTable({
        startY: finalY + 15,
        head: [["Nombre", "Oficio"]],
        body: [[data.worker.name, data.worker.profession || "Servicio"]],
        theme: "grid",
        styles: { fontSize: 10 },
      });

      const finalY2 = doc.lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.text("Detalle del Presupuesto", 14, finalY2 + 10);

      const itemsBody = [
        [
          data.service,
          data.estimatedTime,
          data.hourlyRate === "N/A"
            ? data.totalBudget === "N/A"
              ? "A coordinar"
              : `$${data.totalBudget}`
            : `$${data.hourlyRate}`,
          data.totalAmount === "A coordinar"
            ? data.totalAmount
            : `$${data.totalAmount}`,
        ],
      ];

      doc.autoTable({
        startY: finalY2 + 15,
        head: [["Descripción", "Tiempo estimado", "Precio", "Total"]],
        body: itemsBody,
        theme: "striped",
        styles: { fontSize: 10 },
      });

      const finalY3 = doc.lastAutoTable.finalY;
      doc.setFontSize(12);
      doc.text(
        data.totalAmount === "A coordinar"
          ? "Total estimado: A coordinar"
          : `Total estimado: $${data.totalAmount}`,
        14,
        finalY3 + 10
      );

      if (data.description) {
        const lines = doc.splitTextToSize(
          `Descripción del servicio: ${data.description}`,
          180
        );
        doc.text(lines, 14, finalY3 + 20);
      }

      doc.setFontSize(10);
      doc.text(
        "Este presupuesto es una estimación y no constituye un contrato.",
        14,
        finalY3 + 40
      );

      const pdfArrayBuffer = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });

      const fileName = `presupuesto_${data.client.name}_${
        data.service
      }_${new Date().toISOString().slice(0, 10)}.pdf`;

      const formDataToSend = new FormData();
      formDataToSend.append("to", data.client.email);
      formDataToSend.append("subject", `Presupuesto para ${data.service}`);
      formDataToSend.append(
        "html",
        `<p>Hola ${
          data.client.name
        },</p><p>Adjunto encontrarás el presupuesto solicitado por <strong>${
          data.service
        }</strong>.</p><p><strong>Total estimado: ${
          data.totalAmount === "A coordinar"
            ? data.totalAmount
            : `$${data.totalAmount}`
        }</strong></p>`
      );
      formDataToSend.append("attachment", pdfBlob, fileName);

      await API.post("/documents/send-email", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      success("Enviado", `Presupuesto enviado a ${data.client.email}`);
      navigate("/dashboard/budget-requests/sent");
    } catch (err) {
      console.error("Error al enviar presupuesto por email:", err);
      error("Error", "No se pudo enviar el presupuesto por email.");
    } finally {
      setLoading(false);
      setShowPreview(false);
    }
  };

  const handleSendMessage = async () => {
    if (!location.state?.requestId) {
      return error(
        "Error",
        "No se puede enviar el presupuesto: falta el ID de la solicitud."
      );
    }
    if (!formData.clientEmail) {
      return error(
        "Falta destinatario",
        "No se puede enviar el mensaje: falta el email del cliente."
      );
    }

    const totalAmount = calculateTotalAmount();

    setSendingMessage(true);

    const responsePayload = {
      message: `Presupuesto enviado para "${formData.service}"`,
      budget: totalAmount === "A coordinar" ? 0 : parseFloat(totalAmount),
      estimatedTime: formData.estimatedTime || "A coordinar",
    };

    await API.post(
      `/budget-requests/respond/${location.state.requestId}`,
      responsePayload
    );

    try {
      const recipientId = location.state?.clientId;

      if (!recipientId) {
        throw new Error("ID del cliente no encontrado en la ruta.");
      }

      await API.post("/messages/send", {
        recipient: recipientId,
        content: `Hola, te envío un presupuesto para "${formData.service}"${
          totalAmount !== "A coordinar"
            ? ` por un total estimado de $${totalAmount}`
            : ""
        }. ${
          formData.estimatedTime
            ? `Tiempo estimado: ${formData.estimatedTime}.`
            : ""
        }`,
      });

      success(
        "Mensaje enviado",
        `Presupuesto enviado a ${formData.clientName} por mensaje interno.`
      );
      navigate("/dashboard/budget-requests/sent");
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      error(
        "Error",
        "No se pudo enviar el mensaje. " +
          (err.response?.data?.msg || err.message)
      );
    } finally {
      setSendingMessage(false);
      setShowPreview(false);
    }
  };

  const renderPreview = () => {
    const totalAmount = calculateTotalAmount();
    return (
      <div className="budget-preview">
        <h3>Vista previa del presupuesto</h3>
        <div className="preview-content">
          <div className="preview-header">
            <h4>Presupuesto de: {formData.service}</h4>
            <p>Válido hasta: {formData.validUntil}</p>
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
              <strong>Profesional:</strong> {user?.name}
            </p>
          </div>
          {formData.description && (
            <div className="preview-description">
              <p>
                <strong>Servicio de:</strong> {formData.service}
              </p>
            </div>
          )}
          <table className="preview-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tiempo estimado</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formData.description}</td>
                <td>{formData.estimatedTime || "A coordinar"}</td>
                <td>
                  {formData.hourlyRate
                    ? `$${formData.hourlyRate}/hora`
                    : formData.totalBudget
                    ? `$${formData.totalBudget} total`
                    : "A coordinar"}
                </td>
                <td>
                  {totalAmount === "A coordinar"
                    ? totalAmount
                    : `$${totalAmount}`}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="preview-totals">
            <p>
              <strong>Total estimado:</strong>{" "}
              {totalAmount === "A coordinar" ? totalAmount : `$${totalAmount}`}
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleSubmit} className="btn-download">
            <i className="fas fa-download"></i> Descargar PDF
          </button>
          <button
            type="button"
            onClick={handleSendByEmail}
            className="btn-send-email"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enviando por email...
              </>
            ) : (
              <>
                <i className="fas fa-envelope"></i> Enviar por email
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSendMessage}
            className="btn-send-message"
            disabled={sendingMessage}
          >
            {sendingMessage ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enviando por
                mensaje...
              </>
            ) : (
              <>
                <i className="fas fa-comment-dots"></i> Enviar por mensaje
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
            { label: "Generar Presupuesto", active: true },
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
          { label: "Generar Presupuesto", active: true },
        ]}
      />

      <div className="welcome-card">
        <h1>Generar Presupuesto</h1>
        <p>
          Completa los detalles para crear un presupuesto profesional listo para
          descargar o enviar.
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clientName">Nombre del cliente *</label>
            <input
              id="clientName"
              name="clientName"
              placeholder="Ej: María López"
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
              placeholder="Ej: maria@email.com"
              value={formData.clientEmail}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="service">Servicio *</label>
            <input
              id="service"
              name="service"
              placeholder="Ej: Instalación eléctrica"
              value={formData.service}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              placeholder="Detalles del servicio..."
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
        </div>

        {/* ✅ Nuevos campos flexibles */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hourlyRate">Tarifa por hora ($) - Opcional</label>
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
            <label htmlFor="totalBudget">
              Presupuesto total ($) - Opcional
            </label>
            <input
              id="totalBudget"
              name="totalBudget"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 200.00"
              value={formData.totalBudget}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estimatedTime">Tiempo estimado - Opcional</label>
            <input
              id="estimatedTime"
              name="estimatedTime"
              type="text"
              placeholder="Ej: 3 horas, 2 días, 1 semana"
              value={formData.estimatedTime}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="validUntil">Válido hasta *</label>
          <input
            id="validUntil"
            name="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handlePreview}
            className="btn-preview"
            aria-label="Vista previa del presupuesto"
          >
            <i className="fas fa-eye"></i> Vista Previa
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
