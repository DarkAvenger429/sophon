
import React, { useEffect, useState } from 'react';

interface AgentIDProps {
  reportCount: number;
  highContrast?: boolean;
}

export const AgentID: React.FC<AgentIDProps> = ({ reportCount, highContrast }) => {
  const [xp, setXp] = useState(0);
  
  // Calculate Rank
  const getRank = (xp: number) => {
      if (xp > 5000) return 'ARCHITECT';
      if (xp > 2000) return 'SENTINEL';
      if (xp > 500) return 'ANALYST';
      return 'OBSERVER';
  };

  useEffect(() => {
    // Load XP
    const saved = localStorage.getItem('sophon_xp');
    const current = saved ? parseInt(saved) : 0;
    
    // Add XP based on session reports (simple simulation)
    const newXp = current + (reportCount * 50); 
    setXp(newXp);
    localStorage.setItem('sophon_xp', newXp.toString());
  }, [reportCount]);

  const rank = getRank(xp);
  
  // Deterministic "Barcode" based on XP
  const barcode = Array(20).fill(0).map((_, i) => (xp + i) % 2 === 0 ? 'w-1' : 'w-3').join(' ');

  return (
    <div className={`relative p-4 rounded-xl border overflow-hidden group select-none ${highContrast ? 'bg-white border-black text-black' : 'bg-black/60 border-sophon-accent/30 text-sophon-accent'}`}>
        {/* Holographic Sheen Effect */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite] pointer-events-none`}></div>
        
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded border-2 flex items-center justify-center overflow-hidden bg-black ${highContrast ? 'border-black' : 'border-sophon-accent'}`}>
                     <img src="/logo.png" className="w-full h-full object-cover opacity-80" alt="Avatar" />
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 font-mono">OPERATIVE ID</div>
                    <div className={`font-bold font-mono text-sm tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>
                        {rank}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[9px] text-gray-500 font-mono">CLEARANCE LVL</div>
                <div className="text-xl font-bold font-mono">0{Math.floor(xp / 500) + 1}</div>
            </div>
        </div>

        {/* XP Bar */}
        <div className="mb-1 flex justify-between text-[9px] font-mono opacity-70">
            <span>XP PROGRESS</span>
            <span>{xp % 500} / 500</span>
        </div>
        <div className={`h-1.5 w-full rounded-full ${highContrast ? 'bg-gray-200' : 'bg-gray-800'}`}>
            <div 
                className={`h-full rounded-full transition-all duration-1000 ${highContrast ? 'bg-black' : 'bg-gradient-to-r from-sophon-accent to-purple-500'}`} 
                style={{ width: `${(xp % 500) / 5}%` }}
            ></div>
        </div>

        {/* Footer Barcode */}
        <div className="mt-4 flex items-end justify-between opacity-50">
            <div className="flex h-6 items-end gap-0.5">
                {Array(15).fill(0).map((_, i) => (
                    <div key={i} className={`bg-current ${Math.random() > 0.5 ? 'w-0.5' : 'w-1.5'} h-full`}></div>
                ))}
            </div>
            <div className="text-[8px] font-mono">auth_sig: 0x{xp.toString(16)}</div>
        </div>
    </div>
  );
};
