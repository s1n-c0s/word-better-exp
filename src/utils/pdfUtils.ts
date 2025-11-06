// src/utils/pdfUtils.ts

import jsPDF from "jspdf";
// 💡 Updated import path
import { RecipientData, SenderData } from "../types/document";

// TH Sarabun New font name (must be loaded in the main app before use)
const SARABUN_FONT = "THSarabunNew";
const LOGO_HEIGHT = 23.5; // Fixed height in mm

interface PdfGenerationArgs {
  recipientsData: RecipientData[];
  senderData: SenderData;
  stampText: string;
  greetingText: string;
  greetingPosition: "left" | "top";
  logoUrl: string;
  logoAspectRatio: number;
  // 💡 NEW: Custom Logo Size Parameters
  useCustomLogoSize: boolean;
  logoCustomWidth: number;
  logoCustomHeight: number;
}

/**
 * Creates a PDF document (A4 Landscape) containing sender info, stamp, logo,
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
    // 💡 NEW: Destructure custom size params
    useCustomLogoSize,
    logoCustomWidth,
    logoCustomHeight,
  } = args;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 20;

  recipientsData.forEach((data, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    pdf.setFont(SARABUN_FONT, "normal");
    pdf.setTextColor(0, 0, 0); // Monochrome Black

    // --- 2. Sender Address (Start calculation here)
    const senderX = margin;
    // 💡 UPDATED: ใช้ตำแหน่ง Y เริ่มต้นของผู้ส่ง 42mm จากขอบ (เหมือนเดิม)
    let senderY = margin + 42;
    const lineSpacing = 8;

    // 💡 NEW CALCULATION: ตำแหน่ง Y ของโลโก้
    // โลโก้จะถูกวางให้ส่วนล่างของโลโก้ (logoY + finalLogoHeight) มีระยะห่าง 5mm จาก senderY (บรรทัดแรกของผู้ส่ง)
    const LOGO_SENDER_GAP = 8;

    // 💡 1. กำหนดขนาดโลโก้
    let finalLogoWidth: number;
    let finalLogoHeight: number;

    if (useCustomLogoSize && logoCustomWidth > 0 && logoCustomHeight > 0) {
      // ใช้ขนาดที่ผู้ใช้กำหนดเอง
      finalLogoWidth = logoCustomWidth;
      finalLogoHeight = logoCustomHeight;
    } else {
      // ใช้การคำนวณจาก Aspect Ratio และความสูงคงที่ (ค่าเริ่มต้น)
      finalLogoHeight = LOGO_HEIGHT;
      finalLogoWidth = LOGO_HEIGHT * logoAspectRatio;
    }

    // --- 1. Logo Position Calculation
    const logoX = margin;
    // 💡 CHANGED: คำนวณ logoY จาก senderY
    const logoY = senderY - finalLogoHeight - LOGO_SENDER_GAP;
    // --- End Logo Position Calculation

    function drawDefaultGaruda() {
      // ฟังก์ชันสำหรับวาดสัญลักษณ์เริ่มต้น (Mock-up)
      const placeholderSize = LOGO_HEIGHT;

      // Draw white background circle
      pdf.setFillColor(255, 255, 255);
      pdf.circle(
        logoX + placeholderSize / 2,
        logoY + placeholderSize / 2,
        placeholderSize / 2,
        "F"
      );

      // Draw black border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.25);
      pdf.circle(
        logoX + placeholderSize / 2,
        logoY + placeholderSize / 2,
        placeholderSize / 2,
        "S"
      );

      // Draw placeholder text
      pdf.setFont(SARABUN_FONT, "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      const garudaText = "สัญลักษณ์";
      const garudaTextWidth = pdf.getTextWidth(garudaText);
      pdf.text(
        garudaText,
        logoX + (placeholderSize - garudaTextWidth) / 2,
        logoY + placeholderSize / 2 + 2
      );
      pdf.setTextColor(0, 0, 0);
    }

    // 💡 Logic: วาดเฉพาะเมื่อมี URL หรือเมื่อเกิด Error ในการโหลด URL
    if (logoUrl) {
      try {
        // Image URL
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
        // วาด Mock-up หากการโหลด URL ล้มเหลว
        drawDefaultGaruda();
      }
    }
    // 💡 หาก logoUrl ว่างเปล่า จะไม่วาดอะไรเลยตามคำขอ
    // --- End Logo

    // 💡 Sender Address - เริ่มต้นที่บรรทัดถัดไป
    pdf.setFontSize(18);
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
      pdf.setFontSize(14);
      const stampLines = stampText.split("\n");

      const paddingX = 3;
      const paddingY = 1.5;
      const stampLineSpacing = 7;

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
    const recipientBaseX = pageWidth * 0.3;
    const recipientBaseY = pageHeight * 0.6;
    const recipientLineSpacing = 12;

    pdf.setFontSize(26);
    pdf.setFont(SARABUN_FONT, "bold");
    pdf.setTextColor(0, 0, 0);

    const labelWidth = pdf.getTextWidth(greetingText);
    const detailGap = 8;
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
    pdf.text(data.recipientPostal, recipientDetailX, startY + 39);
  });

  return pdf.output("datauristring");
};
