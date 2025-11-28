import React from 'react';
import { Report, VerdictType } from '../types';

interface LiveTickerProps {
  activeSector: string;
  threatLevel: string;
  reports: Report[];
  highContrast?: boolean;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ activeSector, threatLevel, reports, highContrast }) => {
  const verifiedNews = reports.filter(r => r.verdict === VerdictType.VERIFIED);
  const hasNews = verifiedNews.length > 0;

  const TickerContent = () => (
    <>
      {hasNews ? (
        verifiedNews.slice(0, 8).map((news) => (
            <span key={news.id} className="flex items-center gap-2 mx-4">
                <span className={highContrast ? 'text-white font-bold' : 'text-sophon-success'}>/// VERIFIED:</span>
                <span className={`font-bold ${highContrast ? 'text-white' : 'text-white'}`}>{news.topic}</span>
                <span className="text-gray-600">[{new Date(news.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
            </span>
        ))
      ) : (
         <>
            <span className="flex items-center gap-2 mx-4"><span className={highContrast ? 'text-white' : 'text-sophon-accent'}>/// MONITORING SECTOR: {activeSector}</span></span>
            <span className="flex items-center gap-2 mx-4"><span>/// SYSTEM THREAT LEVEL: <span className={threatLevel === 'HIGH' ? 'text-sophon-danger' : 'text-sophon-success'}>{threatLevel}</span></span></span>
            <span className="flex items-center gap-2 mx-4"><span>/// GLOBAL RAG NODES: ONLINE</span></span>
            <span className="flex items-center gap-2 mx-4"><span>/// SEARCH GROUNDING: ACTIVE</span></span>
         </>
      )}
    </>
  );

  return (
    <div 
        className={`w-full border-b h-8 flex items-center overflow-hidden relative z-40 ${highContrast ? 'bg-black border-white' : 'bg-sophon-dark border-white/10'}`}
        role="marquee"
        aria-live="polite"
    >
      <div className={`px-4 h-full flex items-center font-bold text-xs shrink-0 font-mono tracking-widest relative z-10 ${highContrast ? 'bg-white text-black' : 'bg-sophon-accent text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'}`}>
        LIVE WIRE
        {!highContrast && <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-sophon-dark to-transparent opacity-50"></div>}
      </div>
      
      {/* Ticker Container */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
         {/* If High Contrast, stop animation and just show first item static, or wrap nicely */}
         {highContrast ? (
             <div className="px-4 text-[10px] font-mono text-white flex gap-4 overflow-x-auto scrollbar-hide">
                 <TickerContent />
             </div>
         ) : (
            <div className="animate-marquee whitespace-nowrap flex items-center text-[10px] font-mono text-gray-400 absolute">
               <TickerContent />
               <TickerContent />
               <TickerContent />
            </div>
         )}
      </div>
      
      {!highContrast && <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-sophon-dark to-transparent pointer-events-none z-10"></div>}
    </div>
  );
};