import { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

export default function DocumentEditor() {
  const [content, setContent] = useState('Start typing your document here...\n\nYou can write multiple paragraphs and see them formatted in the paper preview on the left.');

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Document Editor</h1>
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Paper Preview Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-auto p-8 bg-gray-100 dark:bg-gray-900">
                <div className="max-w-3xl mx-auto">
                  {/* Paper */}
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-12 min-h-[calc(100vh-8rem)]">
                    <div className="prose dark:prose-invert max-w-none">
                      {content.split('\n').map((line, index) => (
                        <p key={index} className="text-gray-900 dark:text-gray-100 leading-relaxed mb-4">
                          {line || '\u00A0'}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>

            {/* Resizable Handle */}
            <ResizableHandle withHandle />

            {/* Text Input Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full bg-white dark:bg-gray-800">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-none outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="Start typing your document..."
                  spellCheck="true"
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}