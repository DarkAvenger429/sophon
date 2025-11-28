import React from 'react';

export const RadarPulse = ({ active }: { active: boolean }) => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
       {/* Base Circle */}
      <div className="absolute inset-0 rounded-full border border-sophon-accent/20"></div>
      
      {/* Inner Circle */}
      <div className="absolute w-16 h-16 rounded-full border border-sophon-accent/40 bg-sophon-accent/5"></div>

      {/* Scanning Line */}
      {active && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
             <div className="w-full h-1/2 bg-gradient-to-b from-transparent to-sophon-accent/20 animate-spin origin-bottom border-b border-sophon-accent/50" style={{ transformOrigin: '50% 100%', animationDuration: '2s' }}></div>
        </div>
      )}

      {/* Center Dot */}
      <div className={`relative z-10 w-2 h-2 rounded-full ${active ? 'bg-sophon-accent animate-pulse' : 'bg-gray-600'}`}></div>

      {active && (
         <>
          <div className="absolute inset-0 rounded-full border border-sophon-accent/30 animate-[ping_2s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full border border-sophon-accent/10 animate-[ping_2s_linear_infinite_1s]"></div>
         </>
      )}
    </div>
  );
};
