import { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Download, FileText, RotateCw } from 'lucide-react';

export default function DocumentEditor() {
  const [isLandscape, setIsLandscape] = useState(true);
  
  // Sender info (top left)
  const [documentNumber, setDocumentNumber] = useState('ที่ อว 0603.32.01/ว 249');
  const [senderOrg, setSenderOrg] = useState('วิทยาลัยเพื่อการคุ้มครองระดับราชฐาน');
  const [senderUniversity, setSenderUniversity] = useState('มหาวิทยาลัยนเรศวร');
  const [senderAddress1, setSenderAddress1] = useState('เลขที่ 99 หมู่ที่ 9 ตำบลท่าโพธิ์');
  const [senderAddress2, setSenderAddress2] = useState('อำเภอเมือง จังหวัดพิษณุโลก');
  const [senderPostal, setSenderPostal] = useState('65000');
  
  // Recipient info (center)
  const [recipientTitle, setRecipientTitle] = useState('ผู้อำนายการโรงเรียนอุทัยธานีวิทยาคม');
  const [recipientAddress, setRecipientAddress] = useState('55 หมู่ 2 ตำบลสะแกกรัง อำเภอเมือง');
  const [recipientProvince, setRecipientProvince] = useState('จังหวัดอุทัยธานี');
  const [recipientPostal, setRecipientPostal] = useState('61000');
  
  // Stamp info (top right)
  const [stampText, setStampText] = useState('ชำระค่าฝากส่งเป็นรายเดือน\nในอนุญาตเลขที่ ๕๕/๒๕๒๓\nพิษณุโลก');

  const handleDownload = () => {
    // Create HTML content for Word document
    const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Envelope Label</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 2cm;
    }
    body {
      font-family: 'Angsana New', 'Cordia New', 'TH SarabunPSK', sans-serif;
      font-size: 16pt;
      line-height: 1.5;
    }
    .container {
      position: relative;
      width: 100%;
      height: 18cm;
    }
    .garuda {
      position: absolute;
      top: 0;
      left: 0;
      width: 60px;
      height: 80px;
      border: 1px solid #000;
      text-align: center;
      font-size: 10pt;
    }
    .stamp-box {
      position: absolute;
      top: 0;
      right: 0;
      border: 2px solid #000;
      padding: 10px;
      text-align: center;
      font-size: 11pt;
      min-width: 180px;
    }
    .sender {
      position: absolute;
      top: 100px;
      left: 0;
      max-width: 45%;
      font-size: 16pt;
      line-height: 1.8;
    }
    .recipient {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      font-size: 20pt;
      line-height: 1.8;
      min-width: 400px;
    }
    .recipient .postal {
      font-weight: bold;
      font-size: 22pt;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="garuda">
      <p style="margin: 30px 0 0 0;">ตราครุฑ</p>
    </div>
    
    <div class="stamp-box">
      ${stampText.replace(/\n/g, '<br>')}
    </div>
    
    <div class="sender">
      <p style="margin: 0;">${documentNumber}</p>
      <p style="margin: 0;">${senderOrg}</p>
      <p style="margin: 0;">${senderUniversity}</p>
      <p style="margin: 0;">${senderAddress1}</p>
      <p style="margin: 0;">${senderAddress2}</p>
      <p style="margin: 0;">${senderPostal}</p>
    </div>
    
    <div class="recipient">
      <p style="margin: 0;">เรียน &nbsp;&nbsp;&nbsp;&nbsp;${recipientTitle}</p>
      <p style="margin: 10px 0;">${recipientAddress}</p>
      <p style="margin: 0;">${recipientProvince}</p>
      <p class="postal">${recipientPostal}</p>
    </div>
  </div>
</body>
</html>`;

    // Create blob with Word document MIME type
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'envelope-label.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Thai Official Envelope Label Editor</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsLandscape(!isLandscape)} 
              variant="outline" 
              size="sm" 
              className="!bg-white !text-gray-900 !border-gray-300 hover:!bg-gray-50 dark:!bg-white dark:!text-gray-900 dark:!border-gray-300"
            >
              <RotateCw className="w-4 h-4" />
              {isLandscape ? 'Portrait' : 'Landscape'}
            </Button>
            <Button 
              onClick={handleDownload} 
              variant="outline" 
              size="sm"
              className="!bg-white !text-gray-900 !border-gray-300 hover:!bg-gray-50 dark:!bg-white dark:!text-gray-900 dark:!border-gray-300"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Paper Preview Panel */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full overflow-auto p-8 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className={`transition-all ${isLandscape ? 'w-full max-w-[95%]' : 'w-full max-w-3xl'}`}>
                  {/* A4 Paper */}
                  <div className={`bg-white dark:bg-gray-800 shadow-lg transition-all relative ${
                    isLandscape 
                      ? 'w-full aspect-[1.414/1]' 
                      : 'w-full aspect-[1/1.414]'
                  } p-12`}>
                    
                    {/* Thai Garuda Emblem - Top Left */}
                    <div className="absolute top-8 left-12 w-16 h-20">
                      <svg viewBox="0 0 100 120" className="w-full h-full">
                        <circle cx="50" cy="40" r="15" fill="none" stroke="black" strokeWidth="2"/>
                        <path d="M35 50 L50 70 L65 50 Z" fill="none" stroke="black" strokeWidth="2"/>
                        <path d="M30 60 L35 80 L50 75 L65 80 L70 60" fill="none" stroke="black" strokeWidth="2"/>
                        <text x="50" y="100" textAnchor="middle" fontSize="12" fill="black">ตรา</text>
                      </svg>
                    </div>

                    {/* Stamp Box - Top Right */}
                    <div className="absolute top-8 right-12 border-2 border-black p-2 text-center" style={{minWidth: '180px'}}>
                      <div className="text-xs leading-relaxed whitespace-pre-line text-gray-900">
                        {stampText}
                      </div>
                    </div>

                    {/* Sender Info - Top Left under emblem */}
                    <div className="absolute top-32 left-12 text-left" style={{maxWidth: '45%'}}>
                      <div className="space-y-1 text-gray-900 dark:text-gray-100">
                        <div className="font-normal text-base leading-relaxed">{documentNumber}</div>
                        <div className="font-normal text-base leading-relaxed">{senderOrg}</div>
                        <div className="font-normal text-base leading-relaxed">{senderUniversity}</div>
                        <div className="font-normal text-base leading-relaxed">{senderAddress1}</div>
                        <div className="font-normal text-base leading-relaxed">{senderAddress2}</div>
                        <div className="font-normal text-base leading-relaxed">{senderPostal}</div>
                      </div>
                    </div>

                    {/* Recipient Section - Center Right */}
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 text-center" style={{minWidth: '400px'}}>
                      <div className="space-y-3 text-gray-900 dark:text-gray-100">
                        <div className="text-xl font-normal mb-4">
                          เรียน <span className="ml-4">{recipientTitle}</span>
                        </div>
                        <div className="text-xl font-normal leading-relaxed text-center">
                          {recipientAddress}
                        </div>
                        <div className="text-xl font-normal leading-relaxed text-center">
                          {recipientProvince}
                        </div>
                        <div className="text-xl font-bold leading-relaxed text-center mt-4">
                          {recipientPostal}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>

            {/* Resizable Handle */}
            <ResizableHandle withHandle />

            {/* Input Form Panel */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full bg-white dark:bg-gray-800 overflow-auto p-6">
                <div className="max-w-xl mx-auto space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">ข้อมูลซองจดหมาย</h2>
                  
                  {/* Sender Section */}
                  <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-green-600 dark:text-green-400">ผู้ส่ง (Sender)</h3>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        เลขที่หนังสือ
                      </label>
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Recipient Section */}
                  <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">ผู้รับ (Recipient)</h3>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ชื่อผู้รับ/หน่วยงาน
                      </label>
                      <input
                        type="text"
                        value={recipientTitle}
                        onChange={(e) => setRecipientTitle(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Stamp Section */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-purple-600 dark:text-purple-400">ตราประทับ (Stamp)</h3>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ข้อความตราประทับ
                      </label>
                      <textarea
                        value={stampText}
                        onChange={(e) => setStampText(e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}