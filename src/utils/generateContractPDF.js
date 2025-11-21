// src/utils/generateContractPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Firma por defecto (base64 de una imagen PNG mínima válida)
const DEFAULT_SIGNATURE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA6/tX5gAAAABJRU5ErkJggg==";

export const generateContractPDF = (data) => {
  const doc = new jsPDF();

  // --- Título ---
  doc.setFontSize(18);
  doc.text("Contrato de Prestación de Servicios", 14, 22);
  doc.setFontSize(12);
  doc.text(`Fecha de emisión: ${data.date || new Date().toLocaleDateString()}`, 14, 32);

  // --- Cliente ---
  doc.setFontSize(14);
  doc.text("Datos del Cliente", 14, 45);
  doc.setFontSize(12);
  autoTable(doc, {
    startY: 50,
    head: [["Nombre", "Email"]],
    body: [[data.client.name, data.client.email]],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // --- Trabajador ---
  const finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(14);
  doc.text("Datos del Trabajador", 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [["Nombre", "Oficio / Servicio", "Email"]],
    body: [
      [
        data.worker.name,
        data.worker.profession || "Servicio contratado",
        data.worker.email || "N/A",
      ],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // --- Detalles del servicio ---
  let currentY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("Detalles del Servicio", 14, currentY);
  doc.setFontSize(12);
  currentY += 10;

  if (data.service) {
    doc.text(`Servicio: ${data.service}`, 14, currentY);
    currentY += 8;
  }

  if (data.description) {
    const descLines = doc.splitTextToSize(`Descripción: ${data.description}`, 180);
    doc.text(descLines, 14, currentY);
    currentY += descLines.length * 6 + 4;
  }

  if (data.startDate) {
    doc.text(`Fecha de inicio: ${data.startDate}`, 14, currentY);
    currentY += 8;
  }

  if (data.endDate) {
    doc.text(`Fecha tentativa de finalización: ${data.endDate}`, 14, currentY);
    currentY += 8;
  }

  if (data.hourlyRate) {
    doc.text(`Tarifa por hora: $${parseFloat(data.hourlyRate).toFixed(2)}`, 14, currentY);
    currentY += 8;
  }

  if (data.totalAmount) {
    doc.text(`Monto total acordado: $${parseFloat(data.totalAmount).toFixed(2)}`, 14, currentY);
    currentY += 10;
  }

  // --- Cláusulas y advertencias ---
  doc.setFontSize(11);
  const terms = `
Las partes acuerdan las siguientes condiciones:

1. El trabajador se compromete a realizar el servicio mencionado de acuerdo con las especificaciones acordadas.
2. El cliente se compromete a abonar el monto pactado en tiempo y forma, según lo convenido.
3. Cualquier modificación en el alcance del servicio deberá ser aprobada por ambas partes por escrito.
4. El contratista no será responsable por demoras ocasionadas por causas ajenas a su control.
5. Este contrato tiene carácter confidencial y no podrá ser divulgado sin el consentimiento de ambas partes.
6. En caso de incumplimiento, ambas partes podrán resolver el contrato previo aviso formal.
7. La aceptación de este contrato implica la conformidad plena con los términos aquí expuestos.
`;

  const termLines = doc.splitTextToSize(terms.trim(), 180);
  doc.text(termLines, 14, currentY + 10);
  currentY += termLines.length * 6 + 10;

  // --- Firmas ---
  const signatureY = currentY + 10;
  const imgWidth = 60;
  const imgHeight = 15;

  // Firma del cliente
  const addSignature = (sigData, x, y, label, name) => {
    try {
      doc.addImage(sigData || DEFAULT_SIGNATURE_BASE64, "PNG", x, y, imgWidth, imgHeight);
    } catch (e) {
      console.warn(`Firma inválida para ${label}, usando predeterminada:`, e.message);
      doc.addImage(DEFAULT_SIGNATURE_BASE64, "PNG", x, y, imgWidth, imgHeight);
    }
    doc.setFontSize(10);
    doc.text(label, x, y + imgHeight + 5);
    doc.text(name, x, y + imgHeight + 10);
  };

  addSignature(data.client.signature, 14, signatureY, "Firma del Cliente", data.client.name);
  addSignature(
    data.worker.signature,
    14 + imgWidth + 20,
    signatureY,
    "Firma del Trabajador",
    data.worker.name
  );

  // --- Nota legal ---
  const finalY3 = signatureY + imgHeight + 20;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    "Este documento es válido como acuerdo legal entre las partes y no requiere certificación adicional.",
    14,
    finalY3
  );

  // --- Guardar PDF ---
  const fileName = `contrato_${data.client.name}_${data.service}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  doc.save(fileName);
};
