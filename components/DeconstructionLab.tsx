
import React, { useState } from 'react';

// --- SUB-MODULES ---

const VisualForensicsModule = ({ onExit }: { onExit: () => void }) => {
    return (
        <div className="p-6 rounded-lg border bg-black/40 text-center animate-fadeIn border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">VISUAL FORENSICS LAB</h3>
            <p className="text-sm text-gray-400 mb-6">Identify the image containing AI Artifacts.</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-square bg-gray-800 rounded flex flex-col items-center justify-center border border-gray-700 cursor-pointer hover:border-sophon-accent hover:bg-white/5 transition-all group">
                        <div className="text-2xl mb-2 opacity-50 group-hover:opacity-100">{i === 2 ? '🤖' : '📸'}</div>
                        <span className="text-[10px] text-gray-500 font-mono">SAMPLE {i}</span>
                    </div>
                ))}
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-left mb-6">
                <p className="text-[10px] text-blue-300 font-bold mb-1">PRO TIP:</p>
                <p className="text-xs text-gray-300">Look for "glitching" text in backgrounds, asymmetrical eyes, and hands with incorrect finger counts (Polydactyly).</p>
            </div>

            <button onClick={onExit} className="text-xs font-mono text-gray-500 hover:text-white underline">BACK TO SIMULATION</button>
        </div>
    );
};

const SourceVettingModule = ({ onExit }: { onExit: () => void }) => {
    return (
        <div className="p-6 rounded-lg border bg-black/40 animate-fadeIn border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">SOURCE VETTING PROTOCOL</h3>
            <input type="text" placeholder="Paste URL to verify..." className="w-full p-3 bg-black border border-gray-700 rounded mb-4 text-sm text-white focus:border-sophon-accent focus:outline-none" />
            
            <div className="space-y-3 text-sm text-gray-300 mb-6">
                <label className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" className="accent-sophon-accent" /> 
                    <span>Check Domain Age (Whois Lookup)</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" className="accent-sophon-accent" /> 
                    <span>Look for 'About Us' & Author Bios</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" className="accent-sophon-accent" /> 
                    <span>Cross-reference Claims on Snopes/Reuters</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" className="accent-sophon-accent" /> 
                    <span>Check for "Rage Bait" Headlines</span>
                </label>
            </div>
            
            <button onClick={onExit} className="w-full text-center text-xs font-mono text-gray-500 hover:text-white underline">BACK TO SIMULATION</button>
        </div>
    );
};

// --- FAKE POST DATA ---
interface Hotspot { id: string; x: number; y: number; label: string; description: string; tactic: string; }
const FAKE_POST = {
  author: "RealTruthPatriot",
  handle: "@RealTruth_1776",
  time: "2h ago",
  content: "BREAKING: Leaked documents PROVE that the new 'Climate Lockdowns' will ban all meat consumption by 2026! They don't want you to see this!! 😡🥩🚫 #Freedom #WakeUp",
  imagePrompt: "A hyper-realistic AI image of a sad family eating bugs at a table, with a SWAT team guarding a fridge full of steaks.",
  url: "www.freedom-news-alert-24.xyz/leaked-docs",
  hotspots: [
    { id: 'h1', x: 15, y: 15, label: 'SUSPICIOUS HANDLE', description: "Generic username with random numbers (1776) often signals a bot or propaganda account.", tactic: "IDENTITY SPOOFING" },
    { id: 'h2', x: 50, y: 35, label: 'EMOTIONAL TRIGGER', description: "Use of 'BREAKING', 'PROVE', and rage-inducing claims is designed to bypass critical thinking.", tactic: "RAGE BAIT" },
    { id: 'h3', x: 80, y: 40, label: 'FALSE URGENCY', description: "'They don't want you to see this!!' creates a conspiracy frame.", tactic: "US VS THEM FRAMING" },
    { id: 'h4', x: 50, y: 70, label: 'AI ARTIFACTS', description: "Look closely at the 'SWAT Team'. The fingers are merged. This is AI-generated.", tactic: "VISUAL FABRICATION" },
    { id: 'h5', x: 50, y: 90, label: 'SPOOFED DOMAIN', description: "'.xyz' domains with hyphens are cheap and often used for burner scam sites.", tactic: "TYPOSQUATTING" }
  ] as Hotspot[]
};

const PostAnalysisModule = ({ highContrast }: { highContrast?: boolean }) => {
    const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    const handleReveal = (hotspot: Hotspot) => {
        setActiveHotspot(hotspot);
        setRevealedIds(prev => new Set(prev).add(hotspot.id));
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
            {/* LEFT: THE FAKE POST */}
            <div className="flex-1 relative group">
                <div className="mb-4">
                     <h2 className={`text-lg font-bold font-mono tracking-widest mb-1 ${highContrast ? 'text-black' : 'text-white'}`}>DECONSTRUCTION LAB</h2>
                     <p className={`text-xs font-mono ${highContrast ? 'text-gray-600' : 'text-gray-400'}`}>IDENTIFY THE 5 ANOMALIES IN THIS POST</p>
                </div>

                <div className={`p-4 rounded-lg border relative ${highContrast ? 'bg-gray-100 border-black' : 'bg-[#111] border-gray-700'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-600"></div>
                        <div>
                            <p className={`font-bold text-sm ${highContrast ? 'text-black' : 'text-white'}`}>{FAKE_POST.author}</p>
                            <p className="text-xs text-gray-500">{FAKE_POST.handle} • {FAKE_POST.time}</p>
                        </div>
                    </div>
                    <p className={`text-sm mb-4 leading-relaxed ${highContrast ? 'text-black' : 'text-gray-200'}`}>{FAKE_POST.content}</p>
                    <div className="w-full h-48 bg-gray-800 rounded mb-4 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                        <p className="text-xs text-gray-500 text-center px-4 italic">[AI GENERATED IMAGE: {FAKE_POST.imagePrompt}]</p>
                    </div>
                    <div className={`p-3 rounded border ${highContrast ? 'bg-white border-black' : 'bg-black/40 border-gray-700'}`}>
                        <p className="text-[10px] text-gray-500 uppercase">freedom-news-alert-24.xyz</p>
                        <p className={`text-xs font-bold truncate ${highContrast ? 'text-black' : 'text-white'}`}>LEAKED: The End of Meat Consumption...</p>
                    </div>
                    {/* HOTSPOTS */}
                    {FAKE_POST.hotspots.map((hotspot) => (
                        <button
                            key={hotspot.id}
                            style={{ top: `${hotspot.y}%`, left: `${hotspot.x}%` }}
                            onClick={() => handleReveal(hotspot)}
                            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center transition-all z-10 hover:scale-110 ${
                                revealedIds.has(hotspot.id) 
                                    ? highContrast ? 'bg-black text-white border-2 border-white' : 'bg-sophon-success text-black shadow-[0_0_10px_#00ff9f]' 
                                    : highContrast ? 'bg-white border-2 border-black animate-pulse' : 'bg-sophon-danger text-white animate-pulse shadow-[0_0_10px_#ff003c]'
                            }`}
                        >
                            ?
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: ANALYSIS PANEL */}
            <div className="flex-1">
                {activeHotspot ? (
                    <div className="animate-fadeIn h-full flex flex-col justify-center">
                        <div className={`text-xs font-bold mb-2 uppercase tracking-widest ${highContrast ? 'text-gray-600' : 'text-sophon-accent'}`}>TACTIC IDENTIFIED: {activeHotspot.tactic}</div>
                        <h3 className={`text-2xl font-bold mb-4 font-mono ${highContrast ? 'text-black' : 'text-white'}`}>{activeHotspot.label}</h3>
                        <p className={`text-sm leading-relaxed mb-6 ${highContrast ? 'text-black' : 'text-gray-300'}`}>{activeHotspot.description}</p>
                        <div className={`p-4 rounded border-l-4 ${highContrast ? 'bg-gray-100 border-black' : 'bg-sophon-success/10 border-sophon-success'}`}>
                            <p className={`text-xs font-bold mb-1 ${highContrast ? 'text-black' : 'text-sophon-success'}`}>DEFENSE PROTOCOL:</p>
                            <p className={`text-xs ${highContrast ? 'text-black' : 'text-gray-400'}`}>Always verify sensational claims with a neutral search. Check the domain registration date.</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <span className="text-4xl mb-4">🔍</span>
                        <p className={`font-mono text-sm ${highContrast ? 'text-black' : 'text-white'}`}>SELECT A HOTSPOT (?) TO BEGIN ANALYSIS</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const DeconstructionLab = ({ highContrast }: { highContrast?: boolean }) => {
  // RESTORED: Default view is now the PostAnalysisModule (5 question marks)
  // This satisfies the request to "restore the module where an image had 5 question marks"
  const [activeModule, setActiveModule] = useState<'POST_ANALYSIS' | 'DEEPFAKE' | 'SOURCE'>('POST_ANALYSIS');

  if (activeModule === 'DEEPFAKE') return <VisualForensicsModule onExit={() => setActiveModule('POST_ANALYSIS')} />;
  if (activeModule === 'SOURCE') return <SourceVettingModule onExit={() => setActiveModule('POST_ANALYSIS')} />;

  return (
    <div className={`w-full p-6 rounded-lg border-2 transition-all ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/30 shadow-[0_0_20px_rgba(0,0,0,0.3)]'}`}>
      <PostAnalysisModule highContrast={highContrast} />
      
      {/* Mini Nav for other modules */}
      <div className="mt-8 pt-6 border-t border-gray-700 flex justify-center gap-4">
          <button onClick={() => setActiveModule('DEEPFAKE')} className="text-[10px] text-gray-500 hover:text-white font-mono uppercase tracking-widest hover:underline">
              VISUAL FORENSICS
          </button>
          <span className="text-gray-700">|</span>
          <button onClick={() => setActiveModule('SOURCE')} className="text-[10px] text-gray-500 hover:text-white font-mono uppercase tracking-widest hover:underline">
              SOURCE VETTING
          </button>
      </div>
    </div>
  );
};
