import React, { useState } from 'react';
import { Button } from './common/Button';

interface BookDisplayProps {
  bookContent: string;
  metadataJson: string;
  onReset: () => void;
}

const BookDisplay: React.FC<BookDisplayProps> = ({ bookContent, metadataJson, onReset }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'metadata'>('book');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopyToClipboard = (text: string, type: 'book' | 'metadata') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text. Please try manually.');
    });
  };
  
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-center text-sky-400">Your Book is Ready!</h2>
      
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('book')}
          className={`py-2 px-4 text-sm font-medium transition-colors duration-150
            ${activeTab === 'book' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400 hover:text-sky-300'}`}
        >
          Book Content (Markdown)
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`py-2 px-4 text-sm font-medium transition-colors duration-150
            ${activeTab === 'metadata' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400 hover:text-sky-300'}`}
        >
          Metadata (JSON)
        </button>
      </div>

      {activeTab === 'book' && (
        <div className="p-4 bg-slate-700 rounded-md shadow">
          <div className="flex justify-end mb-2 space-x-2">
            <Button 
              onClick={() => handleCopyToClipboard(bookContent, 'book')}
              variant="secondary"
              size="sm"
            >
              {copiedStates['book'] ? 'Copied!' : 'Copy Markdown'}
            </Button>
            <Button 
              onClick={() => downloadFile(bookContent, 'generated_book.md', 'text/markdown;charset=utf-8')}
              variant="secondary"
              size="sm"
            >
              Download .md
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-200 bg-slate-900/50 p-4 rounded-md max-h-[60vh] overflow-y-auto">
            {bookContent}
          </pre>
        </div>
      )}

      {activeTab === 'metadata' && (
        <div className="p-4 bg-slate-700 rounded-md shadow">
          <div className="flex justify-end mb-2 space-x-2">
            <Button 
              onClick={() => handleCopyToClipboard(metadataJson, 'metadata')}
              variant="secondary"
              size="sm"
            >
              {copiedStates['metadata'] ? 'Copied!' : 'Copy JSON'}
            </Button>
             <Button 
              onClick={() => downloadFile(metadataJson, 'generated_book_metadata.json', 'application/json;charset=utf-8')}
              variant="secondary"
              size="sm"
            >
              Download .json
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-200 bg-slate-900/50 p-4 rounded-md max-h-[60vh] overflow-y-auto">
            {metadataJson}
          </pre>
        </div>
      )}
      
      <div className="text-center mt-8">
        <Button onClick={onReset} variant="danger">
          Start New Book
        </Button>
      </div>
    </div>
  );
};

export default BookDisplay;
