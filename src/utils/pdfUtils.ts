// src/utils/pdfUtils.ts

import jsPDF from "jspdf";
// 💡 Updated import path
import { RecipientData, SenderData } from "../types/document";

// TH Sarabun New font name (must be loaded in the main app before use)
const SARABUN_FONT = "THSarabunNew";
const LOGO_HEIGHT = 20.5; // Fixed height in mm (A4 Default)

// 💡 NEW: Interface for jsPDF Options to eliminate 'any'
interface JsPdfOptions {
  unit: "mm";
  orientation?: "portrait" | "landscape";
  // jsPDF format can be a standard string name or a custom [width, height] array
  format?: string | [number, number];
}

// 💡 PaperSizeOptions interface (as sent from App.tsx)
interface PaperSizeOptions {
  format?: string; // Known format name, allow string type for robustness
  width?: number; // Custom width in mm
  height?: number; // Custom height in mm
}

interface PdfGenerationArgs {
  recipientsData: RecipientData[];
  senderData: SenderData;
  stampText: string;
  greetingText: string;
  greetingPosition: "left" | "top";
  logoUrl: string;
  logoAspectRatio: number;
  // 💡 UPDATED: Custom Logo Size Parameters - ลบ logoCustomWidth ออก
  useCustomLogoSize: boolean;
  logoCustomHeight: number;
  // 💡 NEW: Paper size configuration
  paperSizeOptions: PaperSizeOptions;
}

/**
 * Creates a PDF document (A4 Landscape or Custom Size) containing sender info, stamp, logo,
 * and recipient details for multiple recipients, ensuring monochrome output.
 * @param args - Arguments including data, layout preferences, and logo details.
 * @returns Data URI string of the generated PDF.
 */
export const createPdfDataUri = (args: PdfGenerationArgs): string => {
  const {
    recipientsData,
    senderData,
    stampText,
    greetingText,
    greetingPosition,
    logoUrl,
    logoAspectRatio,
    // 💡 UPDATED: Destructure custom size params
    useCustomLogoSize,
    logoCustomHeight,
    // 💡 NEW: Destructure paper size options
    paperSizeOptions,
  } = args;

  // 💡 1. Determine PDF format and dimensions dynamically
  let pageWidth: number;
  let pageHeight: number;
  const pdfOptions: JsPdfOptions = { unit: "mm" };

  // 💡 FLAG เพื่อแยกการจัดวาง
  const isA4Landscape = paperSizeOptions.format === "A4";

  if (isA4Landscape) {
    // A4 Landscape (297x210 mm)
    pdfOptions.orientation = "landscape";
    pdfOptions.format = "a4";
    pageWidth = 297;
    pageHeight = 210;
  } else if (paperSizeOptions.width && paperSizeOptions.height) {
    // Custom Size (10.8x23.5 ซม. -> สลับเป็นแนวนอน 235x108 มม.)
    pdfOptions.orientation = "landscape";
    pdfOptions.format = [paperSizeOptions.height, paperSizeOptions.width];
    pageWidth = paperSizeOptions.height; // 235 mm
    pageHeight = paperSizeOptions.width; // 108 mm
  } else {
    // Default Fallback: A4 Landscape
    pdfOptions.orientation = "landscape";
    pdfOptions.format = "a4";
    pageWidth = 297;
    pageHeight = 210;
  }

  // 💡 2. Define Layout Constants conditionally
  const margin: number = isA4Landscape ? 20 : 10;
  const senderX: number = isA4Landscape ? margin : margin + 5;
  const senderYStart: number = isA4Landscape ? margin + 42 : margin + 15;
  const lineSpacing: number = isA4Landscape ? 8 : 6;
  const logoSenderGap: number = isA4Landscape ? 8 : 5;
  // 💡 NEW: Define default logo height conditionally
  const defaultLogoHeight: number = isA4Landscape ? LOGO_HEIGHT : 12; // CHANGED: 10mm for custom size
  const senderFontSize: number = isA4Landscape ? 18 : 14;
  const stampFontSize: number = isA4Landscape ? 14 : 12;
  const stampLineSpacing: number = isA4Landscape ? 7 : 5;
  // 💡 CHANGED: Adjusted factor from 0.45 to 0.44 for 2mm left shift on custom size
  const recipientBaseXFactor: number = isA4Landscape ? 0.3 : 0.38;
  const recipientBaseYFactor: number = isA4Landscape ? 0.6 : 0.5;
  const recipientLineSpacing: number = isA4Landscape ? 12 : 9;
  const recipientFontSize: number = isA4Landscape ? 26 : 20;
  // ค่าสำหรับบรรทัดสุดท้าย (รหัสไปรษณีย์)
  const recipientPostalYOffset: number = isA4Landscape ? 39 : 28;

  // 💡 Instantiate jsPDF with dynamic options
  const pdf = new jsPDF(pdfOptions);

  recipientsData.forEach((data, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    pdf.setFont(SARABUN_FONT, "normal");
    pdf.setTextColor(0, 0, 0); // Monochrome Black

    // --- 2. Sender Address
    let senderY = senderYStart;

    // 💡 3. กำหนดขนาดโลโก้
    let finalLogoWidth: number;
    let finalLogoHeight: number;

    if (useCustomLogoSize && logoCustomHeight > 0) {
      finalLogoHeight = logoCustomHeight;
      finalLogoWidth = finalLogoHeight * logoAspectRatio;
    } else {
      // 💡 UPDATED: ใช้ defaultLogoHeight ที่กำหนดแบบมีเงื่อนไข
      finalLogoHeight = defaultLogoHeight;
      finalLogoWidth = defaultLogoHeight * logoAspectRatio;
    }

    // --- 1. Logo Position Calculation
    const logoX = senderX;
    const logoY = senderY - finalLogoHeight - logoSenderGap;
    // --- End Logo Position Calculation

    // 💡 Logic: วาดเฉพาะเมื่อมี URL
    if (logoUrl) {
      try {
        pdf.addImage(
          logoUrl,
          "PNG", // Assuming PNG or compatible format
          logoX,
          logoY,
          finalLogoWidth, // 💡 UPDATED
          finalLogoHeight // 💡 UPDATED
        );
      } catch (error) {
        console.error("Error adding image to PDF from URL:", error);
      }
    }
    // --- End Logo

    // 💡 Sender Address - เริ่มต้น
    pdf.setFontSize(senderFontSize);
    pdf.setTextColor(0, 0, 0);

    // Document Number (Bold)
    pdf.setFont(SARABUN_FONT, "bold");
    pdf.text(senderData.documentNumber, senderX, senderY);
    senderY += lineSpacing;

    // Remaining sender info (Normal)
    pdf.setFont(SARABUN_FONT, "normal");
    const senderLines = [
      senderData.senderOrg,
      senderData.senderUniversity,
      senderData.senderAddress1,
      senderData.senderAddress2,
      senderData.senderPostal,
    ];
    senderLines.forEach((line) => {
      pdf.text(line, senderX, senderY);
      senderY += lineSpacing;
    });

    // --- 3. Stamp Box
    if (stampText && stampText.trim().length > 0) {
      pdf.setFontSize(stampFontSize);
      const stampLines = stampText.split("\n");

      const paddingX = 3;
      const paddingY = 1.5;

      let maxWidth = 0;
      stampLines.forEach((line) => {
        const width = pdf.getTextWidth(line);
        if (width > maxWidth) {
          maxWidth = width;
        }
      });

      const stampWidth = maxWidth + paddingX * 2;
      const stampHeight = stampLines.length * stampLineSpacing + paddingY * 2;

      const moveUpOffset = 5;
      const stampX = pageWidth - margin - stampWidth;
      const stampY = margin - moveUpOffset;
      const textStartOffset = 3.5;
      let currentY = stampY + paddingY + textStartOffset;

      pdf.setDrawColor(0, 0, 0);
      pdf.rect(stampX, stampY, stampWidth, stampHeight);
      pdf.setTextColor(0, 0, 0);

      stampLines.forEach((line) => {
        const textWidth = pdf.getTextWidth(line);
        pdf.text(line, stampX + (stampWidth - textWidth) / 2, currentY);
        currentY += stampLineSpacing;
      });
    }

    // --- 4. Recipient Details
    const recipientBaseX = pageWidth * recipientBaseXFactor;
    const recipientBaseY = pageHeight * recipientBaseYFactor;

    pdf.setFontSize(recipientFontSize);
    pdf.setFont(SARABUN_FONT, "bold");
    pdf.setTextColor(0, 0, 0);

    const labelWidth = pdf.getTextWidth(greetingText);
    const detailGap = isA4Landscape ? 8 : 5;
    let recipientDetailX;
    let startY = recipientBaseY;

    // Greeting position logic
    if (greetingText && greetingPosition === "left") {
      pdf.text(greetingText, recipientBaseX, recipientBaseY);
      recipientDetailX = recipientBaseX + labelWidth + detailGap;
    } else {
      if (greetingText) {
        pdf.text(
          greetingText,
          recipientBaseX,
          recipientBaseY - recipientLineSpacing
        );
      }
      recipientDetailX = recipientBaseX;
      startY = recipientBaseY;
    }

    // Print Recipient Data
    pdf.text(data.recipientTitle, recipientDetailX, startY);
    pdf.text(
      data.recipientAddress,
      recipientDetailX,
      startY + recipientLineSpacing
    );
    pdf.text(
      data.recipientProvince,
      recipientDetailX,
      startY + recipientLineSpacing * 2
    );
    // ใช้ค่า offset ที่แตกต่างกันสำหรับรหัสไปรษณีย์
    pdf.text(
      data.recipientPostal,
      recipientDetailX,
      startY + recipientPostalYOffset
    );
  });

  return pdf.output("datauristring");
};
