import { useState } from "react";
import { Download, FileText, RotateCw } from "lucide-react";
import jsPDF from "jspdf";
// ไฟล์ฟอนต์ที่ถูกแปลงแล้ว: ตรวจสอบให้แน่ใจว่าไฟล์เหล่านี้ถูกโหลดในโปรเจกต์ของคุณ
import "./fonts/thsarabunnew-normal.js";
import "./fonts/thsarabunnew-bold.js";

// TH Sarabun New font will be embedded
const SARABUN_FONT = "THSarabunNew";

// Base64 Placeholder สำหรับตราครุฑ
const GARUDA_EMBLEM_WIDTH = 15; // mm (ขนาดครุฑ)
const GARUDA_EMBLEM_HEIGHT = 15; // mm

export default function DocumentEditor() {
  const [isLandscape, setIsLandscape] = useState(true);

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

  const handleDownload = async () => {
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const margin = 20; // 2cm margin

    // ตั้งค่าฟอนต์เริ่มต้นให้เป็น TH Sarabun New (normal)
    pdf.setFont(SARABUN_FONT, "normal");

    // --- 1. ตราครุฑ
    const emblemX = margin + 15;
    const emblemY = margin + 15;
    pdf.circle(emblemX, emblemY, 7);

    // --- 2. ที่อยู่ผู้ส่ง (18px)
    const senderX = margin;
    let senderY = margin + 45;
    const lineSpacing = 8;

    // ตั้งค่าขนาดฟอนต์ 18px สำหรับผู้ส่ง
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
    const stampWidth = 60;
    const stampHeight = 30;
    const stampX = pageWidth - margin - stampWidth;
    const stampY = margin;

    pdf.rect(stampX, stampY, stampWidth, stampHeight);

    pdf.setFontSize(11);
    const stampLines = stampText.split("\n");
    let stampTextY = stampY + 8;
    stampLines.forEach((line) => {
      const textWidth = pdf.getTextWidth(line);
      pdf.text(line, stampX + (stampWidth - textWidth) / 2, stampTextY);
      stampTextY += 6;
    });

    // --- 4. ผู้รับ (26px, Bold ทั้งหมด) ---

    // 💡 การแก้ไข 1: เลื่อนบล็อกทั้งหมดไปทางซ้ายมากขึ้น (จาก 45% เป็น 30%)
    const recipientBaseX = pageWidth * 0.3;
    const recipientBaseY = pageHeight * 0.55;
    const recipientLineSpacing = 12;

    pdf.setFontSize(26);
    pdf.setFont(SARABUN_FONT, "bold");

    const recipientLabel = "เรียน";

    // 💡 การแก้ไข 2a: พิมพ์ "เรียน" ที่จุดเริ่มต้น (คอลัมน์ซ้าย)
    pdf.text(recipientLabel, recipientBaseX, recipientBaseY);

    // 💡 การแก้ไข 2b: คำนวณจุดเริ่มต้นสำหรับคอลัมน์รายละเอียด
    const labelWidth = pdf.getTextWidth(recipientLabel);
    const detailGap = 8; // ระยะห่าง 8mm
    const recipientDetailX = recipientBaseX + labelWidth + detailGap;

    // บรรทัดที่ 1: ผู้อำนวยการโรงเรียนอุทัยธานีวิทยาคม (คอลัมน์ขวา)
    pdf.text(recipientTitle, recipientDetailX, recipientBaseY);

    // บรรทัดที่ 2: ที่อยู่ (คอลัมน์ขวา)
    pdf.text(
      recipientAddress,
      recipientDetailX,
      recipientBaseY + recipientLineSpacing
    );

    // บรรทัดที่ 3: จังหวัด (คอลัมน์ขวา)
    pdf.text(
      recipientProvince,
      recipientDetailX,
      recipientBaseY + recipientLineSpacing * 2
    );

    // บรรทัดที่ 4: รหัสไปรษณีย์ (คอลัมน์ขวา)
    pdf.text(recipientPostal, recipientDetailX, recipientBaseY + 39);

    // Save PDF
    pdf.save("envelope-label.pdf");
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

        {/* Main Content: ใช้ JSX เดิม */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Paper Preview Panel */}
          <div className="flex-1 lg:w-3/5 overflow-auto p-4 lg:p-8 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            <div
              className={`transition-all ${
                isLandscape ? "w-full max-w-[95%]" : "w-full max-w-3xl"
              }`}
            >
              {/* A4 Paper */}
              <div
                className={`bg-white dark:bg-gray-800 shadow-lg transition-all relative ${
                  isLandscape
                    ? "w-full aspect-[1.414/1]"
                    : "w-full aspect-[1/1.414]"
                } p-8 lg:p-12`}
              >
                {/* Thai Garuda Emblem - Top Left */}
                <div className="absolute top-4 lg:top-8 left-12 lg:left-20 w-12 lg:w-16 h-16 lg:h-20">
                  <svg viewBox="0 0 100 120" className="w-full h-full">
                    <circle
                      cx="50"
                      cy="40"
                      r="15"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <path
                      d="M35 50 L50 70 L65 50 Z"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <path
                      d="M30 60 L35 80 L50 75 L65 80 L70 60"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <text
                      x="50"
                      y="100"
                      textAnchor="middle"
                      fontSize="12"
                      fill="black"
                    >
                      ตรา
                    </text>
                  </svg>
                </div>

                {/* Stamp Box - Top Right */}
                <div className="absolute top-4 lg:top-8 right-4 lg:right-12 border-2 border-black p-2 text-center min-w-[140px] lg:min-w-[180px]">
                  <div className="text-[10px] lg:text-xs leading-relaxed whitespace-pre-line text-gray-900">
                    {stampText}
                  </div>
                </div>

                {/* Sender Info - Top Left under emblem */}
                <div className="absolute top-32 lg:top-40 left-4 lg:left-12 text-left max-w-[45%]">
                  <div className="space-y-0.5 lg:space-y-1 text-gray-900 dark:text-gray-100">
                    <div className="font-normal text-xs lg:text-base leading-relaxed">
                      {documentNumber}
                    </div>
                    <div className="font-normal text-xs lg:text-base leading-relaxed">
                      {senderOrg}
                    </div>
                    <div className="font-normal text-xs lg:text-base leading-relaxed">
                      {senderUniversity}
                    </div>
                    <div className="font-normal text-xs lg:text-base leading-relaxed">
                      {senderAddress1}
                    </div>
                    <div className="font-normal text-xs lg:text-base leading-relaxed">
                      {senderAddress2}
                    </div>
                    <div className="font-normal text-xs lg:text-base leading-relaxed">
                      {senderPostal}
                    </div>
                  </div>
                </div>

                {/* Recipient Section - Center Right */}
                <div className="absolute top-1/2 left-[45%] -translate-y-1/2 text-left min-w-[280px] lg:min-w-[400px]">
                  <div className="space-y-2 lg:space-y-3 text-gray-900 dark:text-gray-100">
                    <div className="text-base lg:text-xl font-normal mb-2 lg:mb-4">
                      เรียน{" "}
                      <span className="ml-2 lg:ml-4">{recipientTitle}</span>
                    </div>
                    <div className="text-base lg:text-xl font-normal leading-relaxed text-left">
                      {recipientAddress}
                    </div>
                    <div className="text-base lg:text-xl font-normal leading-relaxed text-left">
                      {recipientProvince}
                    </div>
                    <div className="text-base lg:text-xl font-bold leading-relaxed text-left mt-2 lg:mt-4">
                      {recipientPostal}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Form Panel */}
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
