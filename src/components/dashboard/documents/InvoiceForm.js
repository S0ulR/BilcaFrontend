// src/components/dashboard/InvoiceForm.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { generateInvoicePDF } from "../../../utils/generateInvoicePDF";
import { ToastContext } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthProvider";
import Breadcrumb from "../../ui/Breadcrumb";
import API from "../../../services/api";
import "./InvoiceForm.css";

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { success, error } = useContext(ToastContext);
  const { user } = useAuth();

  const [items, setItems] = useState([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now() % 10000}`,
    clientName: "",
    clientEmail: "",
    taxRate: 0,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    const quantity = newItems[index].quantity || 0;
    const rate = newItems[index].rate || 0;
    newItems[index].amount = (quantity * rate).toFixed(2);

    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      0
    );
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  const handlePreview = () => {
    if (!formData.clientName || !formData.clientEmail) {
      return error(
        "Cliente faltante",
        "Completa el nombre y email del cliente."
      );
    }

    if (items.some((item) => !item.description)) {
      return error(
        "Servicios incompletos",
        "Todas las filas deben tener descripción."
      );
    }

    setShowPreview(true);
  };

  const handleSubmit = () => {
    const data = {
      invoiceNumber: formData.invoiceNumber,
      date: new Date().toLocaleDateString(),
      client: { name: formData.clientName, email: formData.clientEmail },
      worker: {
        name: user?.name,
        profession: user?.services?.[0]?.profession || "Trabajador",
      },
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
      subtotal: subtotal.toFixed(2),
      taxRate: formData.taxRate,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };

    try {
      generateInvoicePDF(data);
      success("Factura generada", "La factura se ha descargado como PDF.");
    } catch (err) {
      console.error("Error al generar PDF:", err);
      error("Error", "No se pudo generar la factura.");
    }
  };

  const handleSendByEmail = async () => {
    if (!formData.clientEmail) {
      return error("Falta email", "Agrega el email del cliente.");
    }

    setLoading(true);

    const data = {
      invoiceNumber: formData.invoiceNumber,
      date: new Date().toLocaleDateString(),
      client: { name: formData.clientName, email: formData.clientEmail },
      worker: {
        name: user?.name,
        profession: user?.professions?.[0] || "Trabajador",
      },
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
      subtotal: subtotal.toFixed(2),
      taxRate: formData.taxRate,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };

    try {
      let pdfBlob = null;
      try {
        const { jsPDF } = await import("jspdf");
        await import("jspdf-autotable");

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Factura", 14, 22);
        doc.setFontSize(12);
        doc.text(`Factura #: ${data.invoiceNumber}`, 14, 32);
        doc.text(`Fecha: ${data.date}`, 14, 40);

        doc.setFontSize(14);
        doc.text("Cliente", 14, 50);
        doc.setFontSize(12);
        doc.autoTable({
          startY: 55,
          head: [["Nombre", "Email"]],
          body: [[data.client.name, data.client.email]],
          theme: "grid",
          styles: { fontSize: 10 },
        });

        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(14);
        doc.text("Emisor", 14, finalY + 10);
        doc.autoTable({
          startY: finalY + 15,
          head: [["Nombre", "Oficio"]],
          body: [[data.worker.name, data.worker.profession]],
          theme: "grid",
          styles: { fontSize: 10 },
        });

        const finalY2 = doc.lastAutoTable.finalY;
        doc.setFontSize(14);
        doc.text("Servicios Prestados", 14, finalY2 + 10);
        doc.autoTable({
          startY: finalY2 + 15,
          head: [["Descripción", "Cantidad", "Precio", "Total"]],
          body: data.items.map((item) => [
            item.description,
            item.quantity,
            `$${item.rate}`,
            `$${item.amount}`,
          ]),
          theme: "striped",
          styles: { fontSize: 10 },
        });

        const finalY3 = doc.lastAutoTable.finalY;
        doc.setFontSize(12);
        doc.text(`Subtotal: $${data.subtotal}`, 140, finalY3 + 10);
        doc.text(
          `IVA (${data.taxRate}%): $${data.taxAmount}`,
          140,
          finalY3 + 20
        );
        doc.text(`Total: $${data.totalAmount}`, 140, finalY3 + 30);
        doc.setFontSize(11);
        doc.text("Gracias por su pago.", 14, finalY3 + 40);

        pdfBlob = doc.output("blob");
      } catch (pdfError) {
        console.warn(
          "⚠️ No se pudo generar PDF, se enviará sin adjunto:",
          pdfError
        );
      }

      const formDataToSend = new FormData();
      formDataToSend.append("to", data.client.email);
      formDataToSend.append(
        "subject",
        `Factura ${data.invoiceNumber} - ${data.worker.name}`
      );
      formDataToSend.append(
        "html",
        `<p>Hola ${data.client.name},</p><p>Adjunto encontrarás la factura por <strong>${data.totalAmount}</strong>.</p>`
      );

      if (pdfBlob) {
        const fileName = `factura_${data.invoiceNumber}_${data.client.name}.pdf`;
        formDataToSend.append("attachment", pdfBlob, fileName);
      }

      await API.post("/documents/send-email", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      success(
        "Factura enviada",
        `Factura enviada correctamente a ${data.client.email}`
      );
    } catch (err) {
      console.error("Error al enviar factura por email:", err);
      error("Error", "No se pudo enviar la factura por email.");
    } finally {
      setLoading(false);
      setShowPreview(false);
    }
  };

  const renderPreview = () => (
    <div className="invoice-preview">
      <h3>Vista previa de la factura</h3>
      <div className="preview-content">
        <div className="preview-header">
          <h4>Factura Nº: {formData.invoiceNumber}</h4>
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
        <table className="preview-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>${item.rate}</td>
                <td>${item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="preview-totals">
          <p>
            <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
          </p>
          <p>
            <strong>Impuesto ({formData.taxRate}%):</strong> $
            {taxAmount.toFixed(2)}
          </p>
          <p>
            <strong>Total:</strong> ${totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={handleSubmit} className="btn-download">
          <i className="fas fa-receipt"></i> Descargar PDF
        </button>
        <button
          type="button"
          onClick={handleSendByEmail}
          className="btn-send"
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Enviando...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i> Enviar por email
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

  if (showPreview) {
    return (
      <div className="document-form">
        <Breadcrumb
          items={[
            { label: "Inicio", path: "/dashboard" },
            { label: "Documentos", path: "/dashboard/documents" },
            { label: "Generar Factura", active: true },
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
          { label: "Generar Factura", active: true },
        ]}
      />

      <div className="welcome-card">
        <h1>Generar Factura</h1>
        <p>
          Emite facturas profesionales por servicios prestados. Agrega ítems,
          impuestos y envíalas fácilmente.
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="invoiceNumber">Número de factura *</label>
            <input
              id="invoiceNumber"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="taxRate">Tasa de impuesto (%)</label>
            <input
              id="taxRate"
              name="taxRate"
              type="number"
              value={formData.taxRate}
              onChange={handleChange}
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clientName">Nombre del cliente *</label>
            <input
              id="clientName"
              name="clientName"
              placeholder="Ej: Empresa XYZ"
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
              placeholder="Ej: contabilidad@empresa.com"
              value={formData.clientEmail}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <h3>Servicios Prestados</h3>
        <table className="items-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    placeholder="Servicio"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "quantity",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min="1"
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) =>
                      updateItem(index, "rate", parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    required
                  />
                </td>
                <td>${parseFloat(item.amount).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn-remove"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={addItem} className="btn-add-item">
          + Añadir servicio
        </button>

        <div className="invoice-totals">
          <div>
            Subtotal: <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div>
            Impuesto ({formData.taxRate}%):{" "}
            <strong>${taxAmount.toFixed(2)}</strong>
          </div>
          <div className="total">
            Total: <strong>${totalAmount.toFixed(2)}</strong>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handlePreview} className="btn-preview">
            <i className="fas fa-eye"></i> Generar Vista Previa
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
