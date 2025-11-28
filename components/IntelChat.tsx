import React, { useState, useRef, useEffect } from 'react';
import { Report } from '../types';
import { chatWithAgent } from '../services/geminiService';

interface IntelChatProps {
  report: Report;
  onClose: () => void;
  highContrast?: boolean;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const IntelChat: React.FC<IntelChatProps> = ({ report, onClose, highContrast }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Forensic session established. Monitoring context: "${report.topic}". What is your query?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Format history for Gemini
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const response = await chatWithAgent(history, userMsg, report);
    
    setMessages(prev => [...prev, { role: 'model', text: response || "System Error." }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className={`w-full max-w-2xl h-[600px] flex flex-col rounded-lg overflow-hidden border-2 ${highContrast ? 'bg-black border-white' : 'bg-sophon-dark border-sophon-accent shadow-[0_0_30px_rgba(0,240,255,0.2)]'}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${highContrast ? 'bg-white text-black' : 'bg-sophon-accent/10 border-sophon-accent/30'}`}>
            <div>
                <h3 className={`font-bold font-mono ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>DEEP DIVE // CHAT</h3>
                <p className="text-[10px] text-gray-500 font-mono uppercase">Target: {report.topic.slice(0, 30)}...</p>
            </div>
            <button onClick={onClose} className={`hover:text-red-500 transition-colors ${highContrast ? 'text-black' : 'text-gray-400'}`}>
                ✕ ESC
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded text-sm font-mono ${
                        msg.role === 'user' 
                          ? highContrast ? 'bg-white text-black border border-black' : 'bg-sophon-accent/20 text-sophon-accent border border-sophon-accent/30'
                          : highContrast ? 'bg-gray-800 text-white border border-white' : 'bg-gray-900 text-gray-300 border border-gray-700'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className={`p-3 rounded text-xs font-mono animate-pulse ${highContrast ? 'text-white' : 'text-sophon-accent'}`}>
                        ANALYZING...
                    </div>
                </div>
            )}
            <div ref={scrollRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className={`p-4 border-t ${highContrast ? 'bg-white border-black' : 'bg-black border-gray-800'}`}>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask follow-up questions..."
                    className={`flex-1 bg-transparent border rounded px-3 py-2 text-sm focus:outline-none ${highContrast ? 'border-black text-black placeholder-gray-600' : 'border-gray-700 text-white focus:border-sophon-accent'}`}
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className={`px-4 py-2 rounded font-bold text-xs transition-colors ${
                        highContrast 
                          ? 'bg-black text-white hover:bg-gray-800' 
                          : 'bg-sophon-accent text-black hover:bg-sophon-accent/80 disabled:opacity-50'
                    }`}
                >
                    SEND
                </button>
            </div>
        </form>

      </div>
    </div>
  );
};
