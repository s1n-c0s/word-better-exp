import { useState, useEffect, useCallback } from "react";
import { Download, FileText, RotateCw } from "lucide-react";
import jsPDF from "jspdf";
// ไฟล์ฟอนต์ที่ถูกแปลงแล้ว: ตรวจสอบให้แน่ใจว่าไฟล์เหล่านี้ถูกโหลดในโปรเจกต์ของคุณ
import "./fonts/thsarabunnew-normal.js";
import "./fonts/thsarabunnew-bold.js";

// TH Sarabun New font will be embedded
const SARABUN_FONT = "THSarabunNew";
const GARUDA_EMBLEM_WIDTH = 15;
const GARUDA_EMBLEM_HEIGHT = 15;

export default function DocumentEditor() {
  const [isLandscape, setIsLandscape] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");

  // ข้อมูลผู้ส่ง/ผู้รับ
  const [documentNumber, setDocumentNumber] = useState(
    "ที่ อว. 0603.32.01/ว 249"
  );
  const [senderOrg, setSenderOrg] = useState(
    "วิทยาลัยเพื่อการค้นคว้าระดับรากฐาน"
  );
  const [senderUniversity, setSenderUniversity] = useState("มหาวิทยาลัยนเรศวร");
  const [senderAddress1, setSenderAddress1] = useState(
    "เลขที่ 99 หมู่ที่ 9 ตำบลท่าโพธิ์"
  );
  const [senderAddress2, setSenderAddress2] = useState(
    "อำเภอเมือง จังหวัดพิษณุโลก"
  );
  const [senderPostal, setSenderPostal] = useState("65000");

  const [recipientTitle, setRecipientTitle] = useState(
    "ผู้อำนวยการโรงเรียนอุทัยธานีวิทยาคม"
  );
  const [recipientAddress, setRecipientAddress] = useState(
    "55 หมู่ 2 ตำบลสะแกกรัง อำเภอเมือง"
  );
  const [recipientProvince, setRecipientProvince] =
    useState("จังหวัดอุทัยธานี");
  const [recipientPostal, setRecipientPostal] = useState("61000");

  const [stampText, setStampText] = useState(
    "ชำระค่าฝากส่งเป็นรายเดือน\nใบอนุญาตเลขที่ ๘๕/๒๕๒๑\nพิษณุโลก"
  );

  // ฟังก์ชันสร้าง PDF และคืนค่า Data URI string (สำหรับ Preview และ Download)
  const generatePdfDataUri = useCallback(() => {
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const margin = 20;

    pdf.setFont(SARABUN_FONT, "normal");

    // --- 1. ตราครุฑ
    const emblemX = margin + 15;
    const emblemY = margin + 15;
    // pdf.circle(emblemX, emblemY, 7);

    // --- 2. ที่อยู่ผู้ส่ง (18px)
    const senderX = margin;
    let senderY = margin + 40;
    const lineSpacing = 8;

    pdf.setFontSize(18);

    // บรรทัดที่ 1: เลขที่หนังสือ (Bold ทั้งบรรทัด)
    pdf.setFont(SARABUN_FONT, "bold");
    pdf.text(documentNumber, senderX, senderY);
    senderY += lineSpacing;

    // ส่วนที่เหลือ: องค์กร ที่อยู่ (Normal)
    pdf.setFont(SARABUN_FONT, "normal");
    const senderLines = [
      senderOrg,
      senderUniversity,
      senderAddress1,
      senderAddress2,
      senderPostal,
    ];
    senderLines.forEach((line) => {
      pdf.text(line, senderX, senderY);
      senderY += lineSpacing;
    });

    // --- 3. ตราประทับ (Stamp Box - ปรับขนาดให้พอดีกับเนื้อหา)

    // ตั้งค่าฟอนต์ 14px ก่อนคำนวณ
    pdf.setFontSize(14);
    const stampLines = stampText.split("\n");

    const paddingX = 3;
    const paddingY = 1.0; // 💡 ปรับลดขอบแนวตั้งให้ชิดที่สุด (1.0mm)
    const stampLineSpacing = 7;

    // 1. หาความกว้างสูงสุดของข้อความทั้งหมด
    let maxWidth = 0;
    stampLines.forEach((line) => {
      const width = pdf.getTextWidth(line);
      if (width > maxWidth) {
        maxWidth = width;
      }
    });

    // 2. คำนวณความกว้างและความสูงของกล่อง
    const stampWidth = maxWidth + paddingX * 2;
    const stampHeight = stampLines.length * stampLineSpacing + paddingY * 2;

    // 3. คำนวณตำแหน่ง X และ Y
    const moveUpOffset = 5;
    const stampX = pageWidth - margin - stampWidth;
    const stampY = margin - moveUpOffset; // ตำแหน่ง Y ใหม่ของกล่อง

    // 4. คำนวณจุดเริ่มต้น Y ของข้อความเพื่อให้จัดกึ่งกลางแนวตั้งพอดี
    // 💡 ปรับ Text Offset ลงเล็กน้อยเพื่อดึงข้อความให้ชิดขอบล่างมากขึ้น
    const textStartOffset = 3.5;
    let currentY = stampY + paddingY + textStartOffset;

    // วาดกรอบสี่เหลี่ยม
    pdf.rect(stampX, stampY, stampWidth, stampHeight);

    // พิมพ์ข้อความแต่ละบรรทัด (อยู่กึ่งกลางกล่อง)
    stampLines.forEach((line) => {
      const textWidth = pdf.getTextWidth(line);

      // จัดให้อยู่กึ่งกลางแนวนอน
      pdf.text(line, stampX + (stampWidth - textWidth) / 2, currentY);
      currentY += stampLineSpacing;
    });

    // --- 4. ผู้รับ (26px, Bold ทั้งหมด)

    const recipientBaseX = pageWidth * 0.35;
    const recipientBaseY = pageHeight * 0.55;
    const recipientLineSpacing = 12;

    pdf.setFontSize(26);
    pdf.setFont(SARABUN_FONT, "bold");

    const recipientLabel = "เรียน";

    pdf.text(recipientLabel, recipientBaseX, recipientBaseY);

    const labelWidth = pdf.getTextWidth(recipientLabel);
    const detailGap = 8;
    const recipientDetailX = recipientBaseX + labelWidth + detailGap;

    pdf.text(recipientTitle, recipientDetailX, recipientBaseY);
    pdf.text(
      recipientAddress,
      recipientDetailX,
      recipientBaseY + recipientLineSpacing
    );
    pdf.text(
      recipientProvince,
      recipientDetailX,
      recipientBaseY + recipientLineSpacing * 2
    );
    pdf.text(recipientPostal, recipientDetailX, recipientBaseY + 39);

    // คืนค่า Data URI String
    return pdf.output("datauristring");
  }, [
    isLandscape,
    documentNumber,
    senderOrg,
    senderUniversity,
    senderAddress1,
    senderAddress2,
    senderPostal,
    recipientTitle,
    recipientAddress,
    recipientProvince,
    recipientPostal,
    stampText,
  ]);

  // Effect สำหรับอัปเดต Preview ทุกครั้งที่ข้อมูลเปลี่ยน
  useEffect(() => {
    const dataUri = generatePdfDataUri();
    setPdfUrl(dataUri);
  }, [generatePdfDataUri]);

  // ฟังก์ชันสำหรับ Download PDF จริงๆ
  const handleDownload = () => {
    const pdfDataUri = generatePdfDataUri();
    // ใช้ Data URI ในการสร้างลิงก์ดาวน์โหลด
    const a = document.createElement("a");
    a.href = pdfDataUri;
    a.download = "envelope-label.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Thai Official Envelope Label Editor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 mr-2 hidden sm:block">
              Export: PDF
            </div>
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:-bg-gray-600 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              {isLandscape ? "Portrait" : "Landscape"}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* --- Main Content: ส่วน Preview PDF (ใช้ iframe) --- */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 lg:w-3/5 overflow-auto p-4 lg:p-8 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            <div
              className={`transition-all bg-white shadow-lg ${
                isLandscape
                  ? "w-full max-w-[95%] aspect-[1.414/1]"
                  : "w-full max-w-3xl aspect-[1/1.414]"
              } p-2`}
            >
              {/* ใช้ Data URI ใน src ของ iframe */}
              {pdfUrl ? (
                <iframe
                  title="PDF Preview"
                  src={pdfUrl}
                  className="w-full h-full border-none"
                  type="application/pdf"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  กำลังโหลด PDF Preview...
                </div>
              )}
            </div>
          </div>

          {/* Input Form Panel (มีส่วน Preview JSX อยู่ด้านใน) */}
          <div className="w-full lg:w-2/5 bg-white dark:bg-gray-800 overflow-auto border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
            <div className="p-4 lg:p-6">
              <div className="max-w-xl mx-auto space-y-4 lg:space-y-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4">
                  ข้อมูลซองจดหมาย
                </h2>

                {/* Sender Section */}
                <div className="space-y-2 lg:space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm lg:text-base font-semibold text-green-600 dark:text-green-400">
                    ผู้ส่ง (Sender)
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      เลขที่หนังสือ
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      หน่วยงาน
                    </label>
                    <input
                      type="text"
                      value={senderOrg}
                      onChange={(e) => setSenderOrg(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      สถาบัน/มหาวิทยาลัย
                    </label>
                    <input
                      type="text"
                      value={senderUniversity}
                      onChange={(e) => setSenderUniversity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ที่อยู่ บรรทัดที่ 1
                    </label>
                    <input
                      type="text"
                      value={senderAddress1}
                      onChange={(e) => setSenderAddress1(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ที่อยู่ บรรทัดที่ 2
                    </label>
                    <input
                      type="text"
                      value={senderAddress2}
                      onChange={(e) => setSenderAddress2(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      รหัสไปรษณีย์
                    </label>
                    <input
                      type="text"
                      value={senderPostal}
                      onChange={(e) => setSenderPostal(e.target.value)}
                      maxLength={5}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* --- JSX Preview: Sender Info --- */}
                  <div className="mt-4 p-3 border border-dashed border-gray-400 rounded-md">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Preview (18px)
                    </p>

                    <div className="space-y-0.5 text-gray-900 text-base">
                      {/* บรรทัดที่ 1: Bold ทั้งบรรทัด */}
                      <div className="font-extrabold text-lg leading-tight">
                        {documentNumber}
                      </div>
                      {/* บรรทัดอื่น ๆ: Normal */}
                      <div className="font-normal text-lg leading-tight">
                        {senderOrg}
                      </div>
                      <div className="font-normal text-lg leading-tight">
                        {senderUniversity}
                      </div>
                      <div className="font-normal text-lg leading-tight">
                        {senderAddress1}
                      </div>
                      <div className="font-normal text-lg leading-tight">
                        {senderAddress2}
                      </div>
                      <div className="font-normal text-lg leading-tight">
                        {senderPostal}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient Section */}
                <div className="space-y-2 lg:space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm lg:text-base font-semibold text-blue-600 dark:text-blue-400">
                    ผู้รับ (Recipient)
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ชื่อผู้รับ/หน่วยงาน
                    </label>
                    <input
                      type="text"
                      value={recipientTitle}
                      onChange={(e) => setRecipientTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ที่อยู่
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      จังหวัด
                    </label>
                    <input
                      type="text"
                      value={recipientProvince}
                      onChange={(e) => setRecipientProvince(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      รหัสไปรษณีย์
                    </label>
                    <input
                      type="text"
                      value={recipientPostal}
                      onChange={(e) => setRecipientPostal(e.target.value)}
                      maxLength={5}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* --- JSX Preview: Recipient Info --- */}
                  <div className="mt-4 p-3 border border-dashed border-gray-400 rounded-md">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Preview (26px Bold)
                    </p>

                    {/* จำลองการจัดคอลัมน์ "เรียน" | [รายละเอียด] */}
                    <div className="flex space-x-3 text-gray-900 font-extrabold text-2xl">
                      <div className="flex-shrink-0">เรียน</div>
                      <div className="flex-grow space-y-2">
                        <div className="leading-tight">{recipientTitle}</div>
                        <div className="leading-tight">{recipientAddress}</div>
                        <div className="leading-tight">{recipientProvince}</div>
                        <div className="font-extrabold leading-tight pt-2">
                          {recipientPostal}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stamp Section */}
                <div className="space-y-2 lg:space-y-3">
                  <h3 className="text-sm lg:text-base font-semibold text-purple-600 dark:text-purple-400">
                    ตราประทับ (Stamp)
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ข้อความตราประทับ
                    </label>
                    <textarea
                      value={stampText}
                      onChange={(e) => setStampText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>

                  {/* --- JSX Preview: Stamp Info --- */}
                  <div className="mt-4 p-3 border border-dashed border-gray-400 rounded-md text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Preview (14px)
                    </p>
                    <p className="text-base whitespace-pre-line leading-snug">
                      {stampText}
                    </p>
                  </div>
                </div>

                {/* PDF Export Note */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>หมายเหตุ:</strong> ไฟล์ PDF จะใช้ฟอนต์ **TH Sarabun
                    New** ที่ถูกฝังไว้แล้ว โปรดตรวจสอบว่าไฟล์ฟอนต์ .js
                    ถูกนำเข้าอย่างถูกต้อง
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
