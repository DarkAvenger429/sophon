
import React, { useState } from 'react';
import { analyzeBotSwarm } from '../services/geminiService';

interface BotSwarmDetectorProps {
  highContrast?: boolean;
}

export const BotSwarmDetector: React.FC<BotSwarmDetectorProps> = ({ highContrast }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ probability: number, analysis: string, tactics: string[] } | null>(null);

  const handleAnalyze = async () => {
      if (!input.trim()) return;
      setIsAnalyzing(true);
      const data = await analyzeBotSwarm(input);
      setResult(data);
      setIsAnalyzing(false);
  };

  return (
    <div className={`w-full p-6 rounded-lg border-2 ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/30'}`}>
        
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className={`text-xl font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>
                    BOT SWARM DETECTOR
                </h2>
                <p className={`text-xs font-mono mt-1 ${highContrast ? 'text-gray-600' : 'text-gray-400'}`}>
                    BAD ACTOR IDENTIFICATION // ASTROTURFING SCANNER
                </p>
            </div>
            {result && (
                <div className={`px-4 py-2 rounded text-center border ${
                    highContrast 
                        ? 'bg-black text-white' 
                        : result.probability > 70 
                            ? 'bg-sophon-danger/20 border-sophon-danger text-sophon-danger' 
                            : 'bg-sophon-success/20 border-sophon-success text-sophon-success'
                }`}>
                    <div className="text-xl font-bold font-mono">{result.probability}%</div>
                    <div className="text-[8px] uppercase">BOT PROBABILITY</div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INPUT AREA */}
            <div className="flex flex-col">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste a thread of suspicious comments, tweets, or reviews here..."
                    className={`flex-1 p-4 rounded mb-4 font-mono text-xs focus:outline-none border min-h-[150px] ${highContrast ? 'bg-gray-50 border-black text-black' : 'bg-black/40 border-gray-700 text-gray-300 focus:border-sophon-accent'}`}
                />
                <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !input.trim()}
                    className={`w-full py-3 rounded font-bold font-mono text-xs tracking-widest transition-all ${
                        highContrast 
                            ? 'bg-black text-white hover:bg-gray-800 disabled:opacity-50' 
                            : 'bg-sophon-accent text-black hover:bg-sophon-accent/90 disabled:opacity-50'
                    }`}
                >
                    {isAnalyzing ? 'SCANNING PATTERNS...' : 'DETECT COORDINATED ACTIVITY'}
                </button>
            </div>

            {/* RESULTS AREA */}
            <div className={`p-4 rounded border relative overflow-hidden ${highContrast ? 'bg-gray-50 border-black' : 'bg-black/20 border-gray-800'}`}>
                {result ? (
                    <div className="animate-fadeIn h-full flex flex-col">
                        <h3 className={`text-xs font-bold mb-2 uppercase ${highContrast ? 'text-black' : 'text-gray-400'}`}>ANALYSIS REPORT</h3>
                        <p className={`text-sm leading-relaxed mb-4 ${highContrast ? 'text-black' : 'text-white'}`}>
                            {result.analysis}
                        </p>
                        
                        {result.tactics.length > 0 && (
                            <div className="mt-auto">
                                <p className={`text-[10px] font-bold mb-2 uppercase ${highContrast ? 'text-gray-600' : 'text-sophon-warning'}`}>DETECTED TACTICS:</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.tactics.map((tactic, i) => (
                                        <span key={i} className={`text-[10px] px-2 py-1 rounded border ${highContrast ? 'bg-white border-black text-black' : 'bg-sophon-danger/10 border-sophon-danger/30 text-sophon-danger'}`}>
                                            {tactic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-xs font-mono">WAITING FOR INPUT DATA</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
