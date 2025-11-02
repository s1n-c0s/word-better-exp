import { useState, useEffect, useCallback } from "react";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
// ไฟล์ฟอนต์ที่ถูกแปลงแล้ว: ตรวจสอบให้แน่ใจว่าไฟล์เหล่านี้ถูกโหลดในโปรเจกต์ของคุณ
import "./fonts/thsarabunnew-normal.js";
import "./fonts/thsarabunnew-bold.js";

// TH Sarabun New font will be embedded
const SARABUN_FONT = "THSarabunNew";
const GARUDA_EMBLEM_WIDTH = 15;
const GARUDA_EMBLEM_HEIGHT = 15;

// กำหนดข้อความตราประทับมาตรฐานเป็นค่าคงที่
const DEFAULT_STAMP_TEXT =
  "ชำระค่าฝากส่งเป็นรายเดือน\nใบอนุญาตเลขที่ ๘๕/๒๕๒๑\nพิษณุโลก";

export default function DocumentEditor() {
  const [pdfUrl, setPdfUrl] = useState("");

  // State สำหรับ 10 บรรทัดแรก (Copy/Paste)
  const [csvInput, setCsvInput] = useState("");

  // State สำหรับเก็บข้อความตราประทับเมื่อ Toggle ถูกเปิด (แสดงตลอด)
  const [manualStampInput, setManualStampInput] = useState(
    DEFAULT_STAMP_TEXT.replace(/\n/g, "\\n")
  );

  // 💡 การแก้ไข 1: State ควบคุมการปิดการใช้งาน (ค่าเริ่มต้น: FALSE = เปิดใช้งานอยู่)
  const [disableStamp, setDisableStamp] = useState(false); // False = Stamp ON

  // ข้อมูลผู้ส่ง/ผู้รับ (ไม่เปลี่ยนแปลง)
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

  // Stamp Text State: ถูกควบคุมโดย useEffect ด้านล่าง
  // 💡 การแก้ไข 2: เริ่มต้นด้วย manualStampInput (ซึ่งคือค่ามาตรฐาน)
  const [stampText, setStampText] = useState(DEFAULT_STAMP_TEXT);

  // Parse ข้อมูล 10 บรรทัด (Sender/Recipient)
  const parseCsvInput = useCallback((input) => {
    const lines = input.split("\n").map((line) => line.trim());

    if (lines.length >= 10) {
      setDocumentNumber(lines[0] || "");
      setSenderOrg(lines[1] || "");
      setSenderUniversity(lines[2] || "");
      setSenderAddress1(lines[3] || "");
      setSenderAddress2(lines[4] || "");
      setSenderPostal(lines[5] || "");
      setRecipientTitle(lines[6] || "");
      setRecipientAddress(lines[7] || "");
      setRecipientProvince(lines[8] || "");
      setRecipientPostal(lines[9] || "");
    }
  }, []);

  // Handler สำหรับช่องกรอกข้อมูล 10 บรรทัด
  const handleCsvChange = (e) => {
    const value = e.target.value;
    setCsvInput(value);
    parseCsvInput(value);
  };

  // Handler สำหรับช่องกรอกข้อมูลตราประทับที่แยกออกมา
  const handleManualStampChange = (e) => {
    const value = e.target.value;
    setManualStampInput(value);
  };

  // 💡 การแก้ไข 3: จัดการการเปลี่ยนแปลงของ Toggle
  const handleToggleChange = () => {
    setDisableStamp((prev) => !prev);
  };

  // 💡 การแก้ไข 4: Logic การควบคุม StampText และ Input Read-only
  useEffect(() => {
    let newStampText = "";

    if (!disableStamp) {
      // FALSE (ไม่ปิดการใช้งาน) -> Stamp ON: ใช้ค่าที่พิมพ์
      newStampText = manualStampInput.replace(/\\n/g, "\n");
    } else {
      // TRUE (ปิดการใช้งาน) -> Stamp OFF: ใช้ค่าว่าง
      newStampText = "";
    }

    setStampText(newStampText);
  }, [disableStamp, manualStampInput]);

  // Initial Load: สร้างข้อมูลเริ่มต้นสำหรับ Paste
  useEffect(() => {
    const defaultData = [
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
    ].join("\n");
    setCsvInput(defaultData);

    // ตั้งค่า manualStampInput เริ่มต้น และ parse ข้อมูลหลัก
    const initialStampInput = DEFAULT_STAMP_TEXT.replace(/\n/g, "\\n");
    setManualStampInput(initialStampInput);
    setStampText(DEFAULT_STAMP_TEXT); // ให้ PDF แสดงค่านี้ในตอนเริ่มต้น

    parseCsvInput(defaultData);
  }, []); // Run only once on mount

  // ฟังก์ชันสร้าง PDF และคืนค่า Data URI string
  const generatePdfDataUri = useCallback(() => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 20;

    pdf.setFont(SARABUN_FONT, "normal");

    // --- 1. ตราครุฑ
    // Note: การวาดวงกลมเป็นการจำลองตำแหน่งของตราครุฑ
    const emblemX = margin + 15;
    const emblemY = margin + 15;
    pdf.circle(emblemX, emblemY, 7);

    // --- 2. ที่อยู่ผู้ส่ง (18px)
    const senderX = margin;
    let senderY = margin + 45;
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

    // --- 3. ตราประทับ (Stamp Box)

    // เงื่อนไขการวาด: วาดเมื่อ stampText ไม่ใช่ค่าว่างเท่านั้น
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

      pdf.rect(stampX, stampY, stampWidth, stampHeight);

      stampLines.forEach((line) => {
        const textWidth = pdf.getTextWidth(line);
        pdf.text(line, stampX + (stampWidth - textWidth) / 2, currentY);
        currentY += stampLineSpacing;
      });
    }

    // --- 4. ผู้รับ (26px, Bold ทั้งหมด)

    const recipientBaseX = pageWidth * 0.3;
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

    return pdf.output("datauristring");
  }, [
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
    const a = document.createElement("a");
    a.href = pdfDataUri;
    a.download = "envelope-label.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 💡 ตัวแปรสำหรับควบคุม JSX
  const isStampEnabled = !disableStamp;
  const toggleLabel = isStampEnabled
    ? "ต้องการปิดการใช้งาน"
    : "ต้องการเปิดใช้งาน";

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100">
              Thai Official Envelope Label Editor
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 mr-2 hidden sm:block">
              Export: PDF
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* --- Main Content: ส่วน Preview PDF และ Input Box ใหม่ --- */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Preview Panel */}
          <div className="flex-1 lg:w-3/5 overflow-auto p-4 lg:p-8 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            <div
              className={`transition-all bg-white shadow-lg 
                w-full max-w-[95%] aspect-[1.414/1] 
                p-2`}
            >
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

          {/* 💡 Input Panel ใหม่: ช่องกรอกข้อมูลแบบ CSV/Text */}
          <div className="w-full lg:w-2/5 bg-white dark:bg-gray-800 overflow-auto border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
            <div className="p-4 lg:p-6">
              <div className="max-w-xl mx-auto space-y-4 lg:space-y-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4">
                  ข้อมูลผู้ส่ง/ผู้รับ (Copy/Paste)
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  โปรดป้อนข้อมูล 10 บรรทัดแรกตามลำดับ (หนึ่งค่าต่อหนึ่งบรรทัด)
                </p>

                <div className="space-y-2 lg:space-y-3">
                  <textarea
                    value={csvInput}
                    onChange={handleCsvChange}
                    rows={10}
                    placeholder={`
1. เลขที่หนังสือ (ที่ อว. 0603.32.01/ว 249)
2. หน่วยงานผู้ส่ง
3. สถาบัน/มหาวิทยาลัย
4. ที่อยู่ บรรทัด 1
5. ที่อยู่ บรรทัด 2
6. รหัสไปรษณีย์ผู้ส่ง
7. ชื่อ/หน่วยงานผู้รับ
8. ที่อยู่ผู้รับ
9. จังหวัดผู้รับ
10. รหัสไปรษณีย์ผู้รับ
                    `.trim()}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono"
                  />
                </div>

                {/* --- Stamp Section ที่แยกออกมา --- */}
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                  ข้อมูลตราประทับ
                </h2>

                {/* 💡 Toggle Button สำหรับตราประทับ */}
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <label className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    สถานะตราประทับ: **
                    {isStampEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}**
                  </label>
                  <button
                    onClick={handleToggleChange}
                    className={`px-4 py-1 rounded-full text-xs font-medium transition-colors ${
                      isStampEnabled
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-500 dark:text-gray-100"
                    }`}
                  >
                    {toggleLabel}
                  </button>
                </div>

                {/* Dedicated Textarea for Stamp Input (Always Visible) */}
                <div className="space-y-2 lg:space-y-3 pt-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ข้อความตราประทับ (ใช้ `\n` สำหรับขึ้นบรรทัดใหม่)
                  </label>
                  <textarea
                    // 💡 แสดงค่า manualStampInput เสมอ
                    value={manualStampInput}
                    onChange={handleManualStampChange}
                    rows={4}
                    placeholder={DEFAULT_STAMP_TEXT.replace(/\n/g, "\\n")}
                    // 💡 ReadOnly/Style Toggled based on isStampEnabled
                    readOnly={!isStampEnabled}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none font-mono 
                            ${
                              !isStampEnabled // อ่านอย่างเดียวเมื่อปิดใช้งาน
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-white dark:bg-gray-700 text-gray-900 focus:ring-2 focus:ring-blue-500"
                            }
                        `}
                  />
                </div>

                {/* --- Data Structure Guide --- */}
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                    ลำดับข้อมูลที่ต้องการ (10 บรรทัด)
                  </h3>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-400 list-decimal list-inside space-y-1">
                    <li>เลขที่หนังสือ (Document Number)</li>
                    <li>หน่วยงานผู้ส่ง (Sender Organization)</li>
                    <li>สถาบัน/มหาวิทยาลัย (Sender University)</li>
                    <li>ที่อยู่ผู้ส่ง บรรทัด 1 (Sender Address 1)</li>
                    <li>ที่อยู่ผู้ส่ง บรรทัด 2 (Sender Address 2)</li>
                    <li>รหัสไปรษณีย์ผู้ส่ง (Sender Postal)</li>
                    <li>ชื่อ/หน่วยงานผู้รับ (Recipient Title)</li>
                    <li>ที่อยู่ผู้รับ (Recipient Address)</li>
                    <li>จังหวัดผู้รับ (Recipient Province)</li>
                    <li>รหัสไปรษณีย์ผู้รับ (Recipient Postal)</li>
                  </ol>
                </div>

                {/* PDF Export Note */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>หมายเหตุ:</strong> เมื่อตราประทับ **เปิดใช้งาน**
                    คุณสามารถป้อนข้อความเองได้ และข้อความที่ป้อนจะปรากฏใน PDF
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
