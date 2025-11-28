
import React, { useCallback, useRef } from 'react';

interface MediaData {
  base64: string;
  mimeType: string;
}

interface ImageUploaderProps {
  onMediaSelected: (data: MediaData) => void;
  disabled: boolean;
  highContrast?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onMediaSelected, disabled, highContrast }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files) return;
    processFile(e.target.files[0]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
        inputRef.current?.click();
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    
    // Accept Images, Audio, and PDFs
    const validTypes = ['image/', 'audio/', 'application/pdf'];
    if (!validTypes.some(t => file.type.startsWith(t) || file.type === t)) {
        alert("Unsupported file type. Please upload Image, Audio, or PDF.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // Extract Base64 (remove data:image/png;base64, prefix)
      const base64 = result.split(',')[1];
      onMediaSelected({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Upload Evidence (Image, Audio, PDF). Drag and drop or press Enter."
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all outline-none focus:ring-2 focus:ring-offset-2 ${
            highContrast 
            ? 'bg-black border-white text-white focus:ring-white'
            : `glass-panel border-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-sophon-accent hover:bg-black/50 cursor-pointer focus:border-sophon-accent'}`
        }`}
        onClick={() => !disabled && inputRef.current?.click()}
    >
        <input 
            type="file" 
            ref={inputRef}
            accept="image/*,audio/*,application/pdf" 
            onChange={handleChange} 
            className="hidden" 
            id="file-upload"
            disabled={disabled}
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${highContrast ? 'text-white' : 'text-gray-500 group-hover:text-sophon-accent'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className={`text-xs font-mono ${highContrast ? 'text-white' : 'text-gray-400'}`}>
                DROP EVIDENCE <br/>
                <span className={highContrast ? 'underline' : 'text-sophon-accent underline'}>IMG / AUDIO / PDF</span>
            </div>
            <p className={`text-[9px] uppercase ${highContrast ? 'text-white' : 'text-gray-600'}`}>Forensic Media Scanner</p>
        </div>
    </div>
  );
};
