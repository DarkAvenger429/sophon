
import React, { useEffect, useState } from 'react';
import { SophonLogo } from './SophonLogo';

interface AgentIDProps {
  xp: number;
  highContrast?: boolean;
}

// RANKING SYSTEM CONFIGURATION
const RANKS = [
    { name: 'INFORMANT', minXP: 0, unlock: 'Basic Feed' },
    { name: 'OBSERVER', minXP: 500, unlock: 'Auto-Scan Protocol' },
    { name: 'ANALYST', minXP: 2000, unlock: 'Deep RAG Analysis' },
    { name: 'SENTINEL', minXP: 5000, unlock: 'Threat Matrix Grid' },
    { name: 'ARCHITECT', minXP: 10000, unlock: 'God Mode (Simulated)' },
    { name: 'OMNI-MIND', minXP: 25000, unlock: 'Neural Sync' }
];

export const AgentID: React.FC<AgentIDProps> = ({ xp, highContrast }) => {
  const [currentRank, setCurrentRank] = useState(RANKS[0]);
  const [nextRank, setNextRank] = useState(RANKS[1]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Determine Rank
    let r = RANKS[0];
    let next = RANKS[1];
    
    for (let i = 0; i < RANKS.length; i++) {
        if (xp >= RANKS[i].minXP) {
            r = RANKS[i];
            next = RANKS[i + 1] || { name: 'MAX LEVEL', minXP: xp * 2, unlock: 'None' };
        }
    }
    setCurrentRank(r);
    setNextRank(next);

    // Calc Progress to next level
    const range = next.minXP - r.minXP;
    const gained = xp - r.minXP;
    const p = Math.min(100, Math.max(0, (gained / range) * 100));
    setProgress(p);

  }, [xp]);

  // Deterministic "Barcode" based on XP
  const barcode = Array(20).fill(0).map((_, i) => (xp + i) % 2 === 0 ? 'w-1' : 'w-3').join(' ');

  return (
    <div className={`relative p-5 rounded-xl border overflow-hidden group select-none transition-all duration-500 ${highContrast ? 'bg-white border-black text-black' : 'bg-black/80 border-sophon-accent/30 text-sophon-accent hover:border-sophon-accent/60'}`}>
        
        {/* Holographic Sheen Effect */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none`}></div>
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className={`relative w-14 h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden bg-black ${highContrast ? 'border-black' : 'border-sophon-accent shadow-[0_0_15px_rgba(0,240,255,0.3)]'}`}>
                     <SophonLogo className="w-full h-full object-cover opacity-90" />
                     {!highContrast && <div className="absolute inset-0 bg-sophon-accent/10 animate-pulse"></div>}
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest mb-1">OPERATIVE ID</div>
                    <div className={`font-bold font-mono text-lg tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>
                        {currentRank.name}
                    </div>
                    <div className={`text-[9px] px-1.5 py-0.5 rounded inline-block mt-1 ${highContrast ? 'bg-black text-white' : 'bg-sophon-accent/20 text-sophon-accent'}`}>
                        LVL {Math.floor(xp / 500) + 1}
                    </div>
                </div>
            </div>
            
            <div className="text-right">
                <div className="text-[9px] text-gray-500 font-mono mb-1">TOTAL EXPERTISE</div>
                <div className={`text-2xl font-bold font-mono tabular-nums ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>
                    {xp.toLocaleString()} <span className="text-xs text-gray-500">XP</span>
                </div>
            </div>
        </div>

        {/* Level Progress */}
        <div className="mb-2 flex justify-between text-[9px] font-mono opacity-80 uppercase">
            <span>Progress to {nextRank.name}</span>
            <span>{Math.floor(progress)}%</span>
        </div>
        <div className={`h-2 w-full rounded-full overflow-hidden mb-4 ${highContrast ? 'bg-gray-200 border border-gray-400' : 'bg-gray-900 border border-gray-700'}`}>
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${highContrast ? 'bg-black' : 'bg-gradient-to-r from-sophon-accent via-blue-500 to-purple-500'}`} 
                style={{ width: `${progress}%` }}
            >
                {!highContrast && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
            </div>
        </div>

        {/* Perks & Stats */}
        <div className={`grid grid-cols-2 gap-4 mt-4 pt-4 border-t ${highContrast ? 'border-gray-300' : 'border-white/10'}`}>
            <div>
                <span className="text-[9px] text-gray-500 block mb-1">CURRENT CLEARANCE</span>
                <span className={`text-xs font-bold ${highContrast ? 'text-black' : 'text-white'}`}>
                    {currentRank.unlock}
                </span>
            </div>
            <div className="text-right">
                <span className="text-[9px] text-gray-500 block mb-1">NEXT UNLOCK</span>
                <span className={`text-xs font-mono ${highContrast ? 'text-gray-500' : 'text-gray-400'}`}>
                    {nextRank.unlock}
                </span>
            </div>
        </div>

        {/* Footer Barcode */}
        <div className="mt-6 flex items-end justify-between opacity-50">
            <div className="flex h-8 items-end gap-0.5">
                {Array(25).fill(0).map((_, i) => (
                    <div key={i} className={`bg-current ${Math.random() > 0.5 ? 'w-0.5' : 'w-1'} h-full`}></div>
                ))}
            </div>
            <div className="text-[8px] font-mono text-right">
                <div>auth_sig: 0x{xp.toString(16).toUpperCase()}</div>
                <div>node_ver: 2.5.1</div>
            </div>
        </div>
    </div>
  );
};
