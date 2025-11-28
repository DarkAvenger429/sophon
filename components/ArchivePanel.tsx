import React, { useRef } from 'react';
import { Report, VerdictType } from '../types';

interface ArchivePanelProps {
  archive: Report[];
  onImport: (reports: Report[]) => void;
}

export const ArchivePanel: React.FC<ArchivePanelProps> = ({ archive, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(archive, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sophon_intel_dump_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const importedReports = JSON.parse(result) as Report[];
        if (Array.isArray(importedReports)) {
           onImport(importedReports);
        } else {
           alert("Invalid file format: Not an array.");
        }
      } catch (err) {
        console.error("Import failed", err);
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="animate-fadeIn space-y-4">
      {/* Data Tools Header */}
      <div className="flex items-center justify-between mb-4 px-2 p-3 bg-black/40 rounded border border-white/5">
        <div className="flex flex-col">
            <h3 className="text-gray-300 font-mono text-xs font-bold">INTELLIGENCE VAULT</h3>
            <span className="text-[10px] text-gray-500">RECORDS: {archive.length}</span>
        </div>
        
        <div className="flex gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />
            <button 
                onClick={handleImportTrigger}
                className="px-3 py-1.5 text-[10px] font-mono font-bold bg-sophon-accent/10 text-sophon-accent border border-sophon-accent/50 rounded hover:bg-sophon-accent/20 transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                INJECT DATA
            </button>
            <button 
                onClick={handleExport}
                className="px-3 py-1.5 text-[10px] font-mono font-bold bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
                disabled={archive.length === 0}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                EXTRACT DB
            </button>
        </div>
      </div>

      {archive.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-lg">
            <p className="text-gray-500 font-mono">ARCHIVE EMPTY</p>
            <p className="text-gray-600 text-sm mt-2">Verified intelligence is stored here permanently.</p>
        </div>
      ) : (
        <div className="grid gap-3">
            {archive.map((report) => (
            <div key={report.id} className="glass-panel p-4 rounded border-l-2 border-gray-700 hover:border-sophon-accent transition-colors">
                <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] px-1 rounded font-bold ${
                            report.verdict === VerdictType.VERIFIED ? 'bg-sophon-success/20 text-sophon-success' :
                            report.verdict === VerdictType.FALSE ? 'bg-sophon-danger/20 text-sophon-danger' :
                            'bg-gray-700 text-gray-300'
                        }`}>
                            {report.verdict}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                    <h4 className="text-white font-bold text-sm leading-tight">{report.topic}</h4>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{report.summary}</p>
                </div>
                <div className="text-right ml-4">
                    <span className="text-sophon-accent font-mono text-xs font-bold">{report.confidenceScore}%</span>
                    <span className="block text-[8px] text-gray-600">CONFIDENCE</span>
                </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};