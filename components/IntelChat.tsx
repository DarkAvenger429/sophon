
import React, { useState, useRef, useEffect } from 'react';
import { Report } from '../types';
import { chatWithAgent } from '../services/geminiService';
import { SophonLogo } from './SophonLogo';

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
    { role: 'model', text: `Commander, I am ready to debrief on the "${report.topic}" incident. What specific intelligence do you require?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(["Who is the primary source?", "Why is this considered false?", "Show me the counter-evidence."]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = text;
    setInput('');
    setSuggestions([]); // Clear suggestions while thinking
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Format history for Gemini
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const responseObj = await chatWithAgent(history, userMsg, report);
    
    setMessages(prev => [...prev, { role: 'model', text: responseObj.answer || "System Disruption. Retrying..." }]);
    if (responseObj.suggestedQuestions && responseObj.suggestedQuestions.length > 0) {
        setSuggestions(responseObj.suggestedQuestions);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSend(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className={`w-full max-w-2xl h-[650px] flex flex-col rounded-lg overflow-hidden border-2 ${highContrast ? 'bg-black border-white' : 'bg-sophon-dark border-sophon-accent shadow-[0_0_40px_rgba(0,240,255,0.15)]'}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${highContrast ? 'bg-white text-black' : 'bg-sophon-accent/10 border-sophon-accent/30'}`}>
            <div className="flex items-center gap-3">
                <SophonLogo className={`w-8 h-8 rounded-full object-cover border ${highContrast ? 'border-black' : 'border-sophon-accent'}`} />
                <div>
                    <h3 className={`font-bold font-mono ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>DEEP DIVE // INTEL</h3>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${highContrast ? 'bg-black' : 'bg-green-50 animate-pulse'}`}></span>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">SECURE LINE ACTIVE</p>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className={`hover:text-red-500 transition-colors font-mono text-xs ${highContrast ? 'text-black' : 'text-gray-400'}`}>
                [ CLOSE TERMINAL ]
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black/20">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-xl text-sm font-mono leading-relaxed shadow-lg ${
                        msg.role === 'user' 
                          ? highContrast ? 'bg-white text-black border border-black' : 'bg-sophon-accent/10 text-white border border-sophon-accent/30 rounded-tr-none'
                          : highContrast ? 'bg-gray-800 text-white border border-white' : 'bg-gray-900/80 text-gray-300 border border-gray-700 rounded-tl-none'
                    }`}>
                        {msg.role === 'model' && <div className="text-[10px] mb-2 font-bold opacity-50 uppercase">SOPHON AI</div>}
                        {msg.text}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2 ${highContrast ? 'bg-gray-800 text-white' : 'bg-gray-900 border border-gray-700'}`}>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-sophon-accent rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-sophon-accent rounded-full animate-bounce delay-75"></div>
                            <div className="w-1 h-1 bg-sophon-accent rounded-full animate-bounce delay-150"></div>
                        </div>
                        ANALYZING INTEL...
                    </div>
                </div>
            )}
            <div ref={scrollRef} />
        </div>

        {/* Suggestions & Input */}
        <div className={`p-4 border-t ${highContrast ? 'bg-white border-black' : 'bg-black border-gray-800'}`}>
            
            {/* Quick Actions */}
            {suggestions.length > 0 && !loading && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {suggestions.map((sug, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSend(sug)}
                            className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                                highContrast 
                                    ? 'bg-gray-100 border-black hover:bg-black hover:text-white' 
                                    : 'bg-sophon-accent/5 border-sophon-accent/30 text-sophon-accent hover:bg-sophon-accent/20'
                            }`}
                        >
                            {sug}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask follow-up questions..."
                    className={`flex-1 bg-transparent border rounded-lg px-4 py-3 text-sm focus:outline-none font-mono ${highContrast ? 'border-black text-black placeholder-gray-600' : 'border-gray-700 text-white focus:border-sophon-accent'}`}
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className={`px-6 py-2 rounded-lg font-bold text-xs transition-colors ${
                        highContrast 
                          ? 'bg-black text-white hover:bg-gray-800' 
                          : 'bg-sophon-accent text-black hover:bg-sophon-accent/80 disabled:opacity-50'
                    }`}
                >
                    SEND
                </button>
            </form>
        </div>

      </div>
    </div>
  );
};