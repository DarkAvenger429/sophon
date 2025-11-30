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
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${highContrast ? 'bg-white text-black' : 'bg-sophon-accent/20 text-sophon-accent'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
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
