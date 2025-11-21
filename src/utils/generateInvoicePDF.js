// src/utils/generateInvoicePDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Genera un PDF de factura profesional
export const generateInvoicePDF = (data) => {
  const doc = new jsPDF();

  // ===== ENCABEZADO =====
  doc.setFontSize(18);
  doc.text("Factura de Servicio", 14, 22);
  doc.setFontSize(12);
  doc.text(`Factura Nº: ${data.invoiceNumber}`, 14, 32);
  doc.text(`Fecha de emisión: ${data.date || new Date().toLocaleDateString()}`, 14, 40);

  // ===== CLIENTE =====
  doc.setFontSize(14);
  doc.text("Facturado a:", 14, 52);
  doc.setFontSize(12);
  autoTable(doc, {
    startY: 56,
    head: [["Nombre", "Email"]],
    body: [[data.client.name, data.client.email]],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // ===== EMISOR =====
  const finalY1 = doc.lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text("Emitido por:", 14, finalY1 + 10);
  autoTable(doc, {
    startY: finalY1 + 14,
    head: [["Nombre", "Profesión / Oficio"]],
    body: [[data.worker.name, data.worker.profession || "Trabajador independiente"]],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // ===== DESCRIPCIÓN GENERAL =====
  const finalY2 = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text("Descripción del Servicio", 14, finalY2);

  doc.setFontSize(11);
  const description = data.description
    ? data.description
    : "No se proporcionó una descripción detallada del servicio.";
  const descLines = doc.splitTextToSize(description, 180);
  doc.text(descLines, 14, finalY2 + 8);

  let currentY = finalY2 + descLines.length * 6 + 10;

  // ===== FECHAS =====
  if (data.startDate || data.endDate) {
    doc.setFontSize(12);
    if (data.startDate) doc.text(`Fecha de inicio: ${data.startDate}`, 14, currentY);
    if (data.endDate) doc.text(`Fecha tentativa de finalización: ${data.endDate}`, 100, currentY);
    currentY += 10;
  }

  // ===== SERVICIOS PRESTADOS =====
  doc.setFontSize(14);
  doc.text("Detalle de Servicios", 14, currentY);
  autoTable(doc, {
    startY: currentY + 5,
    head: [["Descripción", "Cantidad", "Precio Unit.", "Total"]],
    body: data.items.map((item) => [
      item.description,
      item.quantity,
      `$${parseFloat(item.rate).toFixed(2)}`,
      `$${parseFloat(item.amount).toFixed(2)}`,
    ]),
    theme: "striped",
    styles: { fontSize: 10 },
  });

  const finalY3 = doc.lastAutoTable.finalY + 10;

  // ===== RESUMEN DE MONTOS =====
  doc.setFontSize(12);
  doc.text(`Subtotal: $${data.subtotal}`, 140, finalY3);
  doc.text(`IVA (${data.taxRate}%): $${data.taxAmount}`, 140, finalY3 + 8);
  doc.text(`Total: $${data.totalAmount}`, 140, finalY3 + 16);

  // ===== NOTAS / ADVERTENCIAS =====
  const warnings = [
    "1. Esta factura corresponde a servicios efectivamente prestados.",
    "2. El pago debe realizarse en los plazos acordados con el proveedor.",
    "3. En caso de demoras o incumplimiento, se podrán aplicar intereses según la legislación vigente.",
    "4. Conservar este comprobante como respaldo de la transacción.",
    "5. El emisor declara que los datos aquí contenidos son verídicos y reflejan la operación efectuada.",
  ];

  const warningY = finalY3 + 35;
  doc.setFontSize(11);
  doc.text("Notas y condiciones:", 14, warningY);
  doc.setFontSize(10);
  const warningLines = warnings.flatMap((line) => doc.splitTextToSize(line, 180));
  doc.text(warningLines, 14, warningY + 6);

  // ===== MENSAJE FINAL =====
  const finalY4 = warningY + warningLines.length * 5 + 10;
  doc.setFontSize(11);
  doc.text("Gracias por confiar en nuestros servicios.", 14, finalY4);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Documento generado digitalmente – No requiere firma manuscrita.", 14, finalY4 + 8);

  // ===== GUARDADO =====
  const fileName = `factura_${data.invoiceNumber}_${data.client.name}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  doc.save(fileName);
};

