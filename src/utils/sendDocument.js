// frontend/src/utils/sendDocument.js
import API from "../services/api";
import { generateBudgetPDF } from "./generateBudgetPDF";
import { generateContractPDF } from "./generateContractPDF";
import { generateInvoicePDF } from "./generateInvoicePDF";

export const sendDocument = async (
  type,
  data,
  recipientId,
  successCallback
) => {
  try {
    let pdfData;

    // ✅ Generar PDF en memoria (sin descargar)
    if (type === "budget") {
      pdfData = { ...data, type: "Presupuesto" };
      const { pdfBlob, fileName } = generateBudgetPDF(pdfData, true);
      // Enviar por email (ya implementado en BudgetForm.js)
    } else if (type === "contract") {
      pdfData = { ...data, type: "Contrato" };
      const { pdfBlob, fileName } = generateContractPDF(pdfData, true);
      // Enviar por email (ya implementado en ContractForm.js)
    } else if (type === "invoice") {
      pdfData = { ...data, type: "Factura" };
      const { pdfBlob, fileName } = generateInvoicePDF(pdfData, true);
      // Enviar por email (ya implementado en InvoiceForm.js)
    }

    await API.post("/messages/send", {
      recipient: recipientId,
      content: `Te envío un ${pdfData.type} en PDF. Puedes verlo en el historial de documentos.`,
    });

    if (successCallback) successCallback();
  } catch (err) {
    console.error("Error al enviar documento:", err);
  }
};
