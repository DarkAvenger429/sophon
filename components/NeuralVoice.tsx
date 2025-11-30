
import React, { useState, useEffect, useRef } from 'react';

interface NeuralVoiceProps {
  text: string;
  highContrast?: boolean;
}

export const NeuralVoice: React.FC<NeuralVoiceProps> = ({ text, highContrast }) => {
  const [speaking, setSpeaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const speak = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.9; // Slightly lower for "AI" feel
        utterance.rate = 1.1; // Slightly faster
        
        // Find a good voice
        const voices = window.speechSynthesis.getVoices();
        const techVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
        if (techVoice) utterance.voice = techVoice;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (!speaking || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    let animId: number;
    const bars = 20;

    const draw = () => {
        ctx.clearRect(0, 0, 100, 30);
        const width = 100 / bars;
        
        for (let i = 0; i < bars; i++) {
            const height = Math.random() * 20 + 5;
            const x = i * width;
            const y = (30 - height) / 2;
            
            ctx.fillStyle = highContrast ? '#000' : '#00f0ff';
            ctx.fillRect(x, y, width - 1, height);
        }
        
        if (speaking) {
            animId = requestAnimationFrame(draw);
        }
    };
    
    draw();
    return () => cancelAnimationFrame(animId);
  }, [speaking, highContrast]);

  return (
    <button 
        onClick={(e) => { e.stopPropagation(); speaking ? window.speechSynthesis.cancel() : speak(); }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all hover:scale-105 ${highContrast ? 'bg-white border-black text-black' : 'bg-sophon-accent/10 border-sophon-accent/50 text-sophon-accent hover:bg-sophon-accent/20'}`}
        title="Neural Readout"
    >
        {speaking ? (
            <>
                <canvas ref={canvasRef} width={60} height={20} className="w-[60px] h-[20px]" />
                <span className="text-[9px] font-bold animate-pulse">TRANSMITTING...</span>
            </>
        ) : (
            <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <span className="text-[9px] font-bold">READ INTEL</span>
            </>
        )}
    </button>
  );
};
