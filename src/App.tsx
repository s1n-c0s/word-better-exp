import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { Switch } from "@/components/ui/switch"; // 💡 นำเข้า Switch
import { Button } from "@/components/ui/button"; // 💡 นำเข้า Button Component

// ไฟล์ฟอนต์ที่ถูกแปลงแล้ว: ตรวจสอบให้แน่ใจว่าไฟล์เหล่านี้ถูกโหลดในโปรเจกต์ของคุณ
import "./fonts/thsarabunnew-normal.js";
import "./fonts/thsarabunnew-bold.js";

// TH Sarabun New font will be embedded
const SARABUN_FONT = "THSarabunNew";
const RECIPIENT_LINES_PER_BLOCK = 4;

// กำหนด Type สำหรับข้อมูลผู้รับ (เหลือเฉพาะ Recipient fields)
interface RecipientData {
  recipientTitle: string;
  recipientAddress: string;
  recipientProvince: string;
  recipientPostal: string;
}

// 💡 กำหนด Type สำหรับข้อมูลผู้ส่ง (Sender fields)
interface SenderData {
  documentNumber: string;
  senderOrg: string;
  senderUniversity: string;
  senderAddress1: string;
  senderAddress2: string;
  senderPostal: string;
}

// กำหนดข้อความตราประทับมาตรฐานเป็นค่าคงที่
const DEFAULT_STAMP_TEXT = `ชำระค่าฝากส่งเป็นรายเดือน
ใบอนุญาตเลขที่ XXX/XXXX
ตำบลต้นทาง`;

// 💡 MOCKUP SENDER: ใช้ข้อมูลดั้งเดิมตามที่ร้องขอ
const initialSender: SenderData = {
  documentNumber: "ที่ [รหัสหน่วยงาน] [เลขที่]",
  senderOrg: "ชื่อหน่วยงานผู้ส่ง",
  senderUniversity: "ชื่อมหาวิทยาลัย/สถาบัน",
  senderAddress1: "เลขที่/หมู่ที่ ตำบลต้นทาง",
  senderAddress2: "อำเภอเมือง จังหวัดต้นทาง",
  senderPostal: "10000",
};

// 💡 MOCKUP RECIPIENTS: ใช้ข้อมูลดั้งเดิมตามที่ร้องขอ
const initialRecipients: RecipientData[] = [
  {
    recipientTitle: "ตำแหน่ง/ชื่อผู้รับ",
    recipientAddress: "เลขที่/หมู่ที่ ตำบลปลายทางหนึ่ง อำเภอเมือง",
    recipientProvince: "จังหวัดปลายทาง",
    recipientPostal: "10000",
  },
];

export default function DocumentEditor() {
  const [pdfUrl, setPdfUrl] = useState("");

  const [senderData, setSenderData] = useState<SenderData>(initialSender);
  const [senderInput, setSenderInput] = useState("");

  const [recipientsData, setRecipientsData] =
    useState<RecipientData[]>(initialRecipients);
  const [recipientInput, setRecipientInput] = useState("");

  const [manualStampInput, setManualStampInput] = useState(DEFAULT_STAMP_TEXT);

  const [disableStamp, setDisableStamp] = useState(false);
  const [stampText, setStampText] = useState(DEFAULT_STAMP_TEXT);

  // Parse ข้อมูลผู้ส่ง (6 บรรทัด)
  const parseSenderInput = useCallback((input: string) => {
    const lines = input
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line) => line.length > 0);

    setSenderData({
      documentNumber: lines[0] || "",
      senderOrg: lines[1] || "",
      senderUniversity: lines[2] || "",
      senderAddress1: lines[3] || "",
      senderAddress2: lines[4] || "",
      senderPostal: lines[5] || "",
    });
  }, []);

  // Parse ข้อมูลผู้รับ (4 บรรทัดต่อชุด)
  const parseRecipientInput = useCallback((input: string) => {
    const lines = input.split("\n").map((line: string) => line.trim());
    const newRecipients: RecipientData[] = [];

    const trimmedLines = lines.filter((line) => line.length > 0);

    for (let i = 0; i < trimmedLines.length; i += RECIPIENT_LINES_PER_BLOCK) {
      const block = trimmedLines.slice(i, i + RECIPIENT_LINES_PER_BLOCK);

      if (block.length === RECIPIENT_LINES_PER_BLOCK && block[0].trim()) {
        newRecipients.push({
          recipientTitle: block[0] || "",
          recipientAddress: block[1] || "",
          recipientProvince: block[2] || "",
          recipientPostal: block[3] || "",
        });
      }
    }

    setRecipientsData(
      newRecipients.length > 0 ? newRecipients : initialRecipients
    );
  }, []);

  // Handler สำหรับช่องกรอกข้อมูลผู้ส่ง
  const handleSenderChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSenderInput(value);
    parseSenderInput(value);
  };

  // Handler สำหรับช่องกรอกข้อมูลผู้รับ
  const handleRecipientChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setRecipientInput(value);
    parseRecipientInput(value);
  };

  // Handler สำหรับช่องกรอกข้อมูลตราประทับ
  const handleManualStampChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setManualStampInput(value);
  };

  // Handler สำหรับ shadcn/ui Switch
  const handleSwitchChange = (checked: boolean) => {
    setDisableStamp(!checked);
  };

  useEffect(() => {
    let newStampText = "";

    if (!disableStamp) {
      newStampText = manualStampInput;
    } else {
      newStampText = "";
    }

    setStampText(newStampText);
  }, [disableStamp, manualStampInput]);

  // สร้าง String ข้อมูลผู้ส่ง (6 บรรทัด)
  const generateSenderString = (data: SenderData) => {
    return [
      data.documentNumber,
      data.senderOrg,
      data.senderUniversity,
      data.senderAddress1,
      data.senderAddress2,
      data.senderPostal,
    ].join("\n");
  };

  // สร้าง String ข้อมูลผู้รับ (4 บรรทัดต่อชุด)
  const generateRecipientString = (recipients: RecipientData[]) => {
    return recipients
      .map((r) =>
        [
          r.recipientTitle,
          r.recipientAddress,
          r.recipientProvince,
          r.recipientPostal,
        ].join("\n")
      )
      .join("\n\n");
  };

  // --- ฟังก์ชัน: กรอกข้อมูลตัวอย่าง (ใช้ข้อมูล Mockup ดั้งเดิม) ---
  const fillExampleData = (type: "sender" | "recipient" | "stamp") => {
    if (type === "sender") {
      const defaultSenderData = generateSenderString(initialSender);
      setSenderInput(defaultSenderData);
      parseSenderInput(defaultSenderData);
    } else if (type === "recipient") {
      const defaultRecipientData = generateRecipientString(initialRecipients);
      setRecipientInput(defaultRecipientData);
      parseRecipientInput(defaultRecipientData);
    } else if (type === "stamp") {
      setManualStampInput(DEFAULT_STAMP_TEXT);
      setStampText(DEFAULT_STAMP_TEXT);
      setDisableStamp(false); // เปิดใช้งาน Stamp ด้วย
    }
  };
  // --- สิ้นสุดฟังก์ชัน ---

  // Initial Load: สร้างข้อมูลเริ่มต้น (จาก Mockup Data)
  useEffect(() => {
    // 1. ข้อมูลผู้ส่ง
    fillExampleData("sender");

    // 2. ข้อมูลผู้รับ
    fillExampleData("recipient");

    // 3. ข้อมูลตราประทับ
    setManualStampInput(DEFAULT_STAMP_TEXT);
    setStampText(DEFAULT_STAMP_TEXT);
  }, [parseSenderInput, parseRecipientInput]);

  // ฟังก์ชันสร้าง PDF รองรับหลายหน้า (ไม่มีการเปลี่ยนแปลงในส่วนนี้)
  const generatePdfDataUri = useCallback(() => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 20;

    const sender = senderData;

    recipientsData.forEach((data, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      pdf.setFont(SARABUN_FONT, "normal");

      // --- 1. ตราครุฑ
      // (ตำแหน่งเดิม)

      // --- 2. ที่อยู่ผู้ส่ง (ใช้ข้อมูลผู้ส่งชุดเดียว)
      const senderX = margin;
      let senderY = margin + 42;
      const lineSpacing = 8;

      pdf.setFontSize(18);

      // บรรทัดที่ 1: เลขที่หนังสือ (Bold ทั้งบรรทัด)
      pdf.setFont(SARABUN_FONT, "bold");
      pdf.text(sender.documentNumber, senderX, senderY);
      senderY += lineSpacing;

      // ส่วนที่เหลือ: องค์กร ที่อยู่ (Normal)
      pdf.setFont(SARABUN_FONT, "normal");
      const senderLines = [
        sender.senderOrg,
        sender.senderUniversity,
        sender.senderAddress1,
        sender.senderAddress2,
        sender.senderPostal,
      ];
      senderLines.forEach((line) => {
        pdf.text(line, senderX, senderY);
        senderY += lineSpacing;
      });

      // --- 3. ตราประทับ (Stamp Box)
      if (stampText && stampText.trim().length > 0) {
        // ... Logic การวาดตราประทับ ...
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
        // ... สิ้นสุด Logic การวาดตราประทับ ...
      }

      // --- 4. ผู้รับ (26px, Bold ทั้งหมด)
      const recipientBaseX = pageWidth * 0.3;
      const recipientBaseY = pageHeight * 0.6;
      const recipientLineSpacing = 12;

      pdf.setFontSize(26);
      pdf.setFont(SARABUN_FONT, "bold");

      const recipientLabel = "เรียน";

      pdf.text(recipientLabel, recipientBaseX, recipientBaseY);

      const labelWidth = pdf.getTextWidth(recipientLabel);
      const detailGap = 8;
      const recipientDetailX = recipientBaseX + labelWidth + detailGap;

      pdf.text(data.recipientTitle, recipientDetailX, recipientBaseY);
      pdf.text(
        data.recipientAddress,
        recipientDetailX,
        recipientBaseY + recipientLineSpacing
      );
      pdf.text(
        data.recipientProvince,
        recipientDetailX,
        recipientBaseY + recipientLineSpacing * 2
      );
      pdf.text(data.recipientPostal, recipientDetailX, recipientBaseY + 39);
    });

    return pdf.output("datauristring");
  }, [recipientsData, stampText, senderData]);

  // Effect สำหรับอัปเดต Preview ทุกครั้งที่ข้อมูลเปลี่ยน
  useEffect(() => {
    try {
      const dataUri = generatePdfDataUri();
      setPdfUrl(dataUri);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setPdfUrl("");
    }
  }, [generatePdfDataUri]);

  // ฟังก์ชันสำหรับ Download PDF จริงๆ
  const handleDownload = () => {
    const pdfDataUri = generatePdfDataUri();
    const a = document.createElement("a");
    a.href = pdfDataUri;
    a.download = "envelope-labels.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ตัวแปรสำหรับควบคุม JSX
  const isStampEnabled = !disableStamp;

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100">
              Envelope Label Editor (Multi-Recipient)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 mr-2 hidden sm:block">
              Export: PDF ({recipientsData.length} Pages)
            </div>
            {/* 💡 ใช้ Button Component สำหรับ Download */}
            <Button
              onClick={handleDownload}
              className="font-bold bg-black text-white hover:bg-blue-700 transition-colors"
              variant="default" // หรือ 'secondary'
              size="default" // เพื่อให้ดูเด่น
            >
              <Download className="w-5 h-5" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* --- Main Content: ส่วน Preview PDF และ Input Box ใหม่ --- */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Preview Panel */}
          <div className="flex-1 lg:w-3/5 overflow-auto p-4 lg:p-8 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            <div
              className={`transition-all bg-white shadow-xl
                w-full max-w-[95%] aspect-[1.414/1] 
                p-2`}
            >
              {pdfUrl ? (
                <iframe
                  title="PDF Preview"
                  src={pdfUrl}
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  กำลังโหลด PDF Preview...
                </div>
              )}
            </div>
          </div>

          {/* 💡 Input Panel ใหม่: แยกช่องกรอกผู้ส่ง/ผู้รับ */}
          <div className="w-full lg:w-2/5 bg-white dark:bg-gray-800 overflow-auto border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
            <div className="p-3 lg:p-4">
              <div className="max-w-xl mx-auto space-y-3 lg:space-y-4">
                {/* --- ส่วนข้อมูลผู้ส่ง (6 บรรทัด) --- */}
                <div className="flex justify-between items-end">
                  <h2 className="text-lg lg:text-xl font-extrabold text-blue-700 dark:text-blue-400 border-b border-blue-100 pb-1">
                    ข้อมูลผู้ส่ง (Sender - 6 บรรทัด)
                  </h2>
                  {/* 💡 ใช้ Button Component */}
                  <Button
                    onClick={() => fillExampleData("sender")}
                    variant="outline"
                    size="sm"
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                  >
                    กรอกข้อมูลตัวอย่าง
                  </Button>
                </div>
                <textarea
                  value={senderInput}
                  onChange={handleSenderChange}
                  rows={6}
                  placeholder={`
1. เลขที่หนังสือ
2. หน่วยงานผู้ส่ง
3. สถาบัน/มหาวิทยาลัย
4. ที่อยู่ บรรทัด 1 (มีชื่อตำบล)
5. ที่อยู่ บรรทัด 2 (มีชื่อจังหวัด)
6. รหัสไปรษณีย์ผู้ส่ง
                  `.trim()}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono"
                />

                {/* --- ส่วนข้อมูลผู้รับ (4 บรรทัดต่อชุด) --- */}
                <div className="flex justify-between items-end pt-2">
                  <h2 className="text-lg lg:text-xl font-extrabold text-blue-700 dark:text-blue-400 border-b border-blue-100 pb-1">
                    ข้อมูลผู้รับ (Recipients - 4 บรรทัดต่อชุด)
                  </h2>
                  {/* 💡 ใช้ Button Component */}
                  <Button
                    onClick={() => fillExampleData("recipient")}
                    variant="outline"
                    size="sm"
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                  >
                    กรอกข้อมูลตัวอย่าง
                  </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  โปรดป้อนข้อมูล **4 บรรทัดต่อชุด** สำหรับผู้รับแต่ละราย
                </p>
                <textarea
                  value={recipientInput}
                  onChange={handleRecipientChange}
                  rows={10}
                  placeholder={`
ชุดที่ 1 (4 บรรทัด)
1. ชื่อ/หน่วยงานผู้รับ
2. ที่อยู่ผู้รับ (มีชื่อตำบล)
3. จังหวัดผู้รับ
4. รหัสไปรษณีย์ผู้รับ

ชุดที่ 2 (4 บรรทัด)
1. ชื่อ/หน่วยงานผู้รับ
2. ที่อยู่ผู้รับ (มีชื่อตำบล)
3. จังหวัดผู้รับ
4. รหัสไปรษณีย์ผู้รับ
                  `.trim()}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono"
                />

                {/* --- Stamp Section ที่แยกออกมา --- */}
                <div className="flex justify-between items-end pt-2">
                  <h2 className="text-lg lg:text-xl font-extrabold text-purple-700 dark:text-purple-400 border-b border-purple-100 pb-1">
                    ข้อมูลตราประทับ (ใช้ร่วมกันทุกหน้า)
                  </h2>
                  {/* 💡 ใช้ Button Component */}
                  <Button
                    onClick={() => fillExampleData("stamp")}
                    variant="outline"
                    size="sm"
                    className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 transition-colors"
                  >
                    ใช้ข้อความเริ่มต้น
                  </Button>
                </div>

                {/* 💡 Switch Component Area - พื้นหลังสีม่วงอ่อน */}
                <div className="flex justify-between items-center bg-purple-100 dark:bg-purple-900/40 p-3 rounded-md border border-purple-300/50 dark:border-purple-800">
                  <label
                    htmlFor="stamp-toggle"
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    สถานะตราประทับ: **
                    {isStampEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}**
                  </label>
                  <Switch
                    id="stamp-toggle"
                    checked={isStampEnabled}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>

                <div className="space-y-2 lg:space-y-3 pt-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ข้อความตราประทับ (ป้อนข้อความตามปกติเพื่อขึ้นบรรทัดใหม่)
                  </label>
                  <textarea
                    value={manualStampInput}
                    onChange={handleManualStampChange}
                    rows={4}
                    placeholder={DEFAULT_STAMP_TEXT}
                    readOnly={!isStampEnabled}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none font-mono 
                            ${
                              !isStampEnabled
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-white dark:bg-gray-700 text-gray-900 focus:ring-4 focus:ring-purple-300 border-2 border-purple-300/50"
                            }
                        `}
                  />
                </div>
                {/* End Toggle and Input Area */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
