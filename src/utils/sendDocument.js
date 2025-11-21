// frontend/src/utils/sendDocument.js
import API from '../services/api';
import { generateBudgetPDF } from './generateBudgetPDF';
import { generateContractPDF } from './generateContractPDF';
import { generateInvoicePDF } from './generateInvoicePDF';

export const sendDocument = async (type, data, recipientId, successCallback) => {
  try {
    let pdfData;

    // Generar PDF en memoria (sin descargar)
    if (type === 'budget') {
      pdfData = { ...data, type: 'Presupuesto' };
      generateBudgetPDF(pdfData);
    } else if (type === 'contract') {
      pdfData = { ...data, type: 'Contrato' };
      generateContractPDF(pdfData);
    } else if (type === 'invoice') {
      pdfData = { ...data, type: 'Factura' };
      generateInvoicePDF(pdfData);
    }

    // Enviar mensaje con referencia
    await API.post('/api/send', {
      recipient: recipientId,
      content: `Te envío un ${pdfData.type} en PDF.`
    });

    if (successCallback) successCallback();
  } catch (err) {
    console.error('Error al enviar documento:', err);
  }
};
