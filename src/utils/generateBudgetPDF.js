// src/utils/generateBudgetPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Firma por defecto (un punto transparente válido para evitar errores)
const DEFAULT_SIGNATURE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA6/tX5gAAAABJRU5ErkJggg==";

/**
 * Genera el PDF de presupuesto en memoria o descarga el archivo.
 * @param {Object} data - Datos del presupuesto
 * @param {boolean} returnBlob - Si true, devuelve un Blob para adjuntar al email
 */
export const generateBudgetPDF = (data, returnBlob = false) => {
  const doc = new jsPDF();

  // ✅ Encabezado
  doc.setFontSize(18);
  doc.text("Presupuesto de Servicio", 14, 22);
  doc.setFontSize(12);
  doc.text(`Fecha: ${data.date || new Date().toLocaleDateString("es-AR")}`, 14, 32);
  if (data.validUntil) doc.text(`Válido hasta: ${data.validUntil}`, 14, 40);

  // ✅ Cliente
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

  // ✅ Profesional
  const finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text("Profesional", 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [["Nombre", "Oficio"]],
    body: [[data.worker?.name || "Profesional", data.worker?.profession || "Servicio"]],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // ✅ Detalle
  const finalY2 = doc.lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text("Detalle del Presupuesto", 14, finalY2 + 10);

  const items = data.items?.length
    ? data.items
    : [
        {
          description: data.service || "Servicio",
          quantity: 1,
          rate: data.hourlyRate || 0,
          amount: data.totalAmount || 0,
        },
      ];

  autoTable(doc, {
    startY: finalY2 + 15,
    head: [["Descripción", "Cant.", "Precio Unit.", "Total"]],
    body: items.map((item) => [
      item.description || "-",
      item.quantity || 1,
      `$${parseFloat(item.rate || 0).toFixed(2)}`,
      `$${parseFloat(item.amount || 0).toFixed(2)}`,
    ]),
    theme: "striped",
    styles: { fontSize: 10 },
  });

  const finalY3 = doc.lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.text(
    `Total estimado: $${parseFloat(data.totalAmount || 0).toFixed(2)}`,
    14,
    finalY3 + 10
  );

  // ✅ Firma
  const signature =
    data.worker?.signature && data.worker.signature.startsWith("data:image")
      ? data.worker.signature
      : DEFAULT_SIGNATURE_BASE64;

  try {
    doc.addImage(signature, "PNG", 14, finalY3 + 20, 60, 15);
    doc.setFontSize(10);
    doc.text("Firma del profesional", 14, finalY3 + 40);
    doc.text(data.worker?.name || "Profesional", 14, finalY3 + 45);
  } catch (e) {
    console.warn("⚠️ No se pudo insertar la firma:", e.message);
  }

  // ✅ Nota legal
  doc.setFontSize(11);
  doc.text(
    "Este presupuesto es una estimación y no constituye un contrato.",
    14,
    finalY3 + 60
  );

  const fileName = `presupuesto_${data.client?.name || "cliente"}_${
    data.service || "servicio"
  }_${new Date().toISOString().slice(0, 10)}.pdf`;

  // ✅ Si el PDF es para adjuntar (no descargar)
  if (returnBlob) {
    const pdfBlob = doc.output("blob");
    return { pdfBlob, fileName };
  }

  // ✅ Si el PDF es para descargar
  doc.save(fileName);
};

