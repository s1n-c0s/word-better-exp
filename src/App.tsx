import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Download, FileText, X } from "lucide-react";
import jsPDF from "jspdf";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

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

  // 💡 State สำหรับคำขึ้นต้น
  const [greetingText, setGreetingText] = useState("เรียน");
  const [greetingPosition, setGreetingPosition] = useState<"left" | "top">(
    "left"
  ); // 'left' = คอลัมน์ซ้าย, 'top' = เหนือผู้รับ

  // 💡 State สำหรับโลโก้ (URL string)
  const [logoUrl, setLogoUrl] = useState<string>("");

  // 💡 State สำหรับอัตราส่วนภาพ (width/height) Default: 1 (Square)
  const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1);

  // 💡 State สำหรับปิด/เปิด โลโก้
  const [disableLogo, setDisableLogo] = useState(false);

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

  // Handler สำหรับ shadcn/ui Switch (Stamp)
  const handleSwitchChange = (checked: boolean) => {
    setDisableStamp(!checked);
  };

  // 💡 Handler สำหรับ shadcn/ui Switch (Logo)
  const handleLogoSwitchChange = (checked: boolean) => {
    setDisableLogo(!checked);
  };

  // 💡 Handler สำหรับช่องกรอก URL โลโก้
  const handleLogoUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
  };

  // 💡 Effect to calculate logo aspect ratio asynchronously
  useEffect(() => {
    if (logoUrl) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        setLogoAspectRatio(ratio);
      };
      img.onerror = () => {
        console.error(
          "Failed to load image from URL or invalid format:",
          logoUrl
        );
        setLogoAspectRatio(1); // Revert to square if loading fails
      };
      // Prevent CORS issues by setting crossOrigin (though this is often restricted in sandboxed environments)
      // img.crossOrigin = "Anonymous";
      img.src = logoUrl;
    } else {
      // No URL, default to square for the placeholder
      setLogoAspectRatio(1);
    }
  }, [logoUrl]);

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

  // --- ฟังก์ชัน: กรอกข้อมูลตัวอย่าง ---
  const fillExampleData = (
    type: "sender" | "recipient" | "stamp" | "greeting"
  ) => {
    if (type === "sender") {
      const defaultSenderData = generateSenderString(initialSender);
      setSenderInput(defaultSenderData);
      parseSenderInput(defaultSenderData);
    } else if (type === "recipient") {
      const newExampleData = generateRecipientString(initialRecipients);

      let updatedInput = recipientInput.trim();

      if (updatedInput.length > 0) {
        updatedInput += "\n\n" + newExampleData;
      } else {
        updatedInput = newExampleData;
      }

      setRecipientInput(updatedInput);
      parseRecipientInput(updatedInput);

      // 💡 การทำงานเพิ่มเติม: ตั้งค่า greeting เป็น "เรียน" เมื่อเพิ่มข้อมูลผู้รับ
      setGreetingText("เรียน");
    } else if (type === "stamp") {
      setManualStampInput(DEFAULT_STAMP_TEXT);
      setStampText(DEFAULT_STAMP_TEXT);
      setDisableStamp(false); // เปิดใช้งาน Stamp ด้วย
    } else if (type === "greeting") {
      setGreetingText("เรียน");
    }
  };
  // --- สิ้นสุดฟังก์ชัน ---

  // --- ฟังก์ชัน: เคลียร์ข้อมูล ---
  const clearData = (type: "sender" | "recipient" | "stamp" | "greeting") => {
    if (type === "sender") {
      setSenderInput("");
      parseSenderInput("");
    } else if (type === "recipient") {
      setRecipientInput("");
      parseRecipientInput("");
    } else if (type === "stamp") {
      setManualStampInput("");
      setStampText("");
    } else if (type === "greeting") {
      setGreetingText("");
    }
  };
  // --- สิ้นสุดฟังก์ชัน ---

  // Initial Load: สร้างข้อมูลเริ่มต้น (จาก Mockup Data)
  useEffect(() => {
    // 1. ข้อมูลผู้ส่ง
    fillExampleData("sender");

    // 2. ข้อมูลผู้รับ
    const defaultRecipientData = generateRecipientString(initialRecipients);
    setRecipientInput(defaultRecipientData);
    parseRecipientInput(defaultRecipientData);

    // 3. ข้อมูลตราประทับ
    setManualStampInput(DEFAULT_STAMP_TEXT);
    setStampText(DEFAULT_STAMP_TEXT);

    // 4. คำขึ้นต้น
    setGreetingText("เรียน");
  }, [parseSenderInput, parseRecipientInput]);

  // ฟังก์ชันสร้าง PDF รองรับหลายหน้า (มีการแก้ไขในส่วน Recipient)
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

      // ตั้งค่าสีเริ่มต้นเป็นสีดำ (Monochrome)
      pdf.setTextColor(0, 0, 0);

      // --- 1. โลโก้ (Logo)
      const logoX = margin;
      const logoY = margin + 10;
      // 💡 ความสูงคงที่ 23.5 มม. (2.35 ซม.)
      const LOGO_HEIGHT = 23.5;

      // 💡 ความกว้างคำนวณจากอัตราส่วน (ถ้า ratio เป็น 1, width = height)
      const logoWidth = LOGO_HEIGHT * logoAspectRatio;

      function drawDefaultGaruda() {
        // ใช้ LOGO_HEIGHT เป็นขนาดฐานสำหรับตราครุฑ/สัญลักษณ์เริ่มต้น (Square)
        const placeholderSize = LOGO_HEIGHT;

        // วาดวงกลมพื้นหลัง (สีขาว)
        pdf.setFillColor(255, 255, 255); // สีขาว
        pdf.circle(
          logoX + placeholderSize / 2,
          logoY + placeholderSize / 2,
          placeholderSize / 2,
          "F"
        );

        // วาดกรอบวงกลม (สีดำ)
        pdf.setDrawColor(0, 0, 0); // สีดำ
        pdf.setLineWidth(0.25);
        pdf.circle(
          logoX + placeholderSize / 2,
          logoY + placeholderSize / 2,
          placeholderSize / 2,
          "S"
        );

        // เขียนข้อความ "สัญลักษณ์" ตรงกลาง (สีดำ)
        pdf.setFont(SARABUN_FONT, "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0); // สีดำ
        const garudaText = "สัญลักษณ์";
        const garudaTextWidth = pdf.getTextWidth(garudaText);
        pdf.text(
          garudaText,
          logoX + (placeholderSize - garudaTextWidth) / 2,
          logoY + placeholderSize / 2 + 2
        );

        // รีเซ็ตสีกลับเป็นสีดำ
        pdf.setTextColor(0, 0, 0);
      }

      if (!disableLogo) {
        // ตรวจสอบ State การปิด Logo
        if (logoUrl) {
          // 💡 ใช้ logoWidth และ LOGO_HEIGHT ที่คำนวณจาก Aspect Ratio
          try {
            pdf.addImage(
              logoUrl,
              "PNG", // ชนิดไฟล์ (อาจต้องระบุตามชนิดไฟล์ที่แท้จริง)
              logoX,
              logoY,
              logoWidth, // Width = LOGO_HEIGHT * ratio
              LOGO_HEIGHT // Fixed Height
            );
          } catch (error) {
            console.error("Error adding image to PDF from URL:", error);
            // ถ้าเกิดข้อผิดพลาด ให้วาดตราครุฑแทน
            drawDefaultGaruda();
          }
        } else {
          // ถ้าไม่มี URL ให้วาดตราครุฑเริ่มต้น (ใช้ขนาด LOGO_HEIGHT)
          drawDefaultGaruda();
        }
      }
      // --- สิ้นสุด โลโก้

      // --- 2. ที่อยู่ผู้ส่ง (ใช้ข้อมูลผู้ส่งชุดเดียว)
      const senderX = margin;
      let senderY = margin + 42;
      const lineSpacing = 8;

      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0); // ตั้งค่าสีข้อความเป็นสีดำอีกครั้ง

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

        // สีเส้นเป็นสีดำ
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(stampX, stampY, stampWidth, stampHeight);
        // สีข้อความเป็นสีดำ
        pdf.setTextColor(0, 0, 0);

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
      pdf.setTextColor(0, 0, 0); // ตั้งค่าสีข้อความเป็นสีดำอีกครั้ง

      const labelWidth = pdf.getTextWidth(greetingText);
      const detailGap = 8;
      let recipientDetailX;
      let startY = recipientBaseY;

      // 💡 Logic การกำหนดตำแหน่งคำขึ้นต้น
      if (greetingText && greetingPosition === "left") {
        // ตำแหน่ง: คอลัมน์ซ้าย (เรียน [Title])
        pdf.text(greetingText, recipientBaseX, recipientBaseY);
        recipientDetailX = recipientBaseX + labelWidth + detailGap;
      } else {
        // ตำแหน่ง: เหนือผู้รับ
        if (greetingText) {
          pdf.text(
            greetingText,
            recipientBaseX,
            recipientBaseY - recipientLineSpacing
          );
        }
        recipientDetailX = recipientBaseX;
        startY = recipientBaseY; // เริ่มที่ BaseY (บรรทัดแรกของข้อมูลผู้รับ)
      }

      // พิมพ์ข้อมูลผู้รับ (Title, Address, Province, Postal)
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
  }, [
    recipientsData,
    stampText,
    senderData,
    greetingText,
    greetingPosition,
    logoUrl,
    disableLogo,
    logoAspectRatio, // 💡 เพิ่ม Aspect Ratio ใน dependencies
  ]);

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
  const isLogoEnabled = !disableLogo;

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
            <Button
              onClick={handleDownload}
              className="font-bold bg-black text-white hover:bg-blue-700 transition-colors"
              variant="default"
              size="default"
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
                {/* --- ส่วนโลโก้ (Logo) --- */}
                <div className="flex justify-between items-end">
                  <h2 className="text-lg lg:text-xl font-extrabold text-teal-700 dark:text-teal-400 border-b border-teal-100 pb-1">
                    โลโก้ (Logo) **H: 23.5mm | W: Ratio**
                  </h2>
                  <Button
                    onClick={() => setLogoUrl("")}
                    variant="icon-destructive"
                    size="icon-sm"
                    title="ใช้ตราครุฑเริ่มต้น (วาด)"
                    disabled={!isLogoEnabled}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* 💡 Logo Toggle Section */}
                <div className="flex justify-between items-center bg-teal-100 dark:bg-teal-900/40 p-3 rounded-md border border-teal-300/50 dark:border-teal-800">
                  <label
                    htmlFor="logo-toggle"
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    สถานะโลโก้: **
                    {isLogoEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}**
                  </label>
                  <Switch
                    id="logo-toggle"
                    checked={isLogoEnabled} // Checked means enabled
                    onCheckedChange={handleLogoSwitchChange}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>
                {/* End Logo Toggle Section */}

                {/* 💡 Input Link URL */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    ลิงก์โลโก้ (URL/Data URI)
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={handleLogoUrlChange}
                    disabled={!isLogoEnabled}
                    placeholder="ใส่ลิงก์รูปภาพ (เช่น https://example.com/logo.png หรือ Data URI)"
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none
                          ${
                            !isLogoEnabled
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                              : ""
                          }
                      `}
                  />
                </div>

                {logoUrl && isLogoEnabled && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium whitespace-nowrap overflow-x-auto p-1 bg-teal-50 dark:bg-teal-900/40 rounded">
                    **Current URL:** {logoUrl} <br />
                    **Calculated Ratio (W/H):** {logoAspectRatio.toFixed(2)}
                  </p>
                )}
                {/* --- สิ้นสุด โลโก้ --- */}

                {/* --- ส่วนข้อมูลผู้ส่ง (6 บรรทัด) --- */}
                <div className="flex justify-between items-end">
                  <h2 className="text-lg lg:text-xl font-extrabold text-blue-700 dark:text-blue-400 border-b border-blue-100 pb-1">
                    ข้อมูลผู้ส่ง (Sender - 6 บรรทัด)
                  </h2>
                  <div className="flex gap-1">
                    {" "}
                    {/* จัดกลุ่มปุ่ม */}
                    <Button
                      onClick={() => fillExampleData("sender")}
                      variant="outline"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                    >
                      กรอกข้อมูลตัวอย่าง
                    </Button>
                    {/* ปุ่มเคลียร์ข้อมูล (Icon-only) */}
                    <Button
                      onClick={() => clearData("sender")}
                      variant="icon-destructive"
                      size="icon-sm"
                      title="เคลียร์ข้อมูลผู้ส่ง"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
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
                  <div className="flex gap-1">
                    {" "}
                    {/* จัดกลุ่มปุ่ม */}
                    {/* 💡 ปุ่มรวม: เพิ่มข้อมูลผู้รับ + ตั้งค่า "เรียน" */}
                    <Button
                      onClick={() => fillExampleData("recipient")}
                      variant="outline"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                      title="เพิ่มชุดข้อมูลตัวอย่าง และตั้งค่าคำขึ้นต้นเป็น 'เรียน'"
                    >
                      เพิ่มชุดข้อมูลตัวอย่าง
                    </Button>
                    {/* 💡 ปุ่มเคลียร์ข้อมูล */}
                    <Button
                      onClick={() => clearData("recipient")}
                      variant="icon-destructive"
                      size="icon-sm"
                      title="เคลียร์ข้อมูลผู้รับทั้งหมด"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 💡 Greeting Control ที่ถูกย้ายมาอยู่ด้านล่าง Heading ของ Recipients */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      ข้อความคำขึ้นต้น (เช่น เรียน, ถึง, ... หรือปล่อยว่าง)
                    </label>
                    <div className="flex gap-1">
                      {/* 💡 ลบปุ่ม "ใช้ 'เรียน'" ออกไปแล้ว */}
                      {/* 💡 ลบปุ่มเคลียร์คำขึ้นต้นออกไปแล้ว */}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={greetingText}
                    onChange={(e) => setGreetingText(e.target.value)}
                    placeholder="เช่น เรียน"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                  />

                  <div className="flex justify-between items-center bg-green-100 dark:bg-green-900/40 p-3 rounded-md border border-green-300/50 dark:border-green-800">
                    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ตำแหน่งคำขึ้นต้น: **
                      {greetingPosition === "left"
                        ? "คอลัมน์ซ้าย"
                        : "เหนือผู้รับ"}
                      **
                    </label>
                    <Switch
                      checked={greetingPosition === "top"} // True คือ 'top'
                      onCheckedChange={(checked) =>
                        setGreetingPosition(checked ? "top" : "left")
                      }
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    โปรดป้อนข้อมูล **4 บรรทัดต่อชุด** สำหรับผู้รับแต่ละราย
                  </p>
                </div>
                {/* --- สิ้นสุด Greeting Control --- */}

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
                  <div className="flex gap-1">
                    {" "}
                    {/* จัดกลุ่มปุ่ม */}
                    <Button
                      onClick={() => fillExampleData("stamp")}
                      variant="outline"
                      size="sm"
                      className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 transition-colors"
                    >
                      ใช้ข้อความเริ่มต้น
                    </Button>
                    {/* ปุ่มเคลียร์ข้อมูล (Icon-only) */}
                    <Button
                      onClick={() => clearData("stamp")}
                      variant="icon-destructive"
                      size="icon-sm"
                      title="เคลียร์ข้อความตราประทับ"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
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
