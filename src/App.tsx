// src/App.tsx

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Download, FileText, X } from "lucide-react";
// 💡 Import toast and Toaster
import toast, { Toaster } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
// 💡 NEW: Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 💡 Import external types and constants
import { RecipientData, SenderData } from "./types/document";
import {
  RECIPIENT_LINES_PER_BLOCK,
  initialRecipients,
  initialSender,
  DEFAULT_STAMP_TEXT,
  EXAMPLE_LOGO_URL,
  FOUNDATION_SENDER_INPUT_STRING, // 💡 NEW IMPORT
  FOUNDATION_SENDER_DATA, // 💡 NEW IMPORT
} from "./constants";
// 💡 Import utility functions
import { createPdfDataUri } from "./utils/pdfUtils";
import {
  generateRecipientString,
  generateSenderString,
} from "./utils/dataUtils";

// ไฟล์ฟอนต์ที่ถูกแปลงแล้ว: ตรวจสอบให้แน่ใจว่าไฟล์เหล่านี้ถูกโหลดในโปรเจกต์ของคุณ
import "./fonts/thsarabunnew-normal.js";
import "./fonts/thsarabunnew-bold.js";

// 💡 NEW: Paper Size Constants (ในหน่วย mm)
const CUSTOM_PAPER_WIDTH_MM = 108; // ความกว้างเดิม (ใช้เป็น Height เมื่อเป็นแนวนอน)
const CUSTOM_PAPER_HEIGHT_MM = 235; // ความสูงเดิม (ใช้เป็น Width เมื่อเป็นแนวนอน)
const CUSTOM_PAPER_LABEL = `10.8 x 23.5 ซม.`;

export default function DocumentEditor() {
  const [pdfUrl, setPdfUrl] = useState("");

  const [senderData, setSenderData] = useState<SenderData>(initialSender);
  const [senderInput, setSenderInput] = useState("");

  const [recipientsData, setRecipientsData] =
    useState<RecipientData[]>(initialRecipients);
  const [recipientInput, setRecipientInput] = useState("");

  const [manualStampInput, setManualStampInput] = useState(DEFAULT_STAMP_TEXT);

  const [disableStamp, setDisableStamp] = useState(true);
  const [stampText, setStampText] = useState("");

  const [greetingText, setGreetingText] = useState("เรียน");
  const [greetingPosition, setGreetingPosition] = useState<"left" | "top">(
    "left"
  );

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string>(""); // 💡 NEW: State for Base64 image data
  const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1);
  const [disableLogo, setDisableLogo] = useState(false);

  // 💡 UPDATED: Custom Logo Size States - ลบ Width ออก
  const [useCustomSize, setUseCustomSize] = useState(false);
  // 💡 REMOVED: customWidthInput
  const [customHeightInput, setCustomHeightInput] = useState("15"); // Input: Height (mm)
  // 💡 REMOVED: customLogoWidth
  const [customLogoHeight, setCustomLogoHeight] = useState(15); // Parsed value

  // 💡 NEW: Paper Size State
  const [paperSize, setPaperSize] = useState<"A4" | "Custom108x235">("A4");

  // --- Handlers & Parsers (Kept as useCallback since they use setXData) ---

  // Parse ข้อมูลผู้ส่ง (6 บรรทัด)
  const parseSenderInput = useCallback((input: string) => {
    const lines = input
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

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

    const trimmedLines = lines.filter((line: string) => line.length > 0);

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
    // 💡 UPDATED: Hotkey Logic: If input is exactly "8732", fill foundation data.
    if (value.trim() === "8732") {
      // Use the imported constant string to fill the input box
      setSenderInput(FOUNDATION_SENDER_INPUT_STRING);
      // Use the structured data constant to update the parsed data state
      setSenderData(FOUNDATION_SENDER_DATA);

      toast.success("กรอกข้อมูลผู้ส่ง (วิทยาลัยฯ) ด้วย '8732' เรียบร้อยแล้ว");
      return; // Stop here, no need to parse '8732'
    }

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
    // Toast Logic ถูกย้ายไปที่ onClick ของ div
  };

  // 💡 Handler สำหรับ shadcn/ui Switch (Logo)
  const handleLogoSwitchChange = (checked: boolean) => {
    setDisableLogo(!checked);
    // Toast Logic ถูกย้ายไปที่ onClick ของ div
  };

  // 💡 Handler สำหรับช่องกรอก URL โลโก้
  const handleLogoUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
  };

  // 💡 Handler สำหรับกดปุ่ม Tab ในช่องกรอกโลโก้
  const handleLogoInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Fill the example URL if the field is currently empty and Tab is pressed
    if (e.key === "Tab" && !logoUrl) {
      e.preventDefault();
      setLogoUrl(EXAMPLE_LOGO_URL);
    }
  };

  // 💡 Handler สำหรับช่องกรอกคำขึ้นต้น
  const handleGreetingTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGreetingText(value);

    const notiText = value
      ? `เปลี่ยนคำขึ้นต้นเป็น '${value}'`
      : "ลบคำขึ้นต้นเรียบร้อยแล้ว";
    toast.success(notiText, { duration: 1500 });
  };

  // 💡 Handler สำหรับ Switch ตำแหน่งคำขึ้นต้น
  const handleGreetingPositionChange = (checked: boolean) => {
    setGreetingPosition(checked ? "top" : "left");
    // Toast Logic ถูกย้ายไปที่ onClick ของ div
  };

  // 💡 NEW: Handler สำหรับ Switch ขนาดโลโก้
  const handleCustomSizeSwitchChange = (checked: boolean) => {
    setUseCustomSize(checked);
    // Toast Logic ถูกย้ายไปที่ onClick ของ div
  };

  // 💡 UPDATED: Handler สำหรับช่องกรอกความสูงโลโก้
  const handleCustomHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomHeightInput(value);
    const numValue = parseFloat(value);
    // ตั้งค่า 0 ถ้าเป็น NaN หรือค่าน้อยกว่าหรือเท่ากับ 0
    setCustomLogoHeight(isNaN(numValue) || numValue <= 0 ? 0 : numValue);
  };

  // --- Effects ---

  // 💡 Effect to calculate logo aspect ratio and generate Base64 asynchronously
  useEffect(() => {
    setLogoBase64(""); // Clear old Base64 data
    if (!logoUrl) {
      setLogoAspectRatio(1);
      return;
    }

    const img = new Image();
    // Set crossOrigin to anonymous for images hosted on CORS-enabled servers
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const ratio = img.naturalWidth / img.naturalHeight;
        setLogoAspectRatio(ratio);

        // --- CONVERT IMAGE TO BASE64 USING CANVAS ---
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL("image/png"); // Use PNG for transparency safety
          setLogoBase64(dataURL);
          toast.success("โหลดโลโก้สำเร็จ, อัปเดตพรีวิวแล้ว", {
            duration: 1000,
          });
        } else {
          throw new Error("Could not get 2D context from canvas.");
        }
      } catch (error) {
        console.error("Error during Base64 conversion:", error);
        setLogoAspectRatio(1);
        setLogoBase64("");
        toast.error(
          "ข้อผิดพลาด: ไม่สามารถแปลงรูปภาพเป็น Base64 ได้ (อาจเป็นปัญหา CORS)",
          { icon: "⚠️" }
        );
      }
    };

    img.onerror = () => {
      console.error(
        "Failed to load image from URL or invalid format:",
        logoUrl
      );
      setLogoAspectRatio(1); // Revert to square if loading fails
      setLogoBase64("");
      toast.error("ข้อผิดพลาด: ไม่สามารถโหลดรูปภาพโลโก้ได้", { icon: "⚠️" });
    };

    // Attempt to load the image
    img.src = logoUrl;
  }, [logoUrl]); // Dependency: logoUrl

  useEffect(() => {
    let newStampText = "";

    if (!disableStamp) {
      newStampText = manualStampInput;
    } else {
      newStampText = "";
    }

    setStampText(newStampText);
  }, [disableStamp, manualStampInput]);

  // Initial Load: สร้างข้อมูลเริ่มต้น (จาก Mockup Data)
  useEffect(() => {
    // 1. ข้อมูลผู้ส่ง
    const defaultSenderData = generateSenderString(initialSender);
    setSenderInput(defaultSenderData);
    parseSenderInput(defaultSenderData);

    // 2. ข้อมูลผู้รับ
    const defaultRecipientData = generateRecipientString(initialRecipients);
    setRecipientInput(defaultRecipientData);
    parseRecipientInput(defaultRecipientData);

    // 3. ข้อมูลตราประทับถูกจัดการโดย disableStamp: true ตั้งแต่แรก
    // 4. คำขึ้นต้น
    setGreetingText("เรียน");
  }, [parseSenderInput, parseRecipientInput]);

  // --- Fill & Clear Functions ---

  const fillExampleData = (
    type: "sender" | "recipient" | "stamp" | "greeting"
  ) => {
    if (type === "sender") {
      const defaultSenderData = generateSenderString(initialSender);
      setSenderInput(defaultSenderData);
      parseSenderInput(defaultSenderData);
      toast.success("กรอกข้อมูลผู้ส่งตัวอย่างเรียบร้อยแล้ว");
    } else if (type === "recipient") {
      const newExampleData = generateRecipientString(initialRecipients);

      let updatedInput = recipientInput.trim();
      let notiMessage = "เพิ่มชุดข้อมูลผู้รับตัวอย่างเรียบร้อยแล้ว";

      if (updatedInput.length > 0) {
        updatedInput += "\n\n" + newExampleData;
        notiMessage = "เพิ่มชุดข้อมูลผู้รับตัวอย่างต่อท้ายเรียบร้อยแล้ว";
      } else {
        updatedInput = newExampleData;
      }

      setRecipientInput(updatedInput);
      parseRecipientInput(updatedInput);

      setGreetingText("เรียน");
      toast.success(notiMessage);
    } else if (type === "stamp") {
      setManualStampInput(DEFAULT_STAMP_TEXT);
      setStampText(DEFAULT_STAMP_TEXT);
      setDisableStamp(false);
      toast.success("ตั้งค่าตราประทับเป็นข้อความเริ่มต้นและเปิดใช้งาน");
    } else if (type === "greeting") {
      setGreetingText("เรียน");
      toast.success("ตั้งค่าคำขึ้นต้นเป็น 'เรียน'");
    }
  };

  const clearData = (type: "sender" | "recipient" | "stamp" | "greeting") => {
    const clearIcon = "🗑️";

    if (type === "sender") {
      setSenderInput("");
      parseSenderInput("");
      toast.error("ล้างข้อมูลผู้ส่งเรียบร้อยแล้ว", { icon: clearIcon });
    } else if (type === "recipient") {
      setRecipientInput("");
      parseRecipientInput("");
      toast.error("ล้างข้อมูลผู้รับทั้งหมดเรียบร้อยแล้ว", { icon: clearIcon });
    } else if (type === "stamp") {
      setManualStampInput("");
      setStampText("");
      toast.error("ล้างข้อความตราประทับเรียบร้อยแล้ว", { icon: clearIcon });
    } else if (type === "greeting") {
      setGreetingText("");
      toast.error("ล้างข้อความคำขึ้นต้นเรียบร้อยแล้ว", { icon: clearIcon });
    }
  };

  // --- PDF Generation Logic (Callback to Utility) ---

  const generatePdfDataUri = useCallback(() => {
    // 💡 NEW: Define paper size options based on state
    const paperSizeOptions =
      paperSize === "A4"
        ? { format: "A4" } // Pass format name
        : {
            // Pass custom dimensions (in mm)
            width: CUSTOM_PAPER_WIDTH_MM,
            height: CUSTOM_PAPER_HEIGHT_MM,
          };

    // Call the external utility function
    return createPdfDataUri({
      recipientsData,
      senderData,
      stampText,
      greetingText,
      greetingPosition,
      // 💡 CHANGED: Pass logoBase64 instead of logoUrl
      logoUrl: disableLogo ? "" : logoBase64,
      logoAspectRatio,
      // 💡 UPDATED: ลบ logoCustomWidth ออก
      useCustomLogoSize: useCustomSize,
      logoCustomHeight: customLogoHeight,
      // 💡 NEW: Pass paper size options
      paperSizeOptions,
    });
  }, [
    recipientsData,
    stampText,
    senderData,
    greetingText,
    greetingPosition,
    logoBase64, // CHANGED DEPENDENCY
    disableLogo,
    logoAspectRatio,
    // 💡 UPDATED DEPENDENCIES: ลบ customLogoWidth ออก
    useCustomSize,
    customLogoHeight,
    paperSize, // 💡 NEW DEPENDENCY
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
    toast.success("เริ่มดาวน์โหลดไฟล์ PDF แล้ว", { duration: 3000 });
  };

  // ตัวแปรสำหรับควบคุม JSX
  const isStampEnabled = !disableStamp;
  const isLogoEnabled = !disableLogo;

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-gray-900">
      <Toaster position="bottom-center" />
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
          {/* 💡 UPDATED: Preview Panel - Full area, fills 100% of w/h */}
          <div className="flex-1 lg:w-3/5 overflow-auto p-0 bg-gray-100 dark:bg-gray-900">
            {pdfUrl ? (
              // 💡 The iframe fills the entire panel area (100% width, 100% height)
              <iframe
                title="PDF Preview"
                src={pdfUrl}
                // w-full h-full: Fills the entire visible panel area (100% width, 100% height)
                // shadow-xl bg-white: Kept to visually represent the paper filling the area
                className="w-full h-full border-none shadow-xl bg-white"
                style={
                  // Inline styles removed as requested
                  {}
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                กำลังโหลด PDF Preview...
              </div>
            )}
          </div>

          {/* 💡 Input Panel ใหม่: แยกช่องกรอกผู้ส่ง/ผู้รับ */}
          <div className="w-full lg:w-2/5 bg-white dark:bg-gray-800 overflow-auto border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
            <div className="p-3 lg:p-4">
              <div className="max-w-xl mx-auto space-y-3 lg:space-y-4">
                {/* 💡 NEW: Tab Component for Paper Size Selection */}
                <div className="pt-2">
                  <h2 className="text-lg lg:text-xl font-extrabold text-red-700 dark:text-red-400 border-b border-red-100 pb-1">
                    เลือกขนาดซองจดหมาย / กระดาษ
                  </h2>

                  <Tabs
                    defaultValue="A4"
                    value={paperSize}
                    onValueChange={(value) => {
                      setPaperSize(value as "A4" | "Custom108x235");
                      // 💡 ADDED: Toast Message เมื่อเปลี่ยน Tab
                      if (value === "Custom108x235") {
                        toast("เลือกซองจดหมายขนาด 10.8x23.5 ซม. (แนวนอน)", {
                          icon: "✉️",
                          duration: 2000,
                        });
                      } else {
                        toast.success("กลับไปใช้ขนาด A4 มาตรฐานแล้ว", {
                          duration: 2000,
                        });
                      }
                    }}
                    className="w-full mt-3"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="A4"
                        // 💡 FIXED: เพิ่มสีแดงอ่อนเมื่อ Active
                        className="font-semibold text-base data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/40 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300"
                      >
                        A4 (21 x 29.7 ซม.)
                      </TabsTrigger>
                      <TabsTrigger
                        value="Custom108x235"
                        // 💡 FIXED: ใช้คลาสเดียวกันเพื่อให้ Current Tab เป็นสีแดงเสมอ
                        className="font-semibold text-base data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/40 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300"
                        // 💡 Tooltip for envelope size
                        title={`ซองจดหมายขนาด ${CUSTOM_PAPER_WIDTH_MM}x${CUSTOM_PAPER_HEIGHT_MM} มม.`}
                      >
                        ซองจดหมาย {CUSTOM_PAPER_LABEL}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="A4"
                      className="pt-4 text-sm text-gray-600 dark:text-gray-400"
                    >
                      ใช้สำหรับขนาด A4 แนวนอนมาตรฐาน (297 x 210 มม.)
                    </TabsContent>
                    <TabsContent
                      value="Custom108x235"
                      // 💡 ADDED: เพิ่มพื้นหลังสีแดงอ่อนและขอบ
                      className="pt-4 text-sm text-gray-600 dark:text-gray-400 bg-red-50/50 dark:bg-red-950/30 p-4 rounded-md border border-red-200 dark:border-red-800"
                    >
                      ใช้สำหรับซองจดหมายขนาดกำหนดเอง (235 x 108 มม. แนวนอน)
                    </TabsContent>
                  </Tabs>
                </div>
                {/* --- End Paper Size Tabs --- */}

                {/* --- ส่วนข้อมูลผู้ส่ง (6 บรรทัด) --- */}
                <div className="flex justify-between items-end pt-4">
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
                    onChange={handleGreetingTextChange}
                    placeholder="เช่น เรียน"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />

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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    โปรดป้อนข้อมูล **4 บรรทัดต่อชุด** สำหรับผู้รับแต่ละราย
                  </p>
                  <div
                    className="flex justify-between items-center bg-blue-100 dark:bg-blue-900/40 p-3 rounded-md border border-blue-300/50 dark:border-blue-800 cursor-pointer"
                    onClick={() => {
                      // 💡 FIXED: คำนวณสถานะใหม่ (willBeTop) ก่อน และแก้ไข Toast
                      const willBeTop = greetingPosition === "left";
                      handleGreetingPositionChange(willBeTop);
                      if (willBeTop) {
                        toast.success(
                          "เปลี่ยนตำแหน่งคำขึ้นต้นเป็น 'เหนือผู้รับ'"
                        );
                      } else {
                        toast.success(
                          "เปลี่ยนตำแหน่งคำขึ้นต้นเป็น 'คอลัมน์ซ้าย'"
                        );
                      }
                    }}
                  >
                    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                      ตำแหน่งคำขึ้นต้น: **
                      {greetingPosition === "left"
                        ? "คอลัมน์ซ้าย"
                        : "เหนือผู้รับ"}
                      **
                    </label>
                    <Switch
                      checked={greetingPosition === "top"} // True คือ 'top'
                      onCheckedChange={handleGreetingPositionChange}
                      className="data-[state=checked]:bg-blue-500"
                      onClick={(e) => e.stopPropagation()} // 💡 FIXED: ป้องกันการเกิด Double Toggle
                    />
                  </div>
                </div>
                {/* --- สิ้นสุด Greeting Control --- */}

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
                <div
                  className="flex justify-between items-center bg-purple-100 dark:bg-purple-900/40 p-3 rounded-md border border-purple-300/50 dark:border-purple-800 cursor-pointer"
                  onClick={() => {
                    // 💡 FIXED: คำนวณสถานะใหม่ (willBeEnabled) ก่อน และแก้ไข Toast
                    const willBeEnabled = !isStampEnabled;
                    handleSwitchChange(willBeEnabled);
                    if (willBeEnabled) {
                      toast.success("เปิดใช้งานตราประทับ");
                    } else {
                      toast("ปิดใช้งานตราประทับ", { icon: "🔒" });
                    }
                  }}
                >
                  <label
                    // 💡 FIXED: ลบ htmlFor ออก
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer"
                  >
                    สถานะตราประทับ: **
                    {isStampEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}**
                  </label>
                  <Switch
                    id="stamp-toggle"
                    checked={isStampEnabled}
                    onCheckedChange={handleSwitchChange}
                    className="data-[state=checked]:bg-purple-500"
                    onClick={(e) => e.stopPropagation()} // 💡 FIXED: ป้องกันการเกิด Double Toggle
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

                {/* 💡 ส่วนโลโก้ (Logo) ที่ย้ายมาด้านล่างสุด */}
                <div className="pt-4">
                  <h2 className="text-lg lg:text-xl font-extrabold text-green-600 dark:text-green-400 border-b border-green-100 pb-1">
                    โลโก้ (Logo) **H: 23.5mm**
                  </h2>

                  {/* 💡 Logo Toggle Section */}
                  <div
                    className="flex justify-between items-center bg-green-100 dark:bg-green-900/40 p-3 rounded-md border border-green-300/50 dark:border-green-800 cursor-pointer mt-3"
                    onClick={() => {
                      // 💡 FIXED: คำนวณสถานะใหม่ (willBeEnabled) ก่อน และแก้ไข Toast
                      const willBeEnabled = !isLogoEnabled;
                      handleLogoSwitchChange(willBeEnabled);
                      if (willBeEnabled) {
                        toast.success("เปิดใช้งานโลโก้");
                      } else {
                        toast("ปิดใช้งานโลโก้", { icon: "🔒" });
                      }
                    }}
                  >
                    <label
                      // 💡 FIXED: ลบ htmlFor ออก
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer"
                    >
                      สถานะโลโก้: **
                      {isLogoEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}**
                    </label>
                    <Switch
                      id="logo-toggle"
                      checked={isLogoEnabled} // Checked means enabled
                      onCheckedChange={handleLogoSwitchChange}
                      className="data-[state=checked]:bg-green-500"
                      onClick={(e) => e.stopPropagation()} // 💡 FIXED: ป้องกันการเกิด Double Toggle
                    />
                  </div>
                  {/* End Logo Toggle Section */}

                  {/* 💡 Input Link URL + Clear Button */}
                  <div className="space-y-1 pt-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      ลิงก์โลโก้ (URL/Data URI)
                    </label>
                    <div className="flex space-x-2 items-center">
                      {" "}
                      {/* จัด Input และ Button ให้อยู่ในแถวเดียวกัน */}
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={handleLogoUrlChange}
                        onKeyDown={handleLogoInputKeyDown} // 💡 เพิ่ม onKeyDown handler
                        disabled={!isLogoEnabled}
                        placeholder="ใส่ลิงก์รูปภาพ (เช่น https://example.com/logo.png หรือ Data URL)"
                        // 💡 ปรับคลาสสำหรับสถานะ disabled ให้ตรงกับ textarea ตราประทับ
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none 
                            ${
                              !isLogoEnabled
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed" // ปรับให้ตรงกับ textarea
                                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                            }
                        `}
                      />
                      {/* 💡 ปุ่มล้างลิงก์ที่ย้ายมา */}
                      <Button
                        onClick={() => {
                          setLogoUrl("");
                          toast.error("ล้างลิงก์โลโก้เรียบร้อยแล้ว", {
                            icon: "🗑️",
                          });
                        }}
                        variant="icon-destructive"
                        size="icon-sm"
                        title="ล้างลิงก์โลโก้"
                        disabled={!isLogoEnabled || !logoUrl}
                        className="w-10 h-10 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* --- สิ้นสุด โลโก้ (Logo URL) --- */}

                  {/* 💡 NEW: ส่วนกำหนดขนาดเอง (Custom Size) */}
                  <div className="space-y-3 pt-4">
                    {/* Toggle Custom Size */}
                    <div
                      className={`flex justify-between items-center p-3 rounded-md border cursor-pointer ${
                        !isLogoEnabled
                          ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60"
                          : "bg-green-50 dark:bg-green-900/40 border-green-300/50 dark:border-green-800"
                      }`}
                      onClick={() => {
                        if (!isLogoEnabled) return;
                        // 💡 FIXED: คำนวณสถานะใหม่ (willBeCustomSize) ก่อน และแก้ไข Toast
                        const willBeCustomSize = !useCustomSize;
                        handleCustomSizeSwitchChange(willBeCustomSize);

                        if (willBeCustomSize) {
                          // ถ้าสถานะใหม่คือ TRUE (กำหนดเอง)
                          toast.success("เปิดใช้งานกำหนดขนาดเอง");
                        } else {
                          // ถ้าสถานะใหม่คือ FALSE (Aspect Ratio)
                          toast.success("กลับไปใช้การคำนวณอัตราส่วน");
                        }
                      }}
                    >
                      <label
                        // 💡 FIXED: ลบ htmlFor ออก
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer"
                      >
                        ใช้ขนาดกำหนดเอง (mm): **
                        {useCustomSize
                          ? "เปิดใช้งาน"
                          : "ปิดใช้งาน (ใช้ Aspect Ratio)"}
                        **
                      </label>
                      <Switch
                        id="custom-size-toggle"
                        checked={useCustomSize}
                        onCheckedChange={handleCustomSizeSwitchChange}
                        disabled={!isLogoEnabled}
                        className="data-[state=checked]:bg-green-600"
                        onClick={(e) => e.stopPropagation()} // 💡 FIXED: ป้องกันการเกิด Double Toggle
                      />
                    </div>

                    {/* Input Custom Height ONLY */}
                    <div className="flex space-x-2">
                      {/* Height Input (เต็มความกว้าง) */}
                      <div className="flex-1 space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          ความสูง (Height - mm)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={customHeightInput}
                          onChange={handleCustomHeightChange}
                          disabled={!isLogoEnabled || !useCustomSize}
                          placeholder="15"
                          className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none 
                            ${
                              !isLogoEnabled || !useCustomSize
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                            }
                        `}
                        />
                      </div>
                    </div>

                    {/* Clear Custom Size Button (optional but helpful) */}
                    <Button
                      onClick={() => {
                        // 💡 UPDATED: ตั้งค่าเฉพาะ Height
                        setCustomHeightInput("15");
                        setCustomLogoHeight(15);
                        toast.success(
                          "ตั้งค่าความสูงโลโก้เริ่มต้น (15mm) แล้ว"
                        );
                      }}
                      variant="outline"
                      size="sm"
                      title="ตั้งค่าความสูงโลโก้เป็น 15 มม."
                      disabled={!isLogoEnabled || !useCustomSize}
                      className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200 transition-colors w-full"
                    >
                      ตั้งค่ากลับเป็น 15 mm
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                      ระบบจะคำนวณความกว้าง (Width) อัตโนมัติ
                      โดยรักษาอัตราส่วนภาพ (Aspect Ratio) เดิมของโลโก้ไว้เสมอ
                    </p>
                  </div>
                  {/* --- สิ้นสุด ส่วนกำหนดขนาดเอง --- */}
                </div>
                {/* --- สิ้นสุด ส่วนโลโก้ (Logo) ที่ย้ายมา --- */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
