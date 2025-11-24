// src/components/dashboard/BudgetForm.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateBudgetPDF } from "../../utils/generateBudgetPDF";
import { ToastContext } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthProvider"; // Nuevo
import API from "../../services/api";
import Breadcrumb from "../ui/Breadcrumb";
import "./BudgetForm.css";

const BudgetForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useContext(ToastContext);
  const { user } = useAuth(); // ✅ Nuevo: usar el contexto de autenticación

  // ✅ Estado inicial: clientEmail ahora se inicializa desde location.state
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "", // Inicialmente vacío, se llenará con useEffect
    service: "",
    description: "",
    hourlyRate: "",
    hours: "",
    validUntil: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false); // Para el botón de envío por email
  const [sendingMessage, setSendingMessage] = useState(false); // Para el botón de mensaje

  // ✅ Cargar datos desde location.state si existen
  useEffect(() => {
    if (location.state) {
      const { clientName, clientEmail, service, description } = location.state;

      setFormData((prev) => ({
        ...prev,
        clientName: clientName || prev.clientName,
        clientEmail: clientEmail || prev.clientEmail, // ✅ Se carga el email aquí
        service: service || prev.service,
        description: description || prev.description,
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const calculateTotals = () => {
    const totalAmount =
      formData.hourlyRate && formData.hours
        ? (
            parseFloat(formData.hourlyRate) * parseFloat(formData.hours)
          ).toFixed(2)
        : "0.00";
    return { totalAmount };
  };

  const handlePreview = () => {
    if (!formData.clientName || !formData.clientEmail || !formData.validUntil) {
      return error(
        "Campos requeridos",
        "Completa todos los campos obligatorios."
      );
    }
    const totalAmount = parseFloat(calculateTotals().totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return error(
        "Monto inválido",
        "El monto total debe ser un número positivo."
      );
    }
    setShowPreview(true);
  };

  const handleSubmit = () => {
    const { totalAmount } = calculateTotals();
    const numTotalAmount = parseFloat(totalAmount);
    if (isNaN(numTotalAmount) || numTotalAmount <= 0) {
      return error(
        "Monto inválido",
        "El monto total debe ser un número positivo."
      );
    }

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
      totalAmount,
      items: [
        {
          description: formData.service,
          quantity: formData.hours || 1,
          rate: formData.hourlyRate || 0,
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

  // ✅ Corrección del envío por correo con PDF adjunto
  const handleSendByEmail = async () => {
    if (!formData.clientEmail) {
      return error("Falta email", "Agrega el email del cliente para enviarlo.");
    }

    const { totalAmount } = calculateTotals();
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      return error(
        "Datos incompletos",
        "Ingresa tarifa y horas para calcular un total válido."
      );
    }

    setLoading(true);

    try {
      // 1️⃣ Datos del presupuesto
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
        totalAmount,
        items: [
          {
            description: formData.service,
            quantity: formData.hours || 1,
            rate: formData.hourlyRate || 0,
            amount: totalAmount,
          },
        ],
      };

      // 2️⃣ Generar PDF con jsPDF + autoTable
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

      doc.autoTable({
        startY: finalY2 + 15,
        head: [["Descripción", "Cant.", "Precio Unit.", "Total"]],
        body: data.items.map((item) => [
          item.description,
          item.quantity,
          `$${parseFloat(item.rate).toFixed(2)}`,
          `$${parseFloat(item.amount).toFixed(2)}`,
        ]),
        theme: "striped",
        styles: { fontSize: 10 },
      });

      const finalY3 = doc.lastAutoTable.finalY;
      doc.setFontSize(12);
      doc.text(
        `Total estimado: $${parseFloat(data.totalAmount).toFixed(2)}`,
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

      // 3️⃣ Convertir PDF a Blob correctamente
      const pdfArrayBuffer = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });

      // 4️⃣ Enviar al backend
      const fileName = `presupuesto_${data.client.name}_${
        data.service
      }_${new Date().toISOString().slice(0, 10)}.pdf`;

      const formDataToSend = new FormData();
      formDataToSend.append("to", data.client.email);
      formDataToSend.append("subject", `Presupuesto para ${data.service}`);
      formDataToSend.append(
        "html",
        `<p>Hola ${data.client.name},</p><p>Adjunto encontrarás el presupuesto solicitado por <strong>${data.service}</strong>.</p><p><strong>Total estimado: $${data.totalAmount}</strong></p>`
      );
      formDataToSend.append("attachment", pdfBlob, fileName);

      await API.post("/documents/send-email", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      success("Enviado", `Presupuesto enviado a ${data.client.email}`);
    } catch (err) {
      console.error("Error al enviar presupuesto por email:", err);
      error("Error", "No se pudo enviar el presupuesto por email.");
    } finally {
      setLoading(false);
      setShowPreview(false);
    }
  };

  // ✅ Nueva función para enviar por mensaje interno
  const handleSendMessage = async () => {
    if (!formData.clientEmail) {
      return error(
        "Falta destinatario",
        "No se puede enviar el mensaje: falta el email del cliente."
      );
    }

    const { totalAmount } = calculateTotals();
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      return error(
        "Datos incompletos",
        "Ingresa tarifa y horas para calcular un total válido."
      );
    }

    setSendingMessage(true);

    try {
      // Enviar mensaje con el resumen del presupuesto
      // Asumiendo que tienes un endpoint como /messages/send
      // y que location.state.clientId es el ID del cliente
      const recipientId = location.state?.clientId;

      if (!recipientId) {
        throw new Error("ID del cliente no encontrado en la ruta.");
      }

      await API.post("/messages/send", {
        recipient: recipientId, // El ID del cliente al que se envía
        content: `Hola, te envío un presupuesto para "${formData.service}" por un total estimado de $${totalAmount}.`,
      });

      success(
        "Mensaje enviado",
        `Presupuesto enviado a ${formData.clientName} por mensaje interno.`
      );
      // Opcional: también crear una entrada en budget-requests con estado "enviado_por_mensaje"
      // await API.post("/budget-requests/log", { requestId: location.state?.requestId, method: "mensaje", amount: totalAmount });
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      error(
        "Error",
        "No se pudo enviar el mensaje. " +
          (err.response?.data?.msg || err.message)
      );
    } finally {
      setSendingMessage(false);
      setShowPreview(false); // Cerrar vista previa después de enviar
    }
  };

  // ✅ Vista previa actualizada
  const renderPreview = () => {
    const { totalAmount } = calculateTotals();
    return (
      <div className="budget-preview">
        <h3>Vista previa del presupuesto</h3>
        <div className="preview-content">
          <div className="preview-header">
            <h4>Presupuesto para: {formData.service}</h4>
            <p>Válido hasta: {formData.validUntil}</p>
          </div>
          <div className="preview-client">
            <p>
              <strong>Cliente:</strong> {formData.clientName}
            </p>
            <p>
              <strong>Email:</strong> {formData.clientEmail}
            </p>{" "}
            {/* ✅ Ahora debería mostrar el email */}
          </div>
          <div className="preview-worker">
            <p>
              <strong>Profesional:</strong> {user?.name}
            </p>
          </div>
          {formData.description && (
            <div className="preview-description">
              <p>
                <strong>Descripción:</strong> {formData.description}
              </p>
            </div>
          )}
          <table className="preview-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formData.service}</td>
                <td>{formData.hours || 1}</td>
                <td>${formData.hourlyRate || 0}</td>
                <td>${totalAmount}</td>
              </tr>
            </tbody>
          </table>
          <div className="preview-totals">
            <p>
              <strong>Total estimado:</strong> ${totalAmount}
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
          {/* ✅ Nuevo botón para enviar por mensaje interno */}
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
              value={formData.clientEmail} // ✅ Ahora debería estar poblado si vino del location.state
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hourlyRate">Tarifa por hora ($)</label>
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
            <label htmlFor="hours">Horas estimadas</label>
            <input
              id="hours"
              name="hours"
              type="number"
              min="0"
              step="0.5"
              placeholder="Ej: 4"
              value={formData.hours}
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
