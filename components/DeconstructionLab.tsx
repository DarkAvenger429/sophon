import React, { useState } from 'react';

interface Hotspot {
  id: string;
  x: number; // %
  y: number; // %
  label: string;
  description: string;
  tactic: string;
}

const FAKE_POST = {
  author: "RealTruthPatriot",
  handle: "@RealTruth_1776",
  time: "2h ago",
  content: "BREAKING: Leaked documents PROVE that the new 'Climate Lockdowns' will ban all meat consumption by 2026! They don't want you to see this!! 😡🥩🚫 #Freedom #WakeUp",
  imagePrompt: "A hyper-realistic AI image of a sad family eating bugs at a table, with a SWAT team guarding a fridge full of steaks.",
  url: "www.freedom-news-alert-24.xyz/leaked-docs",
  hotspots: [
    {
        id: 'h1', x: 15, y: 15, 
        label: 'SUSPICIOUS HANDLE', 
        description: "Generic username with random numbers (1776) often signals a bot or propaganda account designed to appeal to specific political biases.",
        tactic: "IDENTITY SPOOFING"
    },
    {
        id: 'h2', x: 50, y: 35, 
        label: 'EMOTIONAL TRIGGER', 
        description: "Use of 'BREAKING', 'PROVE', and rage-inducing claims (banning meat) is designed to bypass critical thinking and trigger immediate anger.",
        tactic: "RAGE BAIT"
    },
    {
        id: 'h3', x: 80, y: 40, 
        label: 'FALSE URGENCY', 
        description: "'They don't want you to see this!!' creates a conspiracy frame, making the reader feel like an insider fighting a suppressor.",
        tactic: "US VS THEM FRAMING"
    },
    {
        id: 'h4', x: 50, y: 70, 
        label: 'AI ARTIFACTS', 
        description: "Look closely at the 'SWAT Team'. The fingers are merged, and the text on the uniform is gibberish. This image is AI-generated to visualize a fear.",
        tactic: "VISUAL FABRICATION"
    },
    {
        id: 'h5', x: 50, y: 90, 
        label: 'SPOOFED DOMAIN', 
        description: "'.xyz' domains with hyphens (freedom-news-alert) are cheap and often used for burner scam sites. Legitimate news uses root domains (bbc.com).",
        tactic: "TYPOSQUATTING"
    }
  ] as Hotspot[]
};

export const DeconstructionLab = ({ highContrast }: { highContrast?: boolean }) => {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const handleReveal = (hotspot: Hotspot) => {
    setActiveHotspot(hotspot);
    if (!revealedIds.has(hotspot.id)) {
        const newSet = new Set(revealedIds);
        newSet.add(hotspot.id);
        setRevealedIds(newSet);
        setRevealedCount(prev => prev + 1);
    }
  };

  return (
    <div className={`w-full p-6 rounded-lg border-2 ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/30'}`}>
      
      <div className="flex justify-between items-start mb-6">
          <div>
              <h2 className={`text-xl font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>DECONSTRUCTION LAB</h2>
              <p className={`text-xs font-mono ${highContrast ? 'text-gray-600' : 'text-gray-400'}`}>
                  ANATOMY OF DISINFORMATION // Find the {FAKE_POST.hotspots.length} manipulation tactics
              </p>
          </div>
          <div className={`px-3 py-1 rounded font-mono text-xs font-bold ${highContrast ? 'bg-black text-white' : 'bg-sophon-accent text-black'}`}>
              DETECTED: {revealedCount} / {FAKE_POST.hotspots.length}
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: THE FAKE POST */}
          <div className="flex-1 relative group">
              <div className={`p-4 rounded-lg border relative ${highContrast ? 'bg-gray-100 border-black' : 'bg-[#111] border-gray-700'}`}>
                  
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600"></div>
                      <div>
                          <p className={`font-bold text-sm ${highContrast ? 'text-black' : 'text-white'}`}>{FAKE_POST.author}</p>
                          <p className="text-xs text-gray-500">{FAKE_POST.handle} • {FAKE_POST.time}</p>
                      </div>
                  </div>

                  {/* Content */}
                  <p className={`text-sm mb-4 leading-relaxed ${highContrast ? 'text-black' : 'text-gray-200'}`}>
                      {FAKE_POST.content}
                  </p>

                  {/* Image Placeholder */}
                  <div className="w-full h-48 bg-gray-800 rounded mb-4 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                      <p className="text-xs text-gray-500 text-center px-4 italic">
                          [AI GENERATED IMAGE: {FAKE_POST.imagePrompt}]
                      </p>
                  </div>

                  {/* Link Preview */}
                  <div className={`p-3 rounded border ${highContrast ? 'bg-white border-black' : 'bg-black/40 border-gray-700'}`}>
                      <p className="text-[10px] text-gray-500 uppercase">freedom-news-alert-24.xyz</p>
                      <p className={`text-xs font-bold truncate ${highContrast ? 'text-black' : 'text-white'}`}>LEAKED: The End of Meat Consumption...</p>
                  </div>

                  {/* OVERLAY HOTSPOTS */}
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
                      <div className={`text-xs font-bold mb-2 uppercase tracking-widest ${highContrast ? 'text-gray-600' : 'text-sophon-accent'}`}>
                          TACTIC IDENTIFIED: {activeHotspot.tactic}
                      </div>
                      <h3 className={`text-2xl font-bold mb-4 font-mono ${highContrast ? 'text-black' : 'text-white'}`}>
                          {activeHotspot.label}
                      </h3>
                      <p className={`text-sm leading-relaxed mb-6 ${highContrast ? 'text-black' : 'text-gray-300'}`}>
                          {activeHotspot.description}
                      </p>
                      <div className={`p-4 rounded border-l-4 ${highContrast ? 'bg-gray-100 border-black' : 'bg-sophon-success/10 border-sophon-success'}`}>
                          <p className={`text-xs font-bold mb-1 ${highContrast ? 'text-black' : 'text-sophon-success'}`}>DEFENSE PROTOCOL:</p>
                          <p className={`text-xs ${highContrast ? 'text-black' : 'text-gray-400'}`}>
                              Always verify sensational claims with a neutral search. Check the domain registration date. Zoom into images to spot inconsistencies.
                          </p>
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mb-4 ${highContrast ? 'text-black' : 'text-sophon-accent'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className={`font-mono text-sm ${highContrast ? 'text-black' : 'text-white'}`}>SELECT A HOTSPOT TO BEGIN ANALYSIS</p>
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};