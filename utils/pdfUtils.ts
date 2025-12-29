
import { jsPDF } from "jspdf";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const downloadAsDoc = (text: string, filename: string, fontSize: number = 12, lineHeight: number = 1.5) => {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Tradução</title></head>
    <body style="font-family: Arial, sans-serif; font-size: ${fontSize}pt; line-height: ${lineHeight};">
  `;
  const footer = "</body></html>";
  const sourceHTML = header + text.replace(/\n/g, '<br>') + footer;

  const blob = new Blob(['\ufeff', sourceHTML], {
    type: 'application/msword'
  });

  saveFile(blob, filename, "doc");
};

export const downloadAsTxt = (text: string, filename: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveFile(blob, filename, "txt");
};

export const downloadAsPdf = async (text: string, filename: string, fontSize: number = 12, lineHeight: number = 1.5) => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;
  
  doc.setFontSize(fontSize);
  
  // Split text into lines that fit the page width
  const lines = doc.splitTextToSize(text, maxLineWidth);
  
  // Calculate line height in document units
  const lineHeightInPoints = fontSize * lineHeight;
  const lineHeightInDocUnits = (lineHeightInPoints * 25.4) / 72; // convert pt to mm (standard jsPDF units)
  
  let cursorY = margin + 10;
  const pageHeight = doc.internal.pageSize.getHeight();

  lines.forEach((line: string) => {
    if (cursorY + lineHeightInDocUnits > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 10;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeightInDocUnits;
  });
  
  const blob = doc.output('blob');
  saveFile(blob, filename, "pdf");
};

const saveFile = (blob: Blob, originalName: string, extension: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = originalName.replace(/\.[^/.]+$/, "");
  link.download = `${cleanName}_traduzido.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
