import React, { useState, useEffect } from 'react';

interface VoiceInputProps {
  onInput: (text: string) => void;
  disabled: boolean;
  highContrast?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onInput, disabled, highContrast }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (disabled || !isSupported) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      title="Voice Command (Jarvis Mode)"
      aria-label={isListening ? "Stop Listening" : "Start Voice Command"}
      className={`relative p-4 rounded-lg border transition-all flex items-center justify-center group overflow-hidden ${
        highContrast 
          ? 'bg-white text-black border-2 border-black focus:ring-2 focus:ring-offset-2'
          : isListening 
            ? 'bg-sophon-danger/20 border-sophon-danger text-white' 
            : 'bg-black/60 border-gray-700 text-gray-400 hover:text-sophon-accent hover:border-sophon-accent'
      }`}
    >
      {isListening && !highContrast && (
        <span className="absolute inset-0 bg-sophon-danger/10 animate-pulse"></span>
      )}
      
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 relative z-10 ${isListening && !highContrast ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      
      {/* Sound wave visualizer effect */}
      {isListening && !highContrast && (
         <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50">
             <div className="w-1 bg-sophon-danger animate-[pulse_0.5s_ease-in-out_infinite] h-4"></div>
             <div className="w-1 bg-sophon-danger animate-[pulse_0.5s_ease-in-out_infinite_0.1s] h-8"></div>
             <div className="w-1 bg-sophon-danger animate-[pulse_0.5s_ease-in-out_infinite_0.2s] h-6"></div>
         </div>
      )}
    </button>
  );
};