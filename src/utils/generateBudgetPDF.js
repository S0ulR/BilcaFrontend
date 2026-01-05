// src/utils/generateBudgetPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DEFAULT_SIGNATURE_TEXT = "Firma Digital";

// Función para formatear precios
const formatPrice = (value) => {
  if (!value || value === "N/A" || value === "A coordinar") {
    return "No especificado";
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return "No especificado";
  }
  return `$${num.toFixed(2)}`;
};

// Función para formatear cantidades/tiempo
const formatQuantity = (value) => {
  return value && value !== "N/A" ? value : "No especificado";
};

export const generateBudgetPDF = (data, returnBlob = false) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Presupuesto de Servicio", 14, 22);
  doc.setFontSize(12);
  doc.text(
    `Fecha: ${data.date || new Date().toLocaleDateString("es-AR")}`,
    14,
    32
  );
  if (data.validUntil) doc.text(`Válido hasta: ${data.validUntil}`, 14, 40);

  doc.setFontSize(14);
  doc.text("Cliente", 14, 50);
  doc.setFontSize(12);
  autoTable(doc, {
    startY: 55,
    head: [["Nombre", "Contacto"]],
    body: [[data.client?.name || "-", data.client?.email || "-"]],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  const finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text("Profesional", 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [["Nombre", "Oficio"]],
    body: [[data.worker?.name || "Profesional", data.service || "Servicio"]],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  const finalY2 = doc.lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text("Detalle del Presupuesto", 14, finalY2 + 10);

  const items = data.items?.length
    ? data.items
    : [
        {
          description:
            data.description || data.service || "Servicio no especificado",
          quantity: data.estimatedTime || "-",
          rate: data.hourlyRate || data.totalBudget || "A coordinar",
          amount: data.totalAmount || "A coordinar",
        },
      ];

  autoTable(doc, {
    startY: finalY2 + 15,
    head: [["Descripción", "Tiempo estimado", "Precio", "Total"]],
    body: items.map((item) => [
      item.description || "Sin descripción",
      formatQuantity(item.quantity),
      formatPrice(item.rate),
      item.amount === "A coordinar" ? "A coordinar" : formatPrice(item.amount),
    ]),
    theme: "striped",
    styles: { fontSize: 10 },
  });

  const finalY3 = doc.lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.text(
    data.totalAmount === "A coordinar"
      ? "Total estimado: A coordinar"
      : `Total estimado: ${formatPrice(data.totalAmount)}`,
    14,
    finalY3 + 10
  );

  // Firma: si no hay imagen válida, muestra texto
  const hasValidSignature =
    data.worker?.signature &&
    data.worker.signature.startsWith("data:image") &&
    data.worker.signature.length > 100;

  if (hasValidSignature) {
    try {
      doc.addImage(data.worker.signature, "PNG", 14, finalY3 + 20, 60, 15);
      doc.setFontSize(10);
      doc.text("Firma del profesional", 14, finalY3 + 40);
    } catch (e) {
      console.warn("⚠️ Firma no válida, usando texto:", e.message);
      doc.setFontSize(10);
      doc.text(DEFAULT_SIGNATURE_TEXT, 14, finalY3 + 20);
      doc.text("Firma del profesional", 14, finalY3 + 25);
    }
  } else {
    // Mostrar texto en lugar de rectángulo lila
    doc.setFontSize(10);
    doc.text(DEFAULT_SIGNATURE_TEXT, 14, finalY3 + 20);
    doc.text("Firma del profesional", 14, finalY3 + 25);
  }

  doc.setFontSize(11);
  doc.text(
    "Este presupuesto es una estimación y no constituye un contrato.",
    14,
    finalY3 + 45
  );

  const fileName = `presupuesto_${data.client?.name || "cliente"}_${
    data.service || "servicio"
  }_${new Date().toISOString().slice(0, 10)}.pdf`;

  if (returnBlob) {
    const pdfBlob = doc.output("blob");
    return { pdfBlob, fileName };
  }

  doc.save(fileName);
};
