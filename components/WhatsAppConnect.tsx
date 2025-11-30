
import React, { useState } from 'react';

interface WhatsAppConnectProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast?: boolean;
}

export const WhatsAppConnect: React.FC<WhatsAppConnectProps> = ({ isOpen, onClose, highContrast }) => {
  // Hardcoded Sandbox Code for your specific Twilio instance
  const sandboxCode = 'village-stared'; 

  if (!isOpen) return null;

  const sandboxNumber = '+14155238886';
  // Pre-fill the join message in the link
  const joinLink = `https://wa.me/${sandboxNumber}?text=join%20${sandboxCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
      <div className={`relative max-w-md w-full p-6 rounded-lg border-2 ${highContrast ? 'bg-black border-white' : 'glass-panel border-sophon-accent shadow-[0_0_30px_rgba(0,240,255,0.2)]'}`}>
        
        <button 
            onClick={onClose}
            className={`absolute top-4 right-4 text-gray-400 hover:text-white`}
        >
            ✕
        </button>

        <div className="text-center mb-6">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 p-1 border-2 ${highContrast ? 'border-black' : 'border-sophon-accent'}`}>
                <img src="/logo.png" alt="Sophon Agent" className="w-full h-full rounded-full object-cover" />
            </div>
            <h2 className={`text-xl font-bold tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>DEPLOY FIELD AGENT</h2>
            <p className="text-xs text-gray-500 font-mono mt-2">Connect Sophon to WhatsApp for mobile analysis.</p>
        </div>

        <div className="space-y-4">
            <div className={`p-4 rounded border ${highContrast ? 'bg-white border-black text-black' : 'bg-black/40 border-gray-700 text-gray-300'}`}>
                <p className="text-xs font-bold mb-2">STEP 1: ACTIVATE SANDBOX</p>
                <p className="text-[10px] text-gray-500 mb-3">You must join the secure channel once to start chatting.</p>
                
                <div className="flex gap-2 items-center p-3 bg-black/60 rounded border border-gray-700">
                    <span className="text-sophon-accent font-mono text-sm">join {sandboxCode}</span>
                </div>
                
                <a 
                    href={joinLink}
                    target="_blank"
                    rel="noreferrer"
                    className={`block w-full text-center py-3 mt-4 rounded font-bold font-mono text-xs transition-colors ${highContrast ? 'bg-black text-white hover:bg-gray-800' : 'bg-sophon-success text-black hover:bg-sophon-success/90'}`}
                >
                    CLICK TO CONNECT INSTANTLY
                </a>
            </div>
            
            {/* WARNING BOX */}
            <div className={`p-3 rounded border border-sophon-warning/50 bg-sophon-warning/10 text-center`}>
                <p className={`text-[10px] font-bold ${highContrast ? 'text-black' : 'text-sophon-warning'}`}>
                    ⚠️ CRITICAL: IF THE BOT DOES NOT REPLY, CLICK THE BUTTON ABOVE AND SEND THE "join" MESSAGE FIRST.
                </p>
            </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 text-center">
             <p className="text-[9px] text-gray-500 uppercase">Powered by Twilio Sandbox & Gemini 2.5</p>
        </div>

      </div>
    </div>
  );
};
